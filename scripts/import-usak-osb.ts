import { copyFileSync, existsSync, mkdirSync, readFileSync, readdirSync } from "fs";
import { basename, join, resolve } from "path";
import { createClient } from "@supabase/supabase-js";
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";
import { parseMailMetinleri } from "../src/lib/mail-metinleri";
import { extractCompaniesFromPdf, guessAuditStatus } from "../src/lib/pdf-match";

const SOURCE_DIR =
  process.argv[2] ??
  "/Users/umutcanavci/Desktop/Cloud - Gönder/Uşak Osb - 10 Firma";
const CITY = "Uşak";
const SOURCE = "UOSB";
const PDF_DEST_DIR = resolve(process.cwd(), "public/audits/usak-osb");

const WEBSITE_BY_INDEX: Record<number, string> = {
  1: "https://avstekstil.com",
  2: "https://agreton.com.tr",
  3: "https://alkaratlas.com",
  4: "https://alperteks.com.tr",
  5: "https://altinkozatekstil.com",
  6: "https://altinsar.com.tr",
  7: "https://altunerpvc.com",
  8: "https://arslanelektrik.com.tr",
  9: "https://billurtekstil.com",
  10: "https://aselmop.com.tr",
};

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

function ensurePdfCopies(sourceDir: string): string[] {
  mkdirSync(PDF_DEST_DIR, { recursive: true });
  const files = readdirSync(sourceDir)
    .filter((f) => f.toLowerCase().endsWith(".pdf"))
    .sort();

  for (const file of files) {
    const src = join(sourceDir, file);
    const dest = join(PDF_DEST_DIR, file);
    if (!existsSync(dest)) {
      copyFileSync(src, dest);
    }
  }

  return files;
}

async function main() {
  const env = loadEnv();
  const url = env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    console.error("Supabase env eksik (.env.local)");
    process.exit(1);
  }

  const mailPath = join(SOURCE_DIR, "mail_metinleri.md");
  if (!existsSync(mailPath)) {
    console.error("mail_metinleri.md bulunamadı:", mailPath);
    process.exit(1);
  }

  const mails = parseMailMetinleri(readFileSync(mailPath, "utf8"));
  const pdfFiles = ensurePdfCopies(SOURCE_DIR);

  console.log(`Uşak OSB import: ${mails.length} mail, ${pdfFiles.length} PDF`);

  const supabase = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: existing, error: fetchError } = await supabase
    .from("crm_companies")
    .select("id, name, email");

  if (fetchError) throw fetchError;

  const byName = new Map(
    (existing ?? []).map((row: { id: string; name: string; email: string | null }) => [
      row.name.toLowerCase(),
      row,
    ])
  );

  let created = 0;
  let updated = 0;

  for (const mail of mails) {
    const pdfName =
      pdfFiles.find((f) => f.startsWith(String(mail.index).padStart(2, "0") + "_"));

    if (!pdfName) {
      console.warn(`PDF bulunamadı: #${mail.index} ${mail.companyName}`);
      continue;
    }

    const pdfSourcePath = join(SOURCE_DIR, pdfName);
    const pdfPublicPath = `/audits/usak-osb/${pdfName}`;
    const text = await extractTextFromPdf(pdfSourcePath);
    const extracted = extractCompaniesFromPdf(text, pdfName)[0];
    const website = extracted?.website ?? WEBSITE_BY_INDEX[mail.index] ?? null;

    const payload = {
      name: mail.companyName,
      email: mail.to,
      website,
      source: SOURCE,
      city: CITY,
      audit_status: guessAuditStatus(text),
      audit_findings: extracted?.findings ?? null,
      audit_impact: extracted?.impact ?? null,
      audit_pdf_name: pdfName,
    };

    const hit = byName.get(mail.companyName.toLowerCase());

    if (hit) {
      const { error } = await supabase
        .from("crm_companies")
        .update(payload)
        .eq("id", hit.id);
      if (error) throw error;

      const { data: contacts } = await supabase
        .from("crm_contacts")
        .select("id")
        .eq("company_id", hit.id)
        .eq("is_primary", true)
        .limit(1);

      if (contacts?.length) {
        await supabase
          .from("crm_contacts")
          .update({ email: mail.to })
          .eq("id", contacts[0].id);
      } else {
        await supabase.from("crm_contacts").insert({
          company_id: hit.id,
          full_name: "Genel İletişim",
          email: mail.to,
          is_primary: true,
        });
      }

      updated++;
      console.log(`  Güncellendi: ${mail.companyName}`);
    } else {
      const { data: inserted, error } = await supabase
        .from("crm_companies")
        .insert(payload)
        .select("id")
        .single();
      if (error) throw error;

      await supabase.from("crm_contacts").insert({
        company_id: inserted.id,
        full_name: "Genel İletişim",
        email: mail.to,
        is_primary: true,
      });

      created++;
      console.log(`  Eklendi: ${mail.companyName}`);
    }
  }

  const { count } = await supabase
    .from("crm_companies")
    .select("*", { count: "exact", head: true })
    .eq("city", CITY);

  console.log("");
  console.log("Import tamamlandı:");
  console.log(`  Yeni: ${created}`);
  console.log(`  Güncellenen: ${updated}`);
  console.log(`  Uşak toplam: ${count ?? "?"}`);
}

main().catch((err) => {
  console.error("Hata:", err.message ?? err);
  process.exit(1);
});
