"use client";

import { notFound } from "next/navigation";
import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, FileText, Mail, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PdfImportDialog, type PdfImportResult } from "@/components/companies/pdf-import-dialog";
import { getAuditStatusColor, getAuditStatusLabel, getStageLabel } from "@/lib/constants";
import { useCrm } from "@/context/crm-context";

export function CityDetailClient({ slug }: { slug: string }) {
  const router = useRouter();
  const { getCities, getCompaniesByCity, getCityContacts, getContactsByCompanyId, updateDeal, createActivity } =
    useCrm();
  const cityName = getCities().find((c) => c.slug === slug)?.name;
  if (!cityName) notFound();

  const companies = getCompaniesByCity(cityName);
  const allContacts = getCityContacts(cityName);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [importMsg, setImportMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const handlePdfImported = (result: PdfImportResult) => {
    const parts: string[] = [];
    if (result.total > 0) parts.push(`${result.total} firma PDF'den okundu`);
    if (result.created > 0) parts.push(`${result.created} yeni eklendi`);
    if (result.updated > 0) parts.push(`${result.updated} güncellendi`);
    if (parts.length) {
      setImportMsg({ type: "ok", text: parts.join(" · ") + " — listede görünüyor." });
    } else if (result.failed.length) {
      setImportMsg({ type: "err", text: result.failed.join(" · ") });
    }
  };

  const withEmail = useMemo(
    () =>
      companies.filter(
        (c) => c.email || getContactsByCompanyId(c.id).some((ct) => ct.email)
      ),
    [companies, getContactsByCompanyId]
  );

  const toggleAll = () => {
    if (selected.size === companies.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(companies.map((c) => c.id)));
    }
  };

  const toggleOne = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  };

  const handleBulkReportSent = () => {
    for (const id of Array.from(selected)) {
      const company = companies.find((c) => c.id === id);
      if (!company?.deal) continue;
      updateDeal(company.deal.id, { stage: "mail_atildi" });
      createActivity({
        company_id: id,
        deal_id: company.deal.id,
        type: "mail",
        note: "Denetim raporu gönderildi (panel üzerinden toplu işlem).",
      });
    }
    alert(`${selected.size} firmaya rapor gönderildi olarak işaretlendi. Titan bağlantısı sonraki adım.`);
    setSelected(new Set());
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/cities">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{cityName}</h1>
          <p className="text-muted-foreground">Firma listesi, iletişimler ve toplu gönderim</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Firmalar</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{companies.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">İletişim Kişileri</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{allContacts.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">E-posta Mevcut</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{withEmail.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* PDF + toplu gönderim */}
      <Card>
        <CardHeader>
          <CardTitle>Firma Yükle & Toplu Gönderim</CardTitle>
          <CardDescription>
            PDF seç → firmalar otomatik panele eklenir. Listeden seç → rapor veya mail gönder.
            Titan Mail sonraki adımda bağlanacak.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-3">
            <PdfImportDialog
              defaultCity={cityName}
              label="PDF'den Firma Ekle"
              onImported={handlePdfImported}
            />
            <Button
              variant="default"
              disabled={selected.size === 0}
              onClick={handleBulkReportSent}
            >
              <FileText className="mr-2 h-4 w-4" />
              Rapor Gönderildi İşaretle ({selected.size})
            </Button>
            <Button variant="outline" disabled title="Titan Mail bağlantısı sonraki adım">
              <Mail className="mr-2 h-4 w-4" />
              Toplu Mail Gönder (Titan)
            </Button>
          </div>
          {importMsg && (
            <p
              className={`rounded-lg border p-3 text-sm ${
                importMsg.type === "ok"
                  ? "border-emerald-200 bg-emerald-50 text-emerald-900"
                  : "border-red-200 bg-red-50 text-red-900"
              }`}
            >
              {importMsg.text}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Firma tablosu */}
      <div>
        <h2 className="text-lg font-semibold mb-3">Firmalar ({companies.length})</h2>
        <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">
                <Checkbox
                  checked={selected.size === companies.length && companies.length > 0}
                  onCheckedChange={toggleAll}
                />
              </TableHead>
              <TableHead>Firma</TableHead>
              <TableHead>İletişim</TableHead>
              <TableHead>Denetim</TableHead>
              <TableHead>Pipeline</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {companies.map((company) => {
              const contacts = getContactsByCompanyId(company.id);
              const primary = contacts.find((c) => c.is_primary) ?? contacts[0];
              return (
                <TableRow
                  key={company.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => router.push(`/companies/${company.id}`)}
                >
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <Checkbox
                      checked={selected.has(company.id)}
                      onCheckedChange={() => toggleOne(company.id)}
                    />
                  </TableCell>
                  <TableCell>
                    <p className="font-medium">{company.name}</p>
                    <p className="text-xs text-muted-foreground">{company.website ?? company.email ?? "—"}</p>
                  </TableCell>
                  <TableCell>
                    {primary ? (
                      <div className="text-sm">
                        <p>{primary.full_name}</p>
                        <p className="text-xs text-muted-foreground">{primary.email ?? primary.phone ?? "—"}</p>
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Users className="h-3 w-3" /> Kişi yok
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge className={getAuditStatusColor(company.audit_status)}>
                      {getAuditStatusLabel(company.audit_status)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {company.deal ? (
                      <Badge variant="secondary">{getStageLabel(company.deal.stage)}</Badge>
                    ) : (
                      "—"
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
        </div>
      </div>

      {/* İletişim listesi */}
      <div>
        <h2 className="text-lg font-semibold mb-3">İletişim Listesi ({allContacts.length})</h2>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Firma</TableHead>
                <TableHead>Kişi</TableHead>
                <TableHead>E-posta</TableHead>
                <TableHead>Telefon</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {allContacts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                    Henüz iletişim kişisi yok. PDF&apos;de e-posta varsa otomatik eklenir; yoksa firma
                    detayından kişi ekleyebilirsin.
                  </TableCell>
                </TableRow>
              ) : (
                allContacts.map((contact) => (
                  <TableRow
                    key={contact.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => router.push(`/companies/${contact.company.id}`)}
                  >
                    <TableCell className="font-medium">{contact.company.name}</TableCell>
                    <TableCell>{contact.full_name}</TableCell>
                    <TableCell>{contact.email ?? "—"}</TableCell>
                    <TableCell>{contact.phone ?? "—"}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
