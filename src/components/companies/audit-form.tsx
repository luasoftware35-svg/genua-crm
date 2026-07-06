"use client";

import { useRef, useState } from "react";
import { FileText, Loader2, Upload } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useCrm } from "@/context/crm-context";
import { extractTextFromPdf } from "@/lib/pdf-extract";
import {
  classifyPdfDocument,
  extractCompaniesFromPdf,
  guessAuditStatus,
  isMemberListDocument,
  parseAuditSections,
  pdfDocumentKindLabel,
} from "@/lib/pdf-match";
import type { Company } from "@/types";

export function AuditForm({ company }: { company: Company }) {
  const { updateCompany } = useCrm();
  const fileRef = useRef<HTMLInputElement>(null);
  const [findings, setFindings] = useState(company.audit_findings ?? "");
  const [impact, setImpact] = useState(company.audit_impact ?? "");
  const [pdfName, setPdfName] = useState(company.audit_pdf_name ?? "");
  const [pdfKind, setPdfKind] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = () => {
    updateCompany(company.id, {
      audit_findings: findings || null,
      audit_impact: impact || null,
      audit_pdf_name: pdfName || null,
      audit_status: findings ? guessAuditStatus(findings) : company.audit_status,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handlePdfUpload = async (file: File) => {
    if (file.type !== "application/pdf") {
      setError("Sadece PDF dosyası yükleyebilirsiniz.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const text = await extractTextFromPdf(file);
      if (!text.trim()) {
        setError("PDF'den metin çıkarılamadı. Taranmış PDF olabilir — metni elle yapıştırın.");
        return;
      }

      if (isMemberListDocument(text, file.name)) {
        setError(
          "Bu dosya toplu firma listesi PDF'si. Ana sayfadaki PDF Yükle ile içe aktarın; buraya tek firma denetim raporu yükleyin."
        );
        setPdfKind("member_list");
        return;
      }

      const extracted = extractCompaniesFromPdf(text, file.name);
      const kind = classifyPdfDocument(text, file.name, extracted.length);
      setPdfKind(pdfDocumentKindLabel(kind));

      const match =
        extracted.find((e) => e.name.toLowerCase().includes(company.name.slice(0, 8).toLowerCase())) ??
        extracted[0];

      const sections = parseAuditSections(text);
      const auditFindings = match?.findings ?? (sections.findings || text);
      const auditImpact = match?.impact ?? sections.impact ?? null;

      setFindings(auditFindings);
      setImpact(auditImpact ?? "");
      setPdfName(file.name);
      updateCompany(company.id, {
        audit_findings: auditFindings,
        audit_impact: auditImpact,
        audit_pdf_name: file.name,
        audit_status: guessAuditStatus(text),
      });
    } catch {
      setError("PDF okunamadı. Dosyayı kontrol edip tekrar deneyin.");
    } finally {
      setLoading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-4">
        <div>
          <CardTitle>Denetim Bulguları</CardTitle>
          <CardDescription>
            Tek firma denetim raporu PDF&apos;si — toplu liste PDF&apos;leri ana sayfadan yüklenir
          </CardDescription>
        </div>
        <div className="flex gap-2">
          <input
            ref={fileRef}
            type="file"
            accept="application/pdf,.pdf"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handlePdfUpload(file);
            }}
          />
          <Button
            size="sm"
            variant="outline"
            disabled={loading}
            onClick={() => fileRef.current?.click()}
          >
            {loading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Upload className="mr-2 h-4 w-4" />
            )}
            Denetim PDF
          </Button>
          <Button size="sm" onClick={handleSave}>
            {saved ? "Kaydedildi ✓" : "Kaydet"}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {pdfName && (
          <div className="flex items-center gap-2 rounded-lg border bg-muted/40 px-3 py-2">
            <FileText className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">{pdfName}</span>
            {pdfKind && (
              <Badge variant="secondary" className="ml-auto">
                {pdfKind}
              </Badge>
            )}
          </div>
        )}
        {error && <p className="text-sm text-destructive">{error}</p>}
        <div className="space-y-2">
          <Label>Bulgular</Label>
          <Textarea
            rows={6}
            placeholder="Denetim raporu PDF'i veya site denetimi sonuçları..."
            value={findings}
            onChange={(e) => setFindings(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label>İş Etkisi</Label>
          <Textarea
            rows={3}
            placeholder="Bu bulguların firmaya etkisi..."
            value={impact}
            onChange={(e) => setImpact(e.target.value)}
          />
        </div>
      </CardContent>
    </Card>
  );
}
