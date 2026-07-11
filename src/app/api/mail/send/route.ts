import { NextResponse } from "next/server";
import { buildCompanyMailContent, formatMailTextAsHtml } from "@/lib/company-mail";
import { checkRecipientMailDomain } from "@/lib/mail-domain-check";
import { isValidEmail } from "@/lib/mail-recipients";
import { appendSignatureHtml, appendSignatureText } from "@/lib/mail-signature";
import { getOutreachPdfPath } from "@/lib/outreach-templates";
import { createClient } from "@/lib/supabase/server";
import { getTitanMailConfig, resolvePublicAttachment, sendTitanMail } from "@/lib/titan-mail";

const MAX_BATCH = 30;
const SEND_DELAY_MS = 600;

type MailPayload = {
  companyId: string;
  to: string;
  subject: string;
  text: string;
  html?: string;
  skipTemplate?: boolean;
};

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Oturum gerekli" }, { status: 401 });
  }

  const config = getTitanMailConfig();
  if (!config.configured) {
    return NextResponse.json(
      {
        error:
          "Titan Mail yapılandırılmamış. TITAN_SMTP_USER, TITAN_SMTP_PASS ve TITAN_MAIL_FROM ekleyin.",
      },
      { status: 503 }
    );
  }

  let body: { messages?: MailPayload[] };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Geçersiz istek gövdesi" }, { status: 400 });
  }

  const messages = body.messages ?? [];
  if (!messages.length) {
    return NextResponse.json({ error: "Gönderilecek mail yok" }, { status: 400 });
  }
  if (messages.length > MAX_BATCH) {
    return NextResponse.json(
      { error: `Tek seferde en fazla ${MAX_BATCH} mail gönderilebilir` },
      { status: 400 }
    );
  }

  for (const msg of messages) {
    if (!msg.companyId || !msg.to || !msg.subject?.trim() || !msg.text?.trim()) {
      return NextResponse.json({ error: "Eksik mail alanları" }, { status: 400 });
    }
    if (!isValidEmail(msg.to)) {
      return NextResponse.json({ error: `Geçersiz e-posta: ${msg.to}` }, { status: 400 });
    }
  }

  const results: {
    companyId: string;
    to: string;
    ok: boolean;
    error?: string;
  }[] = [];

  for (let i = 0; i < messages.length; i++) {
    const msg = messages[i];
    try {
      const domainCheck = await checkRecipientMailDomain(msg.to);
      if (!domainCheck.ok) {
        results.push({
          companyId: msg.companyId,
          to: msg.to,
          ok: false,
          error: domainCheck.reason ?? "Alıcı mail sunucusu bulunamadı",
        });
        continue;
      }

      const { data: company } = await supabase
        .from("crm_companies")
        .select("name, audit_pdf_name")
        .eq("id", msg.companyId)
        .maybeSingle();

      const templateContent = buildCompanyMailContent({
        companyName: company?.name ?? "",
        auditPdfName: company?.audit_pdf_name,
      });

      const useTemplate = templateContent.isCustom && !msg.skipTemplate;
      const finalSubject = useTemplate ? templateContent.subject : msg.subject.trim();
      const finalText = useTemplate ? templateContent.bodyText : msg.text.trim();
      const finalHtml = useTemplate
        ? templateContent.bodyHtml
        : msg.html ?? formatMailTextAsHtml(finalText);

      const pdfPath = getOutreachPdfPath(company?.audit_pdf_name);
      const pdfAttachment = pdfPath ? resolvePublicAttachment(pdfPath) : null;

      const text = appendSignatureText(finalText);
      const html = appendSignatureHtml(finalHtml, undefined, { embedded: true });

      await sendTitanMail({
        to: msg.to,
        subject: finalSubject,
        text,
        html,
        attachments: pdfAttachment ? [pdfAttachment] : undefined,
      });
      results.push({ companyId: msg.companyId, to: msg.to, ok: true });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Gönderim başarısız";
      results.push({ companyId: msg.companyId, to: msg.to, ok: false, error: message });
    }

    if (i < messages.length - 1) {
      await sleep(SEND_DELAY_MS);
    }
  }

  const sent = results.filter((r) => r.ok).length;
  const failed = results.filter((r) => !r.ok);

  return NextResponse.json({
    sent,
    failed: failed.length,
    results,
  });
}
