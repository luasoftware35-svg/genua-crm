"use client";

import { useMemo, useRef, useState } from "react";
import { FileText, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useCrm } from "@/context/crm-context";
import { inferCityFromImport, inferSourceFromFilename } from "@/lib/cities";
import type { ImportCompanyInput } from "@/lib/crm-import";
import { extractTextFromPdf } from "@/lib/pdf-extract";
import {
  classifyPdfDocument,
  extractCompaniesFromPdf,
  guessAuditStatus,
  pdfDocumentKindLabel,
  type PdfDocumentKind,
} from "@/lib/pdf-match";

export type PdfImportResult = {
  created: number;
  updated: number;
  failed: string[];
  total: number;
};

type PreviewState = {
  filename: string;
  kind: PdfDocumentKind;
  city: string;
  source: string;
  items: ImportCompanyInput[];
};

type PdfImportDialogProps = {
  defaultCity?: string;
  label?: string;
  onImported?: (result: PdfImportResult) => void;
};

export function PdfImportDialog({
  defaultCity,
  label = "PDF Yükle",
  onImported,
}: PdfImportDialogProps) {
  const { bulkImportFromPdf } = useCrm();
  const fileRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState("");
  const [preview, setPreview] = useState<PreviewState | null>(null);
  const [failed, setFailed] = useState<string[]>([]);

  const parseFiles = async (files: FileList | File[]) => {
    const list = Array.from(files).filter(
      (f) => f.type === "application/pdf" || f.name.toLowerCase().endsWith(".pdf")
    );
    if (!list.length) return;

    setLoading(true);
    const errors: string[] = [];
    const batch: ImportCompanyInput[] = [];
    let lastMeta: Omit<PreviewState, "items"> | null = null;

    for (let i = 0; i < list.length; i++) {
      const file = list[i];
      setProgress(list.length > 1 ? `${i + 1}/${list.length} PDF okunuyor...` : "PDF okunuyor...");

      try {
        const text = await extractTextFromPdf(file);
        if (!text.trim()) {
          errors.push(`${file.name}: metin okunamadı`);
          continue;
        }

        const extracted = extractCompaniesFromPdf(text, file.name);
        if (extracted.length === 0) {
          errors.push(`${file.name}: firma satırı okunamadı`);
          continue;
        }

        const kind = classifyPdfDocument(text, file.name, extracted.length);
        const source = inferSourceFromFilename(file.name) ?? extracted[0]?.source ?? "BOSB";
        const city =
          defaultCity ?? inferCityFromImport({ source, filename: file.name, text });

        lastMeta = { filename: file.name, kind, city, source };

        for (const company of extracted) {
          batch.push({
            member_no: company.member_no,
            name: company.name,
            sector: company.sector,
            website: company.website,
            email: company.email,
            phone: company.phone,
            source: company.source ?? source,
            city,
            audit_findings: company.findings,
            audit_impact: company.impact,
            audit_pdf_name: file.name,
            audit_status: company.findings
              ? guessAuditStatus(company.rawText)
              : kind === "member_list"
                ? "bilinmiyor"
                : guessAuditStatus(company.rawText),
          });
        }
      } catch {
        errors.push(`${file.name}: okunamadı`);
      }
    }

    setLoading(false);
    setProgress("");
    if (fileRef.current) fileRef.current.value = "";
    setFailed(errors);

    if (batch.length === 0) {
      if (errors.length) alert(`PDF okunamadı:\n${errors.join("\n")}`);
      return;
    }

    setPreview({
      items: batch,
      filename: lastMeta?.filename ?? list[0].name,
      kind: lastMeta?.kind ?? "member_list",
      city: lastMeta?.city ?? "Bursa",
      source: lastMeta?.source ?? "BOSB",
    });
  };

  const confirmImport = async () => {
    if (!preview) return;
    setLoading(true);
    const result = await bulkImportFromPdf(preview.items);
    setLoading(false);
    setPreview(null);
    onImported?.({ ...result, failed, total: preview.items.length });
    alert(
      `${result.created + result.updated} firma kaydedildi (${result.created} yeni, ${result.updated} güncelleme).`
    );
  };

  const previewRows = useMemo(() => preview?.items.slice(0, 15) ?? [], [preview]);

  return (
    <>
      <input
        ref={fileRef}
        type="file"
        accept="application/pdf,.pdf"
        multiple
        className="hidden"
        onChange={(e) => {
          const files = e.target.files;
          if (files?.length) parseFiles(files);
        }}
      />
      <Button variant="outline" disabled={loading} onClick={() => fileRef.current?.click()}>
        {loading && !preview ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <FileText className="mr-2 h-4 w-4" />
        )}
        {loading && progress ? progress : label}
      </Button>

      <Dialog open={!!preview} onOpenChange={(open) => !open && setPreview(null)}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>PDF İçe Aktarma Önizleme</DialogTitle>
            <DialogDescription>
              Kaydetmeden önce dosya tipini ve firmaları kontrol edin.
            </DialogDescription>
          </DialogHeader>

          {preview && (
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <Badge variant={preview.kind === "member_list" ? "default" : "secondary"}>
                  {pdfDocumentKindLabel(preview.kind)}
                </Badge>
                <Badge variant="outline">{preview.source}</Badge>
                <Badge variant="outline">{preview.city}</Badge>
                <Badge variant="outline">{preview.items.length} firma</Badge>
              </div>

              {preview.kind === "audit_report" && (
                <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-md p-3">
                  Bu dosya <strong>denetim raporu</strong> olarak algılandı. Eşleşen firmaların
                  denetim alanları güncellenir; yeni firmalar da eklenebilir. Toplu firma listesi
                  için BOSB/SOSB tablo PDF&apos;si yükleyin.
                </p>
              )}

              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>No</TableHead>
                      <TableHead>Firma</TableHead>
                      <TableHead>Sektör</TableHead>
                      <TableHead>Şehir</TableHead>
                      <TableHead>E-posta</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {previewRows.map((row, i) => (
                      <TableRow key={`${row.name}-${i}`}>
                        <TableCell className="font-mono text-xs">{row.member_no ?? "—"}</TableCell>
                        <TableCell className="text-sm font-medium">{row.name}</TableCell>
                        <TableCell className="text-sm">{row.sector ?? "—"}</TableCell>
                        <TableCell className="text-sm">{row.city ?? "—"}</TableCell>
                        <TableCell className="text-sm truncate max-w-[160px]">
                          {row.email ?? "—"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              {preview.items.length > 15 && (
                <p className="text-xs text-muted-foreground">
                  +{preview.items.length - 15} firma daha...
                </p>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setPreview(null)}>
              İptal
            </Button>
            <Button disabled={loading} onClick={confirmImport}>
              {loading ? "Kaydediliyor..." : `${preview?.items.length ?? 0} Firmayı Kaydet`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
