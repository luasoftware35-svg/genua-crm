"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Building2,
  Download,
  Mail,
  Search,
  Trash2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AddCompanyDialog } from "@/components/companies/add-company-dialog";
import { CsvImportDialog } from "@/components/companies/csv-import-dialog";
import { DataManagementDialog } from "@/components/companies/data-management-dialog";
import { PdfImportDialog } from "@/components/companies/pdf-import-dialog";
import { useCrm } from "@/context/crm-context";
import {
  AUDIT_STATUSES,
  DEAL_STAGES,
  getStageLabel,
  SOURCES,
} from "@/lib/constants";
import { companiesToCsv, downloadCsv } from "@/lib/crm-export";

const ALL = "__all__";

export function CompaniesTable() {
  const {
    getCompaniesWithDeals,
    getCities,
    bulkDeleteCompanies,
    bulkMarkMailSent,
  } = useCrm();
  const router = useRouter();
  const companies = getCompaniesWithDeals();
  const cities = getCities();

  const [search, setSearch] = useState("");
  const [sourceFilter, setSourceFilter] = useState(ALL);
  const [cityFilter, setCityFilter] = useState(ALL);
  const [sectorFilter, setSectorFilter] = useState(ALL);
  const [auditFilter, setAuditFilter] = useState(ALL);
  const [stageFilter, setStageFilter] = useState(ALL);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const sectors = useMemo(() => {
    const set = new Set<string>();
    for (const c of companies) {
      if (c.sector) set.add(c.sector);
    }
    return Array.from(set).sort();
  }, [companies]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return [...companies]
      .filter((c) => {
        if (sourceFilter !== ALL && (c.source ?? "Diğer") !== sourceFilter) return false;
        if (cityFilter !== ALL && (c.city ?? "") !== cityFilter) return false;
        if (sectorFilter !== ALL && c.sector !== sectorFilter) return false;
        if (auditFilter !== ALL && (c.audit_status ?? "bilinmiyor") !== auditFilter) return false;
        if (stageFilter !== ALL && c.deal?.stage !== stageFilter) return false;
        if (!q) return true;
        return (
          c.name.toLowerCase().includes(q) ||
          (c.sector?.toLowerCase().includes(q) ?? false) ||
          (c.email?.toLowerCase().includes(q) ?? false) ||
          (c.phone?.includes(q) ?? false) ||
          (c.website?.toLowerCase().includes(q) ?? false) ||
          (c.member_no?.includes(q) ?? false) ||
          (c.city?.toLowerCase().includes(q) ?? false)
        );
      })
      .sort((a, b) => {
        const na = a.member_no ? parseInt(a.member_no, 10) : 99999;
        const nb = b.member_no ? parseInt(b.member_no, 10) : 99999;
        return na - nb;
      });
  }, [companies, search, sourceFilter, cityFilter, sectorFilter, auditFilter, stageFilter]);

  const allFilteredSelected =
    filtered.length > 0 && filtered.every((c) => selected.has(c.id));

  const toggleAll = () => {
    if (allFilteredSelected) {
      setSelected((prev) => {
        const next = new Set(prev);
        filtered.forEach((c) => next.delete(c.id));
        return next;
      });
    } else {
      setSelected((prev) => {
        const next = new Set(prev);
        filtered.forEach((c) => next.add(c.id));
        return next;
      });
    }
  };

  const toggleOne = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectedIds = Array.from(selected);

  const handleExport = (scope: "all" | "selected" | "filtered") => {
    let rows = companies;
    if (scope === "selected") rows = companies.filter((c) => selected.has(c.id));
    if (scope === "filtered") rows = filtered;
    downloadCsv(
      `genua-firmalar-${new Date().toISOString().slice(0, 10)}.csv`,
      companiesToCsv(rows)
    );
  };

  const handleBulkDelete = async () => {
    if (!selectedIds.length) return;
    if (!confirm(`${selectedIds.length} firma silinsin mi?`)) return;
    await bulkDeleteCompanies(selectedIds);
    setSelected(new Set());
  };

  const handleBulkMail = async () => {
    if (!selectedIds.length) return;
    await bulkMarkMailSent(selectedIds);
    setSelected(new Set());
    alert(`${selectedIds.length} firma "Mail Atıldı" olarak işaretlendi.`);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Firma, sektör, şehir, e-posta ara..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <PdfImportDialog label="PDF Yükle" />
          <CsvImportDialog />
          <AddCompanyDialog />
          <Button variant="outline" size="sm" onClick={() => handleExport("filtered")}>
            <Download className="mr-2 h-4 w-4" />
            CSV Export
          </Button>
          <DataManagementDialog />
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Select value={sourceFilter} onValueChange={setSourceFilter}>
          <SelectTrigger className="w-[130px]">
            <SelectValue placeholder="Kaynak" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Tüm kaynaklar</SelectItem>
            {SOURCES.map((s) => (
              <SelectItem key={s} value={s}>
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={cityFilter} onValueChange={setCityFilter}>
          <SelectTrigger className="w-[130px]">
            <SelectValue placeholder="Şehir" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Tüm şehirler</SelectItem>
            {cities.map((c) => (
              <SelectItem key={c.slug} value={c.name}>
                {c.name} ({c.count})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={sectorFilter} onValueChange={setSectorFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Sektör" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Tüm sektörler</SelectItem>
            {sectors.map((s) => (
              <SelectItem key={s} value={s}>
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={auditFilter} onValueChange={setAuditFilter}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Denetim" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Tüm denetimler</SelectItem>
            {AUDIT_STATUSES.map((s) => (
              <SelectItem key={s.value} value={s.value}>
                {s.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={stageFilter} onValueChange={setStageFilter}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Pipeline" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Tüm aşamalar</SelectItem>
            {DEAL_STAGES.map((s) => (
              <SelectItem key={s.value} value={s.value}>
                {s.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {selectedIds.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 rounded-lg border bg-muted/40 p-3">
          <Badge variant="secondary">{selectedIds.length} seçili</Badge>
          <Button size="sm" variant="outline" onClick={handleBulkMail}>
            <Mail className="mr-2 h-4 w-4" />
            Mail Atıldı İşaretle
          </Button>
          <Button size="sm" variant="outline" onClick={() => handleExport("selected")}>
            <Download className="mr-2 h-4 w-4" />
            Seçilenleri Export
          </Button>
          <Button size="sm" variant="destructive" onClick={handleBulkDelete}>
            <Trash2 className="mr-2 h-4 w-4" />
            Seçilenleri Sil
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setSelected(new Set())}>
            Seçimi Temizle
          </Button>
        </div>
      )}

      {companies.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center gap-4 py-16 text-center">
            <Building2 className="h-12 w-12 text-muted-foreground" />
            <div>
              <p className="text-lg font-medium">Henüz firma yok</p>
              <p className="text-sm text-muted-foreground max-w-md mt-1">
                BOSB veya SOSB PDF&apos;nizi yükleyin — firmalar tek tek listelenir.
              </p>
            </div>
            <PdfImportDialog label="PDF Yükle ve Başla" />
          </CardContent>
        </Card>
      ) : (
        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">
                  <Checkbox checked={allFilteredSelected} onCheckedChange={toggleAll} />
                </TableHead>
                <TableHead className="w-16 whitespace-nowrap">No</TableHead>
                <TableHead className="min-w-[200px]">Firma Adı</TableHead>
                <TableHead className="w-24">Şehir</TableHead>
                <TableHead className="min-w-[120px]">Sektör</TableHead>
                <TableHead className="whitespace-nowrap">Telefon</TableHead>
                <TableHead className="min-w-[150px]">E-posta</TableHead>
                <TableHead className="min-w-[130px]">Web Sitesi</TableHead>
                <TableHead className="w-28">Pipeline</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="h-24 text-center text-muted-foreground">
                    Filtreye uygun firma yok.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((company) => (
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
                    <TableCell className="text-muted-foreground font-mono text-sm">
                      {company.member_no ?? "—"}
                    </TableCell>
                    <TableCell className="font-medium text-sm">{company.name}</TableCell>
                    <TableCell className="text-sm">{company.city ?? "—"}</TableCell>
                    <TableCell className="text-sm">{company.sector ?? "—"}</TableCell>
                    <TableCell className="text-sm whitespace-nowrap">{company.phone ?? "—"}</TableCell>
                    <TableCell className="text-sm">{company.email ?? "—"}</TableCell>
                    <TableCell className="text-sm">
                      {company.website ? (
                        <a
                          href={
                            company.website.startsWith("http")
                              ? company.website
                              : `https://${company.website}`
                          }
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline truncate block max-w-[160px]"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {company.website.replace(/^https?:\/\//, "")}
                        </a>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {company.deal ? getStageLabel(company.deal.stage) : "—"}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {companies.length > 0 && (
        <p className="text-sm text-muted-foreground">
          {filtered.length} / {companies.length} firma listeleniyor
        </p>
      )}
    </div>
  );
}
