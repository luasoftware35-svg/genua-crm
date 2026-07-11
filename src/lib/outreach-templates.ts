import allTemplates from "../../data/all-mail-templates.json";
import type { OutreachMailTemplate } from "@/lib/campaign-import";

export type { OutreachMailTemplate };

const templates = allTemplates as Record<string, OutreachMailTemplate>;

function normalizeName(name: string): string {
  return name.toLowerCase().replace(/\s+/g, " ").trim();
}

const byName = Object.values(templates).reduce<Record<string, OutreachMailTemplate>>((acc, item) => {
  acc[normalizeName(item.companyName)] = item;
  return acc;
}, {});

function basename(path: string): string {
  return path.split("/").pop() ?? path;
}

function findByPdfName(pdfName: string): OutreachMailTemplate | null {
  if (templates[pdfName]) return templates[pdfName];
  return (
    Object.values(templates).find(
      (t) => t.pdfPath.endsWith(`/${pdfName}`) || basename(t.pdfPath) === pdfName
    ) ?? null
  );
}

export function getOutreachMailTemplate(input: {
  companyName: string;
  auditPdfName?: string | null;
  auditPdfPath?: string | null;
}): OutreachMailTemplate | null {
  if (input.auditPdfPath) {
    const byPath = Object.values(templates).find((t) => t.pdfPath === input.auditPdfPath);
    if (byPath) return byPath;
  }

  if (input.auditPdfName) {
    const hit = findByPdfName(input.auditPdfName);
    if (hit) return hit;
  }

  return byName[normalizeName(input.companyName)] ?? null;
}

export function getOutreachPdfPath(
  auditPdfName?: string | null,
  auditPdfPath?: string | null
): string | null {
  if (auditPdfPath?.trim()) return auditPdfPath.trim();
  const template = auditPdfName ? findByPdfName(auditPdfName) : null;
  if (template?.pdfPath) return template.pdfPath;
  if (!auditPdfName) return null;
  return null;
}
