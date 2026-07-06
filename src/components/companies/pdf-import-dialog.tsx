"use client";

import { useRef, useState } from "react";
import { FileText, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCrm } from "@/context/crm-context";
import { DEFAULT_CITY } from "@/lib/cities";
import { extractTextFromPdf } from "@/lib/pdf-extract";
import { extractCompaniesFromPdf, guessAuditStatus } from "@/lib/pdf-match";
import type { ImportCompanyInput } from "@/lib/crm-import";

export type PdfImportResult = {
  created: number;
  updated: number;
  failed: string[];
  total: number;
};

type PdfImportDialogProps = {
  defaultCity?: string;
  label?: string;
  onImported?: (result: PdfImportResult) => void;
};

export function PdfImportDialog({
  defaultCity = DEFAULT_CITY,
  label = "PDF Yükle",
  onImported,
}: PdfImportDialogProps) {
  const { bulkImportFromPdf } = useCrm();
  const fileRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState("");

  const processFiles = async (files: FileList | File[]) => {
    const list = Array.from(files).filter(
      (f) => f.type === "application/pdf" || f.name.toLowerCase().endsWith(".pdf")
    );
    if (!list.length) return;

    setLoading(true);
    let created = 0;
    let updated = 0;
    let total = 0;
    const failed: string[] = [];
    const batch: ImportCompanyInput[] = [];

    for (let i = 0; i < list.length; i++) {
      const file = list[i];
      setProgress(list.length > 1 ? `${i + 1}/${list.length} PDF okunuyor...` : "PDF okunuyor...");

      try {
        const text = await extractTextFromPdf(file);
        if (!text.trim()) {
          failed.push(`${file.name}: metin okunamadı`);
          continue;
        }

        const extracted = extractCompaniesFromPdf(text, file.name);
        if (extracted.length === 0) {
          failed.push(`${file.name}: firma satırı okunamadı (tablo formatı kontrol edin)`);
          continue;
        }
        total += extracted.length;

        for (const company of extracted) {
          batch.push({
            member_no: company.member_no,
            name: company.name,
            sector: company.sector,
            website: company.website,
            email: company.email,
            phone: company.phone,
            source: company.source,
            city: defaultCity,
            audit_findings: company.findings,
            audit_impact: company.impact,
            audit_pdf_name: file.name,
            audit_status: company.findings ? guessAuditStatus(company.rawText) : "bilinmiyor",
          });
        }
      } catch {
        failed.push(`${file.name}: okunamadı`);
      }
    }

    if (batch.length > 0) {
      setProgress(`${batch.length} firma panele ekleniyor...`);
      const result = bulkImportFromPdf(batch);
      created = result.created;
      updated = result.updated;
    }

    setLoading(false);
    setProgress("");
    if (fileRef.current) fileRef.current.value = "";

    onImported?.({ created, updated, failed, total: total || batch.length });
    if (batch.length > 0 && created + updated > 0) {
      // eslint-disable-next-line no-alert
      alert(`${created + updated} firma listeye eklendi (${created} yeni).`);
    } else if (failed.length && batch.length === 0) {
      // eslint-disable-next-line no-alert
      alert(`PDF okunamadı:\n${failed.join("\n")}`);
    }
  };

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
          if (files?.length) processFiles(files);
        }}
      />
      <Button variant="outline" disabled={loading} onClick={() => fileRef.current?.click()}>
        {loading ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <FileText className="mr-2 h-4 w-4" />
        )}
        {loading && progress ? progress : label}
      </Button>
    </>
  );
}
