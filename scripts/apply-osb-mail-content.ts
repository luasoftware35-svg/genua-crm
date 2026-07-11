import { readFileSync, writeFileSync } from "fs";
import { join, resolve } from "path";
import { mergeCampaignTemplatesToFile } from "../src/lib/campaign-import";
import {
  buildMailMetinleriMarkdown,
  buildOsbTeklifMail,
  destPdfName,
  OSB_TEKLIF_ENTRIES,
} from "../src/lib/osb-teklif-meta";

const SLUG = "genel-osb-teklif-2026";

async function main() {
  const campaignDir = resolve(process.cwd(), "data/campaigns", SLUG);
  const templatesPath = join(campaignDir, "mail-templates.json");
  const existing = JSON.parse(readFileSync(templatesPath, "utf8")) as Record<
    string,
    { companyName: string; to: string; subject: string; body: string; pdfPath: string; dnsOk?: boolean }
  >;

  const templates: typeof existing = {};

  for (const entry of OSB_TEKLIF_ENTRIES) {
    const pdfName = destPdfName(entry.index, entry.fileKey);
    const pdfPath = `/audits/${SLUG}/${pdfName}`;
    const { subject, body } = buildOsbTeklifMail(entry);
    const prev = existing[pdfName];

    templates[pdfName] = {
      companyName: entry.name,
      to: prev?.to ?? "",
      subject,
      body,
      pdfPath,
      dnsOk: prev?.dnsOk,
    };
  }

  writeFileSync(templatesPath, JSON.stringify(templates, null, 2));
  writeFileSync(join(campaignDir, "mail-metinleri.md"), buildMailMetinleriMarkdown(OSB_TEKLIF_ENTRIES));

  const merged = mergeCampaignTemplatesToFile();
  console.log(`OSB mail metinleri güncellendi: ${OSB_TEKLIF_ENTRIES.length} kayıt`);
  console.log(`Birleşik şablon: ${Object.keys(merged).length} kayıt`);
}

main().catch((err) => {
  console.error("Hata:", err.message ?? err);
  process.exit(1);
});
