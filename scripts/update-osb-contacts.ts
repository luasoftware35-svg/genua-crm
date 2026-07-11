import { readFileSync, writeFileSync } from "fs";
import { resolve, join } from "path";
import { promises as dns } from "dns";
import { createClient } from "@supabase/supabase-js";
import { mergeCampaignTemplatesToFile } from "../src/lib/campaign-import";
import { OSB_TEKLIF_ENTRIES } from "../src/lib/osb-teklif-meta";

const SLUG = "genel-osb-teklif-2026";
const EXCEL_DEFAULT =
  "/Users/umutcanavci/Downloads/Genua-Digital-50-OSB-Iletisim-Listesi.xlsx";

const EXCEL_TO_CRM: Record<string, string> = {
  "Diyarbakır OSB": "Diyarbakır OSB",
  "Uşak OSB": "Uşak OSB",
  "Bursa OSB": "Bursa OSB",
  "Gaziantep OSB": "Gaziantep OSB",
  "Eskişehir OSB": "Eskişehir OSB",
  "Konya OSB": "Konya OSB",
  "Gebze OSB": "Gebze OSB",
  "Dilovası OSB": "Dilovası OSB",
  "İzmir Atatürk OSB": "İzmir Atatürk OSB",
  "Aliağa OSB (ALOSBİ)": "Aliağa OSB",
  "Kemalpaşa OSB (KOSBİ)": "Kemalpaşa OSB",
  "İkitelli OSB": "İkitelli OSB",
  "OSTİM OSB": "Ostim Ankara OSB",
  "Başkent OSB": "Başkent Ankara OSB",
  "ASO 1. OSB (Sincan)": "Sincan Ankara OSB",
  "Denizli OSB": "Denizli OSB",
  "Çorlu 1 OSB": "Çorlu OSB",
  "Çerkezköy OSB": "Çerkezköy OSB",
  "Kayseri OSB": "Kayseri OSB",
  "Adana OSB (Hacı Sabancı)": "Adana OSB",
  "Manisa OSB (MOSB)": "Manisa OSB",
  "Kahramanmaraş OSB": "Kahramanmaraş OSB",
  "Malatya 2. OSB": "Malatya OSB",
  "Şanlıurfa OSB": "Şanlıurfa OSB",
  "Samsun (Merkez) OSB": "Samsun OSB",
  "Trabzon Arsin OSB": "Trabzon OSB",
  "Sakarya 1. OSB": "Sakarya OSB",
  "Balıkesir OSB (BALOSB)": "Balıkesir OSB",
  "Antalya OSB": "Antalya OSB",
  "Adıyaman OSB": "Adıyaman OSB",
  "Mersin (Tarsus) OSB": "Mersin OSB",
  "Hatay (Antakya) OSB": "Hatay OSB",
  "Elazığ OSB": "Elazığ OSB",
  "Erzurum 1. OSB": "Erzurum OSB",
  "Sivas OSB": "Sivas OSB",
  "Çanakkale OSB": "Çanakkale OSB",
  "Aydın OSB": "Aydın OSB",
  "Isparta (Süleyman Demirel) OSB": "Isparta OSB",
  "Afyonkarahisar OSB": "Afyonkarahisar OSB",
  "Kütahya OSB": "Kütahya OSB",
  "Çorum OSB": "Çorum OSB",
  "Amasya OSB": "Amasya OSB",
  "Tokat OSB": "Tokat OSB",
  "Ordu (Fatsa) OSB": "Ordu OSB",
  "Giresun OSB": "Giresun OSB",
  "Van OSB": "Van OSB",
  "Mardin 2. OSB": "Mardin OSB",
  "Batman OSB": "Batman OSB",
  "Osmaniye OSB": "Osmaniye OSB",
  "Karaman OSB": "Karaman OSB",
};

type ContactRow = {
  excelName: string;
  city: string;
  email: string;
  phone: string;
  note: string;
  crmName: string;
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

function parseXlsx(path: string): ContactRow[] {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const XLSX = require("xlsx");
  const wb = XLSX.readFile(path);
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(sheet, { defval: "" }) as Record<string, string>[];

  return rows.map((row) => {
    const excelName = String(row["OSB Adı"] ?? row["OSB Adi"] ?? "").trim();
    const emailRaw = String(row["E-posta"] ?? row["Eposta"] ?? "").trim();
    const email = !emailRaw || emailRaw === "—" || emailRaw === "-" ? "" : emailRaw;
    const phoneRaw = String(row["Telefon"] ?? "").trim();
    const phone = !phoneRaw || phoneRaw === "—" || phoneRaw === "-" ? "" : phoneRaw;
    const crmName = EXCEL_TO_CRM[excelName];
    if (!crmName) throw new Error(`CRM eşleşmesi yok: ${excelName}`);

    return {
      excelName,
      city: String(row["Şehir"] ?? row["Sehir"] ?? "").trim(),
      email,
      phone,
      note: String(row["Not"] ?? "").trim(),
      crmName,
    };
  });
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
  const excelPath = resolve(process.argv[2] ?? EXCEL_DEFAULT);
  const rows = parseXlsx(excelPath);

  const env = loadEnv();
  const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL!, env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const templatesPath = join(process.cwd(), "data/campaigns", SLUG, "mail-templates.json");
  const templates = JSON.parse(readFileSync(templatesPath, "utf8")) as Record<
    string,
    { companyName: string; to: string; subject: string; body: string; pdfPath: string; dnsOk?: boolean }
  >;

  const pdfByCompany = new Map(
    OSB_TEKLIF_ENTRIES.map((e) => [e.name, `${String(e.index).padStart(2, "0")}_${e.fileKey.replace(/-/g, "_")}_OSB.pdf`])
  );

  let updated = 0;
  let withEmail = 0;
  let noEmail = 0;

  console.log(`OSB iletişim güncelleme: ${rows.length} satır`);
  console.log("");

  for (const row of rows) {
    const { data: companies } = await supabase
      .from("crm_companies")
      .select("id,name")
      .eq("name", row.crmName)
      .eq("source", "OSB")
      .limit(1);

    const company = companies?.[0];
    if (!company) {
      console.warn(`⊘ Panelde bulunamadı: ${row.crmName}`);
      continue;
    }

    const dnsOk = row.email ? await mxOk(row.email) : false;

    await supabase
      .from("crm_companies")
      .update({
        email: row.email || null,
        phone: row.phone || null,
        audit_findings: row.note
          ? `OSB teklif dosyası (2026). Not: ${row.note}`
          : "OSB üyelerine özel dijital dönüşüm teklif dosyası (2026).",
      })
      .eq("id", company.id);

    const { data: contacts } = await supabase
      .from("crm_contacts")
      .select("id")
      .eq("company_id", company.id)
      .eq("is_primary", true)
      .limit(1);

    if (contacts?.[0]) {
      await supabase
        .from("crm_contacts")
        .update({ email: row.email || null, phone: row.phone || null })
        .eq("id", contacts[0].id);
    }

    const pdfName = pdfByCompany.get(row.crmName);
    if (pdfName && templates[pdfName]) {
      templates[pdfName].to = row.email;
      templates[pdfName].dnsOk = dnsOk;
    }

    if (row.email) {
      withEmail++;
      console.log(`${dnsOk ? "✓" : "⊘"} ${row.crmName} → ${row.email}${row.phone ? ` · ${row.phone}` : ""}`);
    } else {
      noEmail++;
      console.log(`— ${row.crmName} — e-posta yok (${row.note || "form/telefon"})`);
    }
    updated++;
  }

  writeFileSync(templatesPath, JSON.stringify(templates, null, 2));
  mergeCampaignTemplatesToFile();

  console.log("");
  console.log(`Güncellenen: ${updated} · E-postalı: ${withEmail} · E-postasız: ${noEmail}`);
}

main().catch((err) => {
  console.error("Hata:", err.message ?? err);
  process.exit(1);
});
