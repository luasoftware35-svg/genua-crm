export type MailSignatureConfig = {
  companyName: string;
  tagline: string;
  email: string;
  website: string;
  websiteLabel: string;
  phone?: string;
  signerName?: string;
};

function readConfig(): MailSignatureConfig {
  const website = process.env.TITAN_MAIL_WEBSITE ?? "https://www.genuadigital.com";
  const email = process.env.TITAN_MAIL_FROM ?? "hello@genuadigital.com";

  return {
    companyName: process.env.TITAN_MAIL_FROM_NAME ?? "Genua Digital",
    tagline: process.env.TITAN_MAIL_SIGNER_TITLE ?? "Dijital Medya & Web Çözümleri",
    email,
    website,
    websiteLabel: website.replace(/^https?:\/\//, "").replace(/\/$/, ""),
    phone: process.env.TITAN_MAIL_SIGNER_PHONE?.trim() || undefined,
    signerName: process.env.TITAN_MAIL_SIGNER_NAME?.trim() || undefined,
  };
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function buildSignatureText(config: MailSignatureConfig = readConfig()): string {
  const custom = process.env.TITAN_MAIL_SIGNATURE?.trim();
  if (custom) {
    return custom.replace(/\\n/g, "\n");
  }

  const lines = [
    "--",
    config.signerName ? config.signerName : config.companyName,
    config.tagline,
    `${config.websiteLabel} | ${config.email}`,
  ];

  if (config.phone) {
    lines.push(config.phone);
  }

  return lines.join("\n");
}

export function buildSignatureHtml(config: MailSignatureConfig = readConfig()): string {
  const custom = process.env.TITAN_MAIL_SIGNATURE_HTML?.trim();
  if (custom) {
    return custom;
  }

  const nameLine = config.signerName
    ? `<p style="margin:0 0 2px;font-size:14px;font-weight:600;color:#111827;">${escapeHtml(config.signerName)}</p>
<p style="margin:0 0 8px;font-size:13px;color:#6b7280;">${escapeHtml(config.companyName)} · ${escapeHtml(config.tagline)}</p>`
    : `<p style="margin:0 0 4px;font-size:14px;font-weight:600;color:#111827;">${escapeHtml(config.companyName)}</p>
<p style="margin:0 0 8px;font-size:13px;color:#6b7280;">${escapeHtml(config.tagline)}</p>`;

  const contactLine = `<a href="${escapeHtml(config.website)}" style="color:#2563eb;text-decoration:none;">${escapeHtml(config.websiteLabel)}</a>
<span style="color:#9ca3af;"> · </span>
<a href="mailto:${escapeHtml(config.email)}" style="color:#2563eb;text-decoration:none;">${escapeHtml(config.email)}</a>`;

  const phoneLine = config.phone
    ? `<p style="margin:8px 0 0;font-size:13px;color:#374151;">${escapeHtml(config.phone)}</p>`
    : "";

  return `<table cellpadding="0" cellspacing="0" role="presentation" style="margin-top:24px;padding-top:16px;border-top:1px solid #e5e7eb;font-family:Arial,Helvetica,sans-serif;">
  <tr>
    <td style="padding:0;">
      ${nameLine}
      <p style="margin:0;font-size:13px;line-height:1.5;color:#374151;">${contactLine}</p>
      ${phoneLine}
    </td>
  </tr>
</table>`;
}

const SIGNATURE_MARKER = "genuadigital.com";

export function hasSignature(content: string): boolean {
  return content.toLowerCase().includes(SIGNATURE_MARKER);
}

export function appendSignatureText(body: string, config?: MailSignatureConfig): string {
  const trimmed = body.trim();
  if (!trimmed || hasSignature(trimmed)) return trimmed;
  return `${trimmed}\n\n${buildSignatureText(config)}`;
}

export function appendSignatureHtml(bodyHtml: string, config?: MailSignatureConfig): string {
  if (hasSignature(bodyHtml)) return bodyHtml;
  return `${bodyHtml}${buildSignatureHtml(config)}`;
}

export function getSignaturePreview() {
  const config = readConfig();
  return {
    text: buildSignatureText(config),
    html: buildSignatureHtml(config),
  };
}
