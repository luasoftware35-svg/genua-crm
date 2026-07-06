import { readFileSync } from "fs";
import { resolve } from "path";
import { createClient } from "@supabase/supabase-js";
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";
import { extractCompaniesFromPdf } from "../src/lib/pdf-match";

import { inferCityFromImport, inferSourceFromFilename } from "../src/lib/cities";

function inferSource(filename: string, source: string | null): string {
  return source ?? inferSourceFromFilename(filename) ?? "BOSB";
}
const PDF_PATH =
  process.argv[2] ??
  "/Users/umutcanavci/Downloads/BOSB_En_Buyuk_50_Firma.pdf";

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

async function extractTextFromPdf(path: string): Promise<string> {
  const data = new Uint8Array(readFileSync(path));
  const pdf = await getDocument({ data, useSystemFonts: true }).promise;
  const pages: string[] = [];

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const text = content.items
      .map((item) => ("str" in item ? item.str : ""))
      .join(" ");
    pages.push(text.trim());
  }

  return pages.filter(Boolean).join("\n\n");
}

type CompanyRow = {
  id: string;
  name: string;
  member_no: string | null;
};

async function main() {
  const env = loadEnv();
  const url = env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    console.error("Supabase env eksik (.env.local)");
    process.exit(1);
  }

  const filename = PDF_PATH.split("/").pop() ?? "import.pdf";
  console.log("PDF okunuyor:", PDF_PATH);

  const text = await extractTextFromPdf(PDF_PATH);
  const extracted = extractCompaniesFromPdf(text, filename);

  if (extracted.length === 0) {
    console.error("PDF'den firma çıkarılamadı.");
    process.exit(1);
  }

  extracted.sort((a, b) => {
    const na = a.member_no ? parseInt(a.member_no, 10) : 99999;
    const nb = b.member_no ? parseInt(b.member_no, 10) : 99999;
    return na - nb;
  });

  console.log(`Parse: ${extracted.length} firma bulundu`);
  console.log(
    `Şehir: ${inferCityFromImport({ source: inferSource(filename, extracted[0]?.source ?? null), filename, text })}`
  );

  const supabase = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: existing, error: fetchError } = await supabase
    .from("crm_companies")
    .select("id, name, member_no");

  if (fetchError) throw fetchError;

  const byMemberNo = new Map<string, CompanyRow>();
  const byName = new Map<string, CompanyRow>();
  for (const row of (existing ?? []) as CompanyRow[]) {
    if (row.member_no) byMemberNo.set(row.member_no, row);
    byName.set(row.name.toLowerCase(), row);
  }

  const toInsert: Record<string, unknown>[] = [];
  const toUpdate: { id: string; data: Record<string, unknown> }[] = [];

  for (const company of extracted) {
    const source = inferSource(filename, company.source);
    const payload = {
      name: company.name,
      member_no: company.member_no,
      sector: company.sector,
      website: company.website,
      email: company.email,
      phone: company.phone,
      source,
      city: inferCityFromImport({ source, filename, text }),
      audit_status: "bilinmiyor",
      audit_findings: company.findings,
      audit_impact: company.impact,
      audit_pdf_name: filename,
    };

    const hit =
      (company.member_no && byMemberNo.get(company.member_no)) ??
      byName.get(company.name.toLowerCase());

    if (hit) {
      toUpdate.push({ id: hit.id, data: payload });
    } else {
      toInsert.push(payload);
    }
  }

  let updated = 0;
  for (const item of toUpdate) {
    const { error } = await supabase
      .from("crm_companies")
      .update(item.data)
      .eq("id", item.id);
    if (error) throw error;
    updated++;
  }

  let created = 0;
  if (toInsert.length > 0) {
    const { data: inserted, error: insertError } = await supabase
      .from("crm_companies")
      .insert(toInsert)
      .select("id, email, phone");

    if (insertError) throw insertError;
    created = inserted?.length ?? 0;

    const contactRows = (inserted ?? [])
      .map((row: { id: string; email: string | null; phone: string | null }, i: number) => {
        const meta = toInsert[i] as { email?: string | null; phone?: string | null };
        const email = meta.email ?? row.email;
        const phone = meta.phone ?? row.phone;
        if (!email && !phone) return null;
        return {
          company_id: row.id,
          full_name: "Genel İletişim",
          title: null,
          email: email ?? null,
          phone: phone ?? null,
          linkedin_url: null,
          is_primary: true,
        };
      })
      .filter((row): row is NonNullable<typeof row> => row !== null);

    if (contactRows.length > 0) {
      const { error: contactError } = await supabase
        .from("crm_contacts")
        .insert(contactRows);
      if (contactError) throw contactError;
    }
  }

  const { count } = await supabase
    .from("crm_companies")
    .select("*", { count: "exact", head: true });

  console.log("");
  console.log("Import tamamlandı:");
  console.log(`  Yeni: ${created}`);
  console.log(`  Güncellenen: ${updated}`);
  console.log(`  Toplam DB: ${count ?? "?"}`);
  console.log("");
  console.log("Panel: http://localhost:3000/companies");
}

main().catch((err) => {
  console.error("Hata:", err.message ?? err);
  process.exit(1);
});
