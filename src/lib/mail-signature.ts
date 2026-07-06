import path from "path";

export type MailSignatureConfig = {
  companyName: string;
  tagline: string;
  email: string;
  website: string;
  websiteLabel: string;
  phone?: string;
  address?: string;
  signerName?: string;
  signatureImageUrl: string;
  signatureImageWidth: number;
};

export const SIGNATURE_CID = "genua-signature@genuadigital.com";
export const SIGNATURE_IMAGE_PATH = "public/email/genua-signature.png";

export function getSignatureImagePath(): string {
  return path.join(process.cwd(), SIGNATURE_IMAGE_PATH);
}

function getDefaultSignatureImageUrl(): string {
  const custom = process.env.TITAN_MAIL_SIGNATURE_IMAGE_URL?.trim();
  if (custom) return custom;

  const site = process.env.NEXT_PUBLIC_SITE_URL ?? "https://genua-crm.vercel.app";
  return `${site.replace(/\/$/, "")}/email/genua-signature.png`;
}

function readConfig(): MailSignatureConfig {
  const website = process.env.TITAN_MAIL_WEBSITE ?? "https://www.genuadigital.com";
  const email = process.env.TITAN_MAIL_FROM ?? "hello@genuadigital.com";
  const signatureImageWidth =
    Number(process.env.TITAN_MAIL_SIGNATURE_IMAGE_WIDTH ?? "560") || 560;

  return {
    companyName: process.env.TITAN_MAIL_FROM_NAME ?? "Genua Digital",
    tagline: process.env.TITAN_MAIL_SIGNER_TITLE ?? "Genua Digital Media - Founder",
    email,
    website,
    websiteLabel: website.replace(/^https?:\/\//, "").replace(/\/$/, ""),
    phone: process.env.TITAN_MAIL_SIGNER_PHONE?.trim() || "0551 124 53 06",
    address:
      process.env.TITAN_MAIL_SIGNER_ADDRESS?.trim() ||
      "Yeni, Menderes Blv. No: 7A D:3, 20030 Denizli",
    signerName: process.env.TITAN_MAIL_SIGNER_NAME?.trim() || "Umut Avcı",
    signatureImageUrl: getDefaultSignatureImageUrl(),
    signatureImageWidth,
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
    config.signerName ?? config.companyName,
    config.tagline,
    `İletişim: ${config.phone ?? ""}`,
    config.websiteLabel,
    config.email,
  ];

  if (config.address) {
    lines.push(`Adres: ${config.address}`);
  }

  return lines.filter(Boolean).join("\n");
}

export function buildSignatureHtml(
  config: MailSignatureConfig = readConfig(),
  options?: { embedded?: boolean }
): string {
  const custom = process.env.TITAN_MAIL_SIGNATURE_HTML?.trim();
  if (custom) {
    return custom;
  }

  const alt = `${config.signerName ?? config.companyName} · ${config.tagline}`;
  const src = options?.embedded ? `cid:${SIGNATURE_CID}` : escapeHtml(config.signatureImageUrl);

  return `<table cellpadding="0" cellspacing="0" role="presentation" style="margin-top:24px;font-family:Arial,Helvetica,sans-serif;">
  <tr>
    <td style="padding:0;">
      <a href="${escapeHtml(config.website)}" style="text-decoration:none;display:inline-block;">
        <img
          src="${src}"
          alt="${escapeHtml(alt)}"
          width="${config.signatureImageWidth}"
          style="display:block;border:0;outline:none;max-width:${config.signatureImageWidth}px;width:100%;height:auto;"
        />
      </a>
    </td>
  </tr>
</table>`;
}

const SIGNATURE_MARKER = "genuadigital.com";

export function hasSignature(content: string): boolean {
  return (
    content.toLowerCase().includes(SIGNATURE_MARKER) ||
    content.includes("genua-signature.png") ||
    content.includes("Umut Avcı")
  );
}

export function appendSignatureText(body: string, config?: MailSignatureConfig): string {
  const trimmed = body.trim();
  if (!trimmed || hasSignature(trimmed)) return trimmed;
  return `${trimmed}\n\n${buildSignatureText(config)}`;
}

export function appendSignatureHtml(
  bodyHtml: string,
  config?: MailSignatureConfig,
  options?: { embedded?: boolean }
): string {
  if (hasSignature(bodyHtml)) return bodyHtml;
  return `${bodyHtml}${buildSignatureHtml(config, options)}`;
}

export function getSignaturePreview() {
  const config = readConfig();
  return {
    text: buildSignatureText(config),
    html: buildSignatureHtml(config),
    logoUrl: config.signatureImageUrl,
  };
}
