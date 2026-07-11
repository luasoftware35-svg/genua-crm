import { copyFileSync, existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "fs";
import { join, resolve } from "path";
import { promises as dns } from "dns";
import { createClient } from "@supabase/supabase-js";
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";
import { inferCampaignMeta, mergeCampaignTemplatesToFile } from "../src/lib/campaign-import";
import { parseMailMetinleri } from "../src/lib/mail-metinleri";
import { extractCompaniesFromPdf, guessAuditStatus } from "../src/lib/pdf-match";

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

function parseArgs() {
  const args = process.argv.slice(2);
  let folder = "";
  let city = "";
  let source = "";
  let slug = "";

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--city") city = args[++i] ?? "";
    else if (args[i] === "--source") source = args[++i] ?? "";
    else if (args[i] === "--slug") slug = args[++i] ?? "";
    else if (!args[i].startsWith("--")) folder = args[i];
  }

  if (!folder) {
    folder = "/Users/umutcanavci/Desktop/Cloud - Gönder/Uşak Osb - 10 Firma";
  }

  return { folder: resolve(folder), city, source, slug };
}

async function extractTextFromPdf(path: string): Promise<string> {
  const data = new Uint8Array(readFileSync(path));
  const pdf = await getDocument({ data, useSystemFonts: true }).promise;
  const pages: string[] = [];
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    pages.push(
      content.items.map((item) => ("str" in item ? item.str : "")).join(" ").trim()
    );
  }
  return pages.filter(Boolean).join("\n\n");
}

function websiteFromSubject(subject: string): string | null {
  const m = subject.match(/([\w.-]+\.(?:com|com\.tr|net|org)(?:\.tr)?)/i);
  if (!m) return null;
  const host = m[1].toLowerCase();
  return host.startsWith("http") ? host : `https://${host}`;
}

async function mxOk(email: string) {
  const domain = email.split("@")[1]?.toLowerCase();
  if (!domain) return false;
  try {
    const mx = await dns.resolveMx(domain);
    return mx.length > 0;
  } catch {
    return false;
  }
}

async function main() {
  const { folder, city, source, slug } = parseArgs();
  const meta = inferCampaignMeta({ folderPath: folder, city, source, slug });
  const mailPath = (() => {
    const canonical = join(folder, "mail_metinleri.md");
    if (existsSync(canonical)) return canonical;
    const mdFiles = readdirSync(folder).filter((f) => f.toLowerCase().endsWith(".md"));
    if (mdFiles.length === 1) return join(folder, mdFiles[0]);
    const preferred = mdFiles.find((f) => /mail|osb/i.test(f));
    if (preferred) return join(folder, preferred);
    return canonical;
  })();

  if (!existsSync(mailPath)) {
    console.error("Mail metinleri dosyası bulunamadı:", mailPath);
    process.exit(1);
  }

  const mails = parseMailMetinleri(readFileSync(mailPath, "utf8"));
  const pdfFiles = readdirSync(folder)
    .filter((f) => f.toLowerCase().endsWith(".pdf"))
    .sort();

  const campaignDataDir = resolve(process.cwd(), "data/campaigns", meta.slug);
  const pdfDestDir = resolve(process.cwd(), "public/audits", meta.slug);
  mkdirSync(campaignDataDir, { recursive: true });
  mkdirSync(pdfDestDir, { recursive: true });

  copyFileSync(mailPath, join(campaignDataDir, "mail-metinleri.md"));

  for (const file of pdfFiles) {
    const dest = join(pdfDestDir, file);
    if (!existsSync(dest)) copyFileSync(join(folder, file), dest);
  }

  const templates: Record<string, unknown> = {};
  const env = loadEnv();
  const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL!, env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: existing } = await supabase.from("crm_companies").select("id, name, email");
  const byName = new Map(
    (existing ?? []).map((r: { id: string; name: string }) => [r.name.toLowerCase(), r])
  );

  let created = 0;
  let updated = 0;

  console.log(`Kampanya: ${meta.label}`);
  console.log(`Şehir: ${meta.city} · Kaynak: ${meta.source} · Slug: ${meta.slug}`);
  console.log(`Mail: ${mails.length} · PDF: ${pdfFiles.length}`);
  console.log("");

  for (const mail of mails) {
    const pdfPrefix = `${String(mail.index).padStart(2, "0")}_`;
    const pdfName = pdfFiles.find((f) => f.startsWith(pdfPrefix));

    if (!pdfName) {
      console.warn(`PDF bulunamadı: #${mail.index} ${mail.companyName}`);
      continue;
    }

    const pdfPath = `/audits/${meta.slug}/${pdfName}`;
    const text = await extractTextFromPdf(join(folder, pdfName));
    const extracted = extractCompaniesFromPdf(text, pdfName)[0];
    const website = extracted?.website ?? websiteFromSubject(mail.subject);

    templates[pdfName] = {
      companyName: mail.companyName,
      to: mail.to,
      subject: mail.subject,
      body: mail.body,
      pdfPath,
      dnsOk: await mxOk(mail.to),
    };

    const payload = {
      name: mail.companyName,
      email: mail.to,
      website,
      source: meta.source,
      city: meta.city,
      audit_status: guessAuditStatus(text),
      audit_findings: extracted?.findings ?? null,
      audit_impact: extracted?.impact ?? null,
      audit_pdf_name: pdfName,
    };

    const hit = byName.get(mail.companyName.toLowerCase());
    if (hit) {
      await supabase.from("crm_companies").update(payload).eq("id", hit.id);
      const { data: contacts } = await supabase
        .from("crm_contacts")
        .select("id")
        .eq("company_id", hit.id)
        .eq("is_primary", true)
        .limit(1);
      if (contacts?.length) {
        await supabase.from("crm_contacts").update({ email: mail.to }).eq("id", contacts[0].id);
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
      const { data: inserted } = await supabase
        .from("crm_companies")
        .insert(payload)
        .select("id")
        .single();
      await supabase.from("crm_contacts").insert({
        company_id: inserted!.id,
        full_name: "Genel İletişim",
        email: mail.to,
        is_primary: true,
      });
      created++;
      console.log(`  Eklendi: ${mail.companyName}`);
    }
  }

  writeFileSync(join(campaignDataDir, "mail-templates.json"), JSON.stringify(templates, null, 2));
  writeFileSync(join(campaignDataDir, "meta.json"), JSON.stringify(meta, null, 2));

  const merged = mergeCampaignTemplatesToFile();
  console.log(`  Birleşik şablon: data/all-mail-templates.json (${Object.keys(merged).length} kayıt)`);

  const { count } = await supabase
    .from("crm_companies")
    .select("*", { count: "exact", head: true })
    .eq("city", meta.city);

  console.log("");
  console.log("Import tamamlandı:");
  console.log(`  Yeni: ${created}`);
  console.log(`  Güncellenen: ${updated}`);
  console.log(`  ${meta.city} toplam: ${count ?? "?"}`);
  console.log(`  Şablon: data/campaigns/${meta.slug}/mail-templates.json`);
  console.log(`  PDF: public/audits/${meta.slug}/`);
}

main().catch((err) => {
  console.error("Hata:", err.message ?? err);
  process.exit(1);
});
