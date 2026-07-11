import { readFileSync } from "fs";
import { resolve } from "path";
import { createClient } from "@supabase/supabase-js";
import { buildCompanyMailContent } from "../src/lib/company-mail";
import { checkRecipientMailDomain } from "../src/lib/mail-domain-check";
import { appendSignatureHtml, appendSignatureText } from "../src/lib/mail-signature";
import { getOutreachPdfPath } from "../src/lib/outreach-templates";
import { resolvePublicAttachment, sendTitanMail } from "../src/lib/titan-mail";

const SEND_DELAY_MS = 800;
const PDF_PATTERN = /^(1[1-9]|20)_/;

function loadEnv() {
  const envPath = resolve(process.cwd(), ".env.local");
  const text = readFileSync(envPath, "utf8");
  const env: Record<string, string> = {};
  for (const line of text.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const idx = trimmed.indexOf("=");
    if (idx === -1) continue;
    env[trimmed.slice(0, idx)] = trimmed.slice(idx + 1);
  }
  return env;
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function main() {
  const env = loadEnv();
  const url = env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) throw new Error("Supabase env eksik");

  process.env.TITAN_SMTP_USER = env.TITAN_SMTP_USER;
  process.env.TITAN_SMTP_PASS = env.TITAN_SMTP_PASS;
  process.env.TITAN_MAIL_FROM = env.TITAN_MAIL_FROM ?? env.TITAN_SMTP_USER;
  process.env.TITAN_SMTP_HOST = env.TITAN_SMTP_HOST ?? "smtpout.secureserver.net";
  process.env.TITAN_SMTP_PORT = env.TITAN_SMTP_PORT ?? "465";
  process.env.TITAN_SMTP_SECURE = env.TITAN_SMTP_SECURE ?? "true";

  const supabase = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: companies, error } = await supabase
    .from("crm_companies")
    .select("id,name,email,website,source,audit_pdf_name,crm_deals(id,stage)")
    .eq("city", "Uşak");

  if (error) throw error;

  const targets = (companies ?? [])
    .filter((c) => c.audit_pdf_name && PDF_PATTERN.test(c.audit_pdf_name))
    .filter(
      (c) => (c.crm_deals as { id: string; stage: string }[] | null)?.[0]?.stage !== "mail_atildi"
    )
    .sort((a, b) => (a.audit_pdf_name ?? "").localeCompare(b.audit_pdf_name ?? ""));

  console.log(`Uşak 11-20 gönderim: ${targets.length} firma`);

  let sent = 0;
  let skipped = 0;
  let failed = 0;

  for (let i = 0; i < targets.length; i++) {
    const company = targets[i];
    const deal = (company.crm_deals as { id: string; stage: string }[])?.[0];
    const to = company.email?.trim();

    if (!to) {
      console.log(`✗ ${company.name} — e-posta yok`);
      failed++;
      continue;
    }

    const domainCheck = await checkRecipientMailDomain(to);
    if (!domainCheck.ok) {
      console.log(`⊘ ${company.name} — ${domainCheck.reason}`);
      skipped++;
      continue;
    }

    const content = buildCompanyMailContent({
      companyName: company.name,
      website: company.website,
      source: company.source,
      auditPdfName: company.audit_pdf_name,
    });

    const pdfPath = getOutreachPdfPath(company.audit_pdf_name);
    const pdfAttachment = pdfPath ? resolvePublicAttachment(pdfPath) : null;

    try {
      await sendTitanMail({
        to,
        subject: content.subject,
        text: appendSignatureText(content.bodyText),
        html: appendSignatureHtml(content.bodyHtml, undefined, { embedded: true }),
        attachments: pdfAttachment ? [pdfAttachment] : undefined,
      });

      if (deal?.id) {
        await supabase.from("crm_deals").update({ stage: "mail_atildi" }).eq("id", deal.id);
        await supabase.from("crm_activities").insert({
          company_id: company.id,
          deal_id: deal.id,
          type: "mail",
          note: `Titan Mail ile gönderildi: ${content.subject}`,
        });
      }

      console.log(`✓ ${company.audit_pdf_name} ${company.name} → ${to}`);
      sent++;
    } catch (err) {
      console.log(`✗ ${company.name} — ${err instanceof Error ? err.message : "hata"}`);
      failed++;
    }

    if (i < targets.length - 1) await sleep(SEND_DELAY_MS);
  }

  console.log("");
  console.log(`Gönderildi: ${sent} · Atlandı (DNS): ${skipped} · Hata: ${failed}`);
}

main().catch((err) => {
  console.error("Hata:", err.message ?? err);
  process.exit(1);
});
