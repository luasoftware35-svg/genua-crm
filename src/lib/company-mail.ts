import { appendSignatureHtml, appendSignatureText } from "@/lib/mail-signature";
import { buildOutreachMailContent } from "@/lib/mail-templates";
import { getOutreachMailTemplate, getOutreachPdfPath } from "@/lib/outreach-templates";
import type { Company } from "@/types";

export type CompanyMailInput = {
  companyName: string;
  website?: string | null;
  source?: string | null;
  auditFindings?: string | null;
  auditImpact?: string | null;
  mailSubject?: string | null;
  mailBody?: string | null;
  auditPdfName?: string | null;
};

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function formatMailTextAsHtml(text: string): string {
  const paragraphs = text
    .trim()
    .split(/\n\n+/)
    .map((p) => p.trim())
    .filter(Boolean);

  const inner = paragraphs
    .map(
      (p) =>
        `<p style="margin:0 0 14px;line-height:1.65;">${escapeHtml(p).replace(/\n/g, "<br/>")}</p>`
    )
    .join("");

  return `<div style="font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#374151;">${inner}</div>`;
}

function withClosing(bodyText: string): string {
  const trimmed = bodyText.trim();
  if (/saygılarımızla|iyi çalışmalar/i.test(trimmed)) return trimmed;
  return `${trimmed}\n\nSaygılarımızla,`;
}

export function buildCompanyMailContent(input: CompanyMailInput) {
  const template = getOutreachMailTemplate({
    companyName: input.companyName,
    auditPdfName: input.auditPdfName,
  });

  const subject = input.mailSubject?.trim() || template?.subject;
  const rawBody = input.mailBody?.trim() || template?.body;

  if (subject && rawBody) {
    const bodyText = withClosing(rawBody);
    return {
      subject,
      bodyText,
      bodyHtml: formatMailTextAsHtml(bodyText),
      isCustom: true,
    };
  }

  const fallback = buildOutreachMailContent({
    companyName: input.companyName,
    website: input.website,
    source: input.source,
    auditFindings: null,
    auditImpact: null,
  });
  return { ...fallback, isCustom: false };
}

export function buildCompanyMail(input: CompanyMailInput) {
  const content = buildCompanyMailContent(input);
  return {
    subject: content.subject,
    text: appendSignatureText(content.bodyText),
    html: appendSignatureHtml(content.bodyHtml),
    isCustom: content.isCustom,
  };
}

export function companyToMailInput(company: Company): CompanyMailInput {
  return {
    companyName: company.name,
    website: company.website,
    source: company.source,
    auditFindings: company.audit_findings,
    auditImpact: company.audit_impact,
    mailSubject: company.mail_subject,
    mailBody: company.mail_body,
    auditPdfName: company.audit_pdf_name,
  };
}

export function getCompanyAuditPdfPath(company: Company): string | null {
  if (company.audit_pdf_path?.trim()) return company.audit_pdf_path.trim();
  return getOutreachPdfPath(company.audit_pdf_name, company.audit_pdf_path);
}
