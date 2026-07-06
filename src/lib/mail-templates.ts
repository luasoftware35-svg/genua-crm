export type MailTemplateInput = {
  companyName: string;
  website?: string | null;
  source?: string | null;
  auditFindings?: string | null;
  auditImpact?: string | null;
};

const SENDER_NAME = process.env.TITAN_MAIL_FROM_NAME ?? "Genua Digital";
const SENDER_SITE = "https://www.genuadigital.com";
const SENDER_EMAIL = process.env.TITAN_MAIL_FROM ?? "crm@genuadigital.com";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function findingsBlock(input: MailTemplateInput): string {
  if (!input.auditFindings?.trim()) return "";

  let block = `\n\nWeb sitenizi incelediğimizde öne çıkan noktalar:\n${input.auditFindings.trim()}`;
  if (input.auditImpact?.trim()) {
    block += `\n\nBu durumun olası etkisi: ${input.auditImpact.trim()}`;
  }
  return block;
}

export function buildOutreachMail(input: MailTemplateInput) {
  const region = input.source ? `${input.source} bölgesindeki` : "OSB firmalarının";
  const websiteNote = input.website?.trim()
    ? ` (${input.website.trim()})`
    : "";

  const subject = `${input.companyName} — dijital görünürlük hakkında kısa bir not`;
  const findings = findingsBlock(input);

  const text = `Merhaba ${input.companyName} ekibi,

Ben ${SENDER_NAME} ekibinden yazıyorum. ${region} dijital varlıklarını inceliyoruz${websiteNote}.${findings}

Size uygun bir dijital iyileştirme planı önerebilmemiz için 15 dakikalık kısa bir görüşme ayarlamak isteriz.

Saygılarımızla,
${SENDER_NAME}
${SENDER_SITE}
${SENDER_EMAIL}`;

  const htmlFindings = input.auditFindings?.trim()
    ? `<p><strong>Web sitenizi incelediğimizde öne çıkan noktalar:</strong></p>
<p style="white-space:pre-line">${escapeHtml(input.auditFindings.trim())}</p>${
        input.auditImpact?.trim()
          ? `<p><strong>Olası etki:</strong> ${escapeHtml(input.auditImpact.trim())}</p>`
          : ""
      }`
    : "";

  const html = `<p>Merhaba <strong>${escapeHtml(input.companyName)}</strong> ekibi,</p>
<p>Ben <strong>${escapeHtml(SENDER_NAME)}</strong> ekibinden yazıyorum. ${escapeHtml(region)} dijital varlıklarını inceliyoruz${websiteNote ? escapeHtml(websiteNote) : ""}.</p>
${htmlFindings}
<p>Size uygun bir dijital iyileştirme planı önerebilmemiz için 15 dakikalık kısa bir görüşme ayarlamak isteriz.</p>
<p>Saygılarımızla,<br/>
<strong>${escapeHtml(SENDER_NAME)}</strong><br/>
<a href="${SENDER_SITE}">${SENDER_SITE}</a><br/>
${escapeHtml(SENDER_EMAIL)}</p>`;

  return { subject, text, html };
}
