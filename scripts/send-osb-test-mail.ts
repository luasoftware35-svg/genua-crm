import { readFileSync } from "fs";
import { resolve } from "path";
import { buildCompanyMailContent } from "../src/lib/company-mail";
import { appendSignatureHtml, appendSignatureText } from "../src/lib/mail-signature";
import { getOutreachPdfPath } from "../src/lib/outreach-templates";
import { resolvePublicAttachment, sendTitanMail } from "../src/lib/titan-mail";

function loadEnv() {
  const envPath = resolve(process.cwd(), ".env.local");
  for (const line of readFileSync(envPath, "utf8").split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const i = t.indexOf("=");
    if (i === -1) continue;
    process.env[t.slice(0, i)] = t.slice(i + 1);
  }
}

async function main() {
  loadEnv();
  const to = process.argv[2] ?? "damatmark@gmail.com";
  const pdfName = process.argv[3] ?? "30_Usak_OSB.pdf";

  const content = buildCompanyMailContent({
    companyName: "Uşak OSB",
    auditPdfName: pdfName,
  });

  const pdfPath = getOutreachPdfPath(pdfName);
  const pdfAttachment = pdfPath ? resolvePublicAttachment(pdfPath) : null;

  await sendTitanMail({
    to,
    subject: `[TEST] ${content.subject}`,
    text: appendSignatureText(content.bodyText),
    html: appendSignatureHtml(content.bodyHtml, undefined, { embedded: true }),
    attachments: pdfAttachment ? [pdfAttachment] : undefined,
  });

  console.log(`OK: Test maili gönderildi → ${to}`);
  console.log(`Konu: [TEST] ${content.subject}`);
  console.log(`PDF: ${pdfAttachment?.filename ?? "yok"}`);
}

main().catch((err) => {
  console.error("Hata:", err instanceof Error ? err.message : err);
  process.exit(1);
});
