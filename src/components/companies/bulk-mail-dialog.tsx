"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2, Mail, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { buildCompanyMailContent } from "@/lib/company-mail";
import { getOutreachMailTemplate } from "@/lib/outreach-templates";
import { resolveCompanyEmail } from "@/lib/mail-recipients";
import { useCrm } from "@/context/crm-context";

export type BulkMailTarget = {
  companyId: string;
  companyName: string;
  to: string | null;
  website?: string | null;
  source?: string | null;
  auditFindings?: string | null;
  auditImpact?: string | null;
  mailSubject?: string | null;
  mailBody?: string | null;
  auditPdfName?: string | null;
  mailDnsOk?: boolean;
};

type BulkMailDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  targets: BulkMailTarget[];
  onComplete?: (sentCompanyIds: string[]) => void;
};

export function BulkMailDialog({
  open,
  onOpenChange,
  targets,
  onComplete,
}: BulkMailDialogProps) {
  const { bulkMarkMailSent } = useCrm();
  const [configured, setConfigured] = useState<boolean | null>(null);
  const [fromLabel, setFromLabel] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [previewCompanyId, setPreviewCompanyId] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [signatureText, setSignatureText] = useState("");
  const [signatureLogoUrl, setSignatureLogoUrl] = useState<string | null>(null);
  const [previewIsCustom, setPreviewIsCustom] = useState(false);

  const sendable = useMemo(
    () => targets.filter((t) => t.to),
    [targets]
  );
  const missingEmail = targets.length - sendable.length;

  const previewTarget = useMemo(() => {
    const id = previewCompanyId || sendable[0]?.companyId;
    return sendable.find((t) => t.companyId === id) ?? sendable[0];
  }, [previewCompanyId, sendable]);

  useEffect(() => {
    if (!open) return;

    fetch("/api/mail/config")
      .then((res) => res.json())
      .then((data) => {
        setConfigured(Boolean(data.configured));
        setFromLabel(
          data.configured
            ? `${data.fromName} <${data.from}>`
            : "Titan Mail yapılandırılmamış"
        );
        if (typeof data.signatureText === "string") {
          setSignatureText(data.signatureText);
        }
        if (typeof data.signatureLogoUrl === "string") {
          setSignatureLogoUrl(data.signatureLogoUrl);
        }
      })
      .catch(() => setConfigured(false));
  }, [open]);

  useEffect(() => {
    if (!open || !previewTarget) return;
    const content = buildCompanyMailContent({
      companyName: previewTarget.companyName,
      website: previewTarget.website,
      source: previewTarget.source,
      auditFindings: previewTarget.auditFindings,
      auditImpact: previewTarget.auditImpact,
      mailSubject: previewTarget.mailSubject,
      mailBody: previewTarget.mailBody,
      auditPdfName: previewTarget.auditPdfName,
    });
    setSubject(content.subject);
    setBody(content.bodyText);
    setPreviewIsCustom(content.isCustom);
    setPreviewCompanyId(previewTarget.companyId);
  }, [open, previewTarget?.companyId]);

  const handleSend = async () => {
    if (!sendable.length || !subject.trim() || !body.trim()) return;
    setLoading(true);
    setError(null);

    try {
      const messages = sendable.map((target) => {
        const content = buildCompanyMailContent({
          companyName: target.companyName,
          website: target.website,
          source: target.source,
          auditFindings: target.auditFindings,
          auditImpact: target.auditImpact,
          mailSubject: target.mailSubject,
          mailBody: target.mailBody,
          auditPdfName: target.auditPdfName,
        });

        const edited =
          sendable.length === 1 &&
          (subject.trim() !== content.subject || body.trim() !== content.bodyText);

        return {
          companyId: target.companyId,
          to: target.to!,
          subject: sendable.length === 1 ? subject.trim() : content.subject,
          text: sendable.length === 1 ? body.trim() : content.bodyText,
          html: content.bodyHtml,
          skipTemplate: edited,
        };
      });

      const res = await fetch("/api/mail/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error ?? "Mail gönderilemedi");
      }

      const sentIds = (data.results as { companyId: string; ok: boolean }[])
        .filter((r) => r.ok)
        .map((r) => r.companyId);

      if (sentIds.length) {
        await bulkMarkMailSent(
          sentIds,
          `Titan Mail ile gönderildi (${sentIds.length} firma).`
        );
      }

      const failed = (data.results as { companyId: string; ok: boolean; error?: string }[]).filter(
        (r) => !r.ok
      );

      onComplete?.(sentIds);
      onOpenChange(false);

      if (failed.length) {
        alert(
          `${sentIds.length} mail gönderildi, ${failed.length} başarısız.\n${failed
            .slice(0, 3)
            .map((f) => f.error)
            .join("\n")}`
        );
      } else {
        alert(`${sentIds.length} mail Titan üzerinden gönderildi.`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gönderim hatası");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Titan Mail — Toplu Gönderim
          </DialogTitle>
          <DialogDescription>
            {sendable.length} firmaya gönderilecek
            {missingEmail > 0 ? ` · ${missingEmail} firmada e-posta yok` : ""}
          </DialogDescription>
        </DialogHeader>

        {configured === false && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
            Titan SMTP ayarları eksik. Vercel / .env.local içine{" "}
            <code className="text-xs">TITAN_SMTP_USER</code>,{" "}
            <code className="text-xs">TITAN_SMTP_PASS</code>,{" "}
            <code className="text-xs">TITAN_MAIL_FROM</code> ekleyin.
          </div>
        )}

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Gönderen</Label>
            <Input value={fromLabel} readOnly />
          </div>

          {sendable.length === 1 && previewIsCustom && (
            <p className="text-xs text-muted-foreground">
              Firma için hazırlanmış özel mail metni kullanılıyor.
              {previewTarget.auditPdfName ? ` PDF eki: ${previewTarget.auditPdfName}` : ""}
            </p>
          )}

          {sendable.length > 1 && (
            <div className="space-y-2">
              <Label>Önizleme firması</Label>
              <div className="flex flex-wrap gap-2">
                {sendable.slice(0, 8).map((t) => (
                  <Badge
                    key={t.companyId}
                    variant={previewCompanyId === t.companyId ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => {
                      setPreviewCompanyId(t.companyId);
                      const content = buildCompanyMailContent({
                        companyName: t.companyName,
                        website: t.website,
                        source: t.source,
                        auditFindings: t.auditFindings,
                        auditImpact: t.auditImpact,
                        mailSubject: t.mailSubject,
                        mailBody: t.mailBody,
                        auditPdfName: t.auditPdfName,
                      });
                      setSubject(content.subject);
                      setBody(content.bodyText);
                      setPreviewIsCustom(content.isCustom);
                    }}
                  >
                    {t.companyName}
                  </Badge>
                ))}
                {sendable.length > 8 && (
                  <Badge variant="secondary">+{sendable.length - 8} firma</Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                {previewIsCustom
                  ? "Firma için hazırlanmış özel mail metni kullanılıyor."
                  : "Konu ve gövde şablondur; her firmaya adı ve denetim bulguları otomatik işlenir."}
                {previewTarget.auditPdfName
                  ? ` PDF eki: ${previewTarget.auditPdfName}`
                  : ""}
              </p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="mail-subject">Konu</Label>
            <Input
              id="mail-subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="mail-body">Mesaj</Label>
            <Textarea
              id="mail-body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={10}
              className="font-mono text-sm"
            />
          </div>

          {(signatureText || signatureLogoUrl) && (
            <div className="space-y-2">
              <Label>E-posta imzası (otomatik eklenir)</Label>
              <div className="rounded-lg border bg-white p-3">
                {signatureLogoUrl && (
                  <img
                    src={signatureLogoUrl}
                    alt="Genua mail imzası"
                    className="w-full max-w-xl object-contain"
                  />
                )}
                {!signatureLogoUrl && signatureText && (
                  <pre className="whitespace-pre-wrap text-sm text-muted-foreground font-sans">
                    {signatureText.replace(/^--\n/, "")}
                  </pre>
                )}
              </div>
            </div>
          )}

          {previewTarget && previewTarget.mailDnsOk === false && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-900">
              <strong>Dikkat:</strong> Dosyadaki e-posta adresi ({previewTarget.to}) DNS&apos;te
              bulunamadı — mail gönderilirse geri döner (bounce). Adresi dosyada düzeltmeden
              göndermeyin.
            </div>
          )}

          {previewTarget && (
            <p className="text-xs text-muted-foreground">
              Alıcı: <strong>{previewTarget.to}</strong>
            </p>
          )}

          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            İptal
          </Button>
          <Button
            onClick={handleSend}
            disabled={loading || !sendable.length || configured === false}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Gönderiliyor...
              </>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                {sendable.length} Mail Gönder
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function useBulkMailTargets(
  companyIds: string[],
  getCompanyById: ReturnType<typeof useCrm>["getCompanyById"],
  getContactsByCompanyId: ReturnType<typeof useCrm>["getContactsByCompanyId"]
): BulkMailTarget[] {
  return useMemo(
    () =>
      companyIds
        .map((id) => {
          const company = getCompanyById(id);
          if (!company) return null;
          const contacts = getContactsByCompanyId(id);
          return {
            companyId: id,
            companyName: company.name,
            to: resolveCompanyEmail(company, contacts),
            website: company.website,
            source: company.source,
            auditFindings: company.audit_findings,
            auditImpact: company.audit_impact,
            mailSubject: company.mail_subject,
            mailBody: company.mail_body,
            auditPdfName: company.audit_pdf_name,
            mailDnsOk: getOutreachMailTemplate({
              companyName: company.name,
              auditPdfName: company.audit_pdf_name,
            })?.dnsOk,
          } satisfies BulkMailTarget;
        })
        .filter(Boolean) as BulkMailTarget[],
    [companyIds, getCompanyById, getContactsByCompanyId]
  );
}
