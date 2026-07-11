import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { join, resolve } from "path";
import { createClient } from "@supabase/supabase-js";
import { mergeCampaignTemplatesToFile } from "../src/lib/campaign-import";
import {
  buildOsbTeklifMail,
  buildMailMetinleriMarkdown,
  destPdfName,
  OSB_TEKLIF_ENTRIES,
  sourcePdfName,
} from "../src/lib/osb-teklif-meta";

const SLUG = "genel-osb-teklif-2026";
const SOURCE = "OSB";
const DEFAULT_FOLDER =
  "/Users/umutcanavci/Downloads/Genua-Digital-50-OSB-Teklifleri-2026";

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

async function main() {
  const folder = resolve(process.argv[2] ?? DEFAULT_FOLDER);
  const campaignDataDir = resolve(process.cwd(), "data/campaigns", SLUG);
  const pdfDestDir = resolve(process.cwd(), "public/audits", SLUG);
  mkdirSync(campaignDataDir, { recursive: true });
  mkdirSync(pdfDestDir, { recursive: true });

  writeFileSync(
    join(campaignDataDir, "mail-metinleri.md"),
    buildMailMetinleriMarkdown(OSB_TEKLIF_ENTRIES),
    "utf8"
  );

  writeFileSync(
    join(campaignDataDir, "meta.json"),
    JSON.stringify(
      {
        slug: SLUG,
        city: "Genel",
        source: SOURCE,
        label: "Genel OSB Teklif 2026 (50 OSB)",
      },
      null,
      2
    )
  );

  const templates: Record<string, unknown> = {};
  const env = loadEnv();
  const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL!, env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: existing } = await supabase.from("crm_companies").select("id, name");
  const byName = new Map(
    (existing ?? []).map((r: { id: string; name: string }) => [r.name.toLowerCase(), r])
  );

  let created = 0;
  let updated = 0;
  let missing = 0;

  console.log(`Genel OSB teklif import: ${OSB_TEKLIF_ENTRIES.length} OSB`);
  console.log(`Klasör: ${folder}`);
  console.log("");

  for (const entry of OSB_TEKLIF_ENTRIES) {
    const srcName = sourcePdfName(entry.fileKey);
    const srcPath = join(folder, srcName);
    const pdfName = destPdfName(entry.index, entry.fileKey);
    const pdfPath = `/audits/${SLUG}/${pdfName}`;

    if (!existsSync(srcPath)) {
      console.warn(`PDF bulunamadı: ${srcName}`);
      missing++;
      continue;
    }

    copyFileSync(srcPath, join(pdfDestDir, pdfName));

    const { subject, body } = buildOsbTeklifMail(entry);

    templates[pdfName] = {
      companyName: entry.name,
      to: "",
      subject,
      body,
      pdfPath,
      dnsOk: false,
    };

    const payload = {
      name: entry.name,
      email: null,
      website: null,
      source: SOURCE,
      city: entry.city,
      sector: "OSB Yönetimi",
      audit_status: null,
      audit_findings: "OSB üyelerine özel dijital dönüşüm teklif dosyası (2026).",
      audit_impact: "OSB yönetimi veya üye firmalarına paylaşılabilir kurumsal teklif.",
      audit_pdf_name: pdfName,
    };

    const hit = byName.get(entry.name.toLowerCase());
    if (hit) {
      await supabase.from("crm_companies").update(payload).eq("id", hit.id);
      updated++;
      console.log(`  Güncellendi: ${entry.name} (${entry.city})`);
    } else {
      const { data: inserted, error: insertError } = await supabase
        .from("crm_companies")
        .insert(payload)
        .select("id")
        .single();
      if (insertError || !inserted) {
        console.error(`  Hata (${entry.name}):`, insertError?.message ?? "insert başarısız");
        continue;
      }
      await supabase.from("crm_contacts").insert({
        company_id: inserted.id,
        full_name: "OSB Yönetimi",
        email: null,
        is_primary: true,
      });
      created++;
      console.log(`  Eklendi: ${entry.name} (${entry.city})`);
    }
  }

  writeFileSync(join(campaignDataDir, "mail-templates.json"), JSON.stringify(templates, null, 2));
  const merged = mergeCampaignTemplatesToFile();

  console.log("");
  console.log("Import tamamlandı:");
  console.log(`  Yeni: ${created}`);
  console.log(`  Güncellenen: ${updated}`);
  console.log(`  Eksik PDF: ${missing}`);
  console.log(`  Birleşik şablon: ${Object.keys(merged).length} kayıt`);
  console.log(`  PDF: public/audits/${SLUG}/`);
}

main().catch((err) => {
  console.error("Hata:", err.message ?? err);
  process.exit(1);
});
