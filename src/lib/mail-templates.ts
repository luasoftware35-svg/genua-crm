import { appendSignatureHtml, appendSignatureText, buildSignatureText } from "@/lib/mail-signature";

export type MailTemplateInput = {
  companyName: string;
  website?: string | null;
  source?: string | null;
  auditFindings?: string | null;
  auditImpact?: string | null;
};

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

export function buildOutreachMailContent(input: MailTemplateInput) {
  const region = input.source ? `${input.source} bölgesindeki` : "OSB firmalarının";
  const websiteNote = input.website?.trim()
    ? ` (${input.website.trim()})`
    : "";

  const subject = `${input.companyName} — dijital görünürlük hakkında kısa bir not`;
  const findings = findingsBlock(input);

  const bodyText = `Merhaba ${input.companyName} ekibi,

Ben Genua Digital ekibinden yazıyorum. ${region} dijital varlıklarını inceliyoruz${websiteNote}.${findings}

Size uygun bir dijital iyileştirme planı önerebilmemiz için 15 dakikalık kısa bir görüşme ayarlamak isteriz.

Saygılarımızla,`;

  const htmlFindings = input.auditFindings?.trim()
    ? `<p><strong>Web sitenizi incelediğimizde öne çıkan noktalar:</strong></p>
<p style="white-space:pre-line">${escapeHtml(input.auditFindings.trim())}</p>${
        input.auditImpact?.trim()
          ? `<p><strong>Olası etki:</strong> ${escapeHtml(input.auditImpact.trim())}</p>`
          : ""
      }`
    : "";

  const bodyHtml = `<p>Merhaba <strong>${escapeHtml(input.companyName)}</strong> ekibi,</p>
<p>Ben <strong>Genua Digital</strong> ekibinden yazıyorum. ${escapeHtml(region)} dijital varlıklarını inceliyoruz${websiteNote ? escapeHtml(websiteNote) : ""}.</p>
${htmlFindings}
<p>Size uygun bir dijital iyileştirme planı önerebilmemiz için 15 dakikalık kısa bir görüşme ayarlamak isteriz.</p>
<p style="margin-bottom:0;">Saygılarımızla,</p>`;

  return { subject, bodyText, bodyHtml };
}

export function buildOutreachMail(input: MailTemplateInput) {
  const { subject, bodyText, bodyHtml } = buildOutreachMailContent(input);

  return {
    subject,
    text: appendSignatureText(bodyText),
    html: appendSignatureHtml(bodyHtml),
  };
}

/** İstemci önizlemesi için varsayılan imza (sunucu env olmadan). */
export function getDefaultSignatureText(): string {
  return buildSignatureText({
    companyName: "Genua Digital",
    tagline: "Dijital Medya & Web Çözümleri",
    email: "hello@genuadigital.com",
    website: "https://www.genuadigital.com",
    websiteLabel: "www.genuadigital.com",
  });
}
