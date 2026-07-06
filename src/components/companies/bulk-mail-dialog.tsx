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
import { buildOutreachMail } from "@/lib/mail-templates";
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
      })
      .catch(() => setConfigured(false));
  }, [open]);

  useEffect(() => {
    if (!open || !previewTarget) return;
    const mail = buildOutreachMail({
      companyName: previewTarget.companyName,
      website: previewTarget.website,
      source: previewTarget.source,
      auditFindings: previewTarget.auditFindings,
      auditImpact: previewTarget.auditImpact,
    });
    setSubject(mail.subject);
    setBody(mail.text);
    setPreviewCompanyId(previewTarget.companyId);
  }, [open, previewTarget?.companyId]);

  const handleSend = async () => {
    if (!sendable.length || !subject.trim() || !body.trim()) return;
    setLoading(true);
    setError(null);

    try {
      const messages = sendable.map((target) => {
        const personalized =
          sendable.length === 1
            ? { subject: subject.trim(), text: body.trim(), html: undefined }
            : buildOutreachMail({
                companyName: target.companyName,
                website: target.website,
                source: target.source,
                auditFindings: target.auditFindings,
                auditImpact: target.auditImpact,
              });

        return {
          companyId: target.companyId,
          to: target.to!,
          subject: personalized.subject,
          text: personalized.text,
          html: personalized.html,
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
                      const mail = buildOutreachMail({
                        companyName: t.companyName,
                        website: t.website,
                        source: t.source,
                        auditFindings: t.auditFindings,
                        auditImpact: t.auditImpact,
                      });
                      setSubject(mail.subject);
                      setBody(mail.text);
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
                Konu ve gövde şablondur; her firmaya adı ve denetim bulguları otomatik işlenir.
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
            <Label htmlFor="mail-body">Mesaj (önizleme)</Label>
            <Textarea
              id="mail-body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={12}
              className="font-mono text-sm"
            />
          </div>

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
          } satisfies BulkMailTarget;
        })
        .filter(Boolean) as BulkMailTarget[],
    [companyIds, getCompanyById, getContactsByCompanyId]
  );
}
