"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Building2, Search } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
import { PdfImportDialog } from "@/components/companies/pdf-import-dialog";
import { useCrm } from "@/context/crm-context";

export function CompaniesTable() {
  const { getCompaniesWithDeals } = useCrm();
  const router = useRouter();
  const companies = getCompaniesWithDeals();
  const [search, setSearch] = useState("");

  const sorted = useMemo(() => {
    return [...companies].sort((a, b) => {
      const na = a.member_no ? parseInt(a.member_no, 10) : 99999;
      const nb = b.member_no ? parseInt(b.member_no, 10) : 99999;
      return na - nb;
    });
  }, [companies]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    if (!q) return sorted;
    return sorted.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        (c.sector?.toLowerCase().includes(q) ?? false) ||
        (c.email?.toLowerCase().includes(q) ?? false) ||
        (c.phone?.includes(q) ?? false) ||
        (c.website?.toLowerCase().includes(q) ?? false) ||
        (c.member_no?.includes(q) ?? false)
    );
  }, [sorted, search]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Firma, sektör, e-posta ara..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <PdfImportDialog label="PDF Yükle" />
          <CsvImportDialog />
          <AddCompanyDialog />
        </div>
      </div>

      {companies.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center gap-4 py-16 text-center">
            <Building2 className="h-12 w-12 text-muted-foreground" />
            <div>
              <p className="text-lg font-medium">Henüz firma yok</p>
              <p className="text-sm text-muted-foreground max-w-md mt-1">
                BOSB En Büyük 50 gibi PDF&apos;nizi yükleyin — No, Firma Adı, Sektör,
                Telefon, E-posta, Web Sitesi sütunlarıyla tek tek listelenir.
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
                <TableHead className="w-16 whitespace-nowrap">No</TableHead>
                <TableHead className="min-w-[220px]">Firma Adı</TableHead>
                <TableHead className="min-w-[140px]">Sektör</TableHead>
                <TableHead className="whitespace-nowrap">Telefon</TableHead>
                <TableHead className="min-w-[160px]">E-posta</TableHead>
                <TableHead className="min-w-[140px]">Web Sitesi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                    Arama sonucu bulunamadı.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((company) => (
                  <TableRow
                    key={company.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => router.push(`/companies/${company.id}`)}
                  >
                    <TableCell className="text-muted-foreground font-mono text-sm">
                      {company.member_no ?? "—"}
                    </TableCell>
                    <TableCell className="font-medium text-sm">{company.name}</TableCell>
                    <TableCell className="text-sm">{company.sector ?? "—"}</TableCell>
                    <TableCell className="text-sm whitespace-nowrap">{company.phone ?? "—"}</TableCell>
                    <TableCell className="text-sm">{company.email ?? "—"}</TableCell>
                    <TableCell className="text-sm">
                      {company.website ? (
                        <a
                          href={company.website.startsWith("http") ? company.website : `https://${company.website}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline truncate block max-w-[180px]"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {company.website.replace(/^https?:\/\//, "")}
                        </a>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {companies.length > 0 && (
        <p className="text-sm text-muted-foreground">{filtered.length} firma listeleniyor</p>
      )}
    </div>
  );
}
