import Papa from "papaparse";

export type CsvColumnMapping = {
  name: string;
  website: string;
  email: string;
  phone: string;
  source: string;
  sector: string;
};

export type ParsedCompanyRow = {
  name: string;
  website: string | null;
  email: string | null;
  phone: string | null;
  source: string | null;
  sector: string | null;
};

const COLUMN_ALIASES: Record<keyof CsvColumnMapping, string[]> = {
  name: ["firma", "firma adi", "firma adı", "firma_adi", "sirket", "şirket", "name", "company", "unvan", "ünvan"],
  website: ["website", "web", "site", "web sitesi", "url", "domain"],
  email: ["email", "e-posta", "eposta", "e_posta", "mail"],
  phone: ["phone", "telefon", "tel", "gsm"],
  source: ["source", "kaynak", "osb", "liste"],
  sector: ["sector", "sektör", "sektor", "faaliyet", "branş", "brans"],
};

function normalizeHeader(h: string): string {
  return h.trim().toLowerCase().replace(/[_-]/g, " ");
}

export function parseCsvFile(file: File): Promise<Record<string, string>[]> {
  return new Promise((resolve, reject) => {
    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => resolve(results.data),
      error: (err) => reject(err),
    });
  });
}

export function autoDetectColumns(headers: string[]): Partial<CsvColumnMapping> {
  const mapping: Partial<CsvColumnMapping> = {};
  const normalized = headers.map((h) => ({ original: h, norm: normalizeHeader(h) }));

  for (const [field, aliases] of Object.entries(COLUMN_ALIASES) as [keyof CsvColumnMapping, string[]][]) {
    const match = normalized.find(({ norm }) =>
      aliases.some((alias) => norm === alias || norm.includes(alias))
    );
    if (match) mapping[field] = match.original;
  }

  return mapping;
}

export function mapRowsToCompanies(
  rows: Record<string, string>[],
  mapping: Partial<CsvColumnMapping>
): ParsedCompanyRow[] {
  return rows
    .map((row) => {
      const name = mapping.name ? row[mapping.name]?.trim() : "";
      if (!name) return null;
      return {
        name,
        website: mapping.website ? row[mapping.website]?.trim() || null : null,
        email: mapping.email ? row[mapping.email]?.trim() || null : null,
        phone: mapping.phone ? row[mapping.phone]?.trim() || null : null,
        source: mapping.source ? row[mapping.source]?.trim() || null : null,
        sector: mapping.sector ? row[mapping.sector]?.trim() || null : null,
      };
    })
    .filter((r): r is ParsedCompanyRow => r !== null);
}

export function getCsvHeaders(rows: Record<string, string>[]): string[] {
  if (rows.length === 0) return [];
  return Object.keys(rows[0]);
}
