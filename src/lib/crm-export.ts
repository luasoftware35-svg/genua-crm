import type { Company, Deal } from "@/types";

export type ExportCompanyRow = Company & { deal: Deal | null };

export function companiesToCsv(rows: ExportCompanyRow[]): string {
  const headers = [
    "No",
    "Firma Adı",
    "Şehir",
    "Kaynak",
    "Sektör",
    "Telefon",
    "E-posta",
    "Web Sitesi",
    "Denetim",
    "Pipeline",
  ];

  const lines = rows.map((c) => [
    c.member_no ?? "",
    c.name,
    c.city ?? "",
    c.source ?? "",
    c.sector ?? "",
    c.phone ?? "",
    c.email ?? "",
    c.website ?? "",
    c.audit_status ?? "",
    c.deal?.stage ?? "",
  ]);

  const escape = (v: string) => {
    if (/[",;\n]/.test(v)) return `"${v.replace(/"/g, '""')}"`;
    return v;
  };

  return "\uFEFF" + [headers, ...lines].map((row) => row.map(escape).join(";")).join("\n");
}

export function downloadCsv(filename: string, csv: string) {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
