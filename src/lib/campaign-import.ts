import { existsSync, readFileSync, readdirSync, writeFileSync } from "fs";
import { basename, join } from "path";

export type OutreachMailTemplate = {
  companyName: string;
  to: string;
  subject: string;
  body: string;
  pdfPath: string;
  dnsOk?: boolean;
};

export type CampaignMeta = {
  slug: string;
  city: string;
  source: string;
  label: string;
};

const CAMPAIGNS_DIR = join(process.cwd(), "data/campaigns");
const OUTPUT = join(process.cwd(), "data/all-mail-templates.json");

function cityToSlug(city: string): string {
  return city
    .toLowerCase()
    .replace(/ı/g, "i")
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ş/g, "s")
    .replace(/ö/g, "o")
    .replace(/ç/g, "c")
    .replace(/\s+/g, "-");
}

export function inferCampaignMeta(input: {
  folderPath: string;
  city?: string;
  source?: string;
  slug?: string;
}): CampaignMeta {
  const folderName = basename(input.folderPath);
  const lower = folderName.toLowerCase();

  let city = input.city ?? "";
  let source = input.source ?? "";
  let slug = input.slug ?? "";

  if (!city) {
    if (/uşak|usak/.test(lower)) city = "Uşak";
    else if (/sakarya|sosb/.test(lower)) city = "Sakarya";
    else if (/bursa|bosb/.test(lower)) city = "Bursa";
    else if (/denizli|dosb/.test(lower)) city = "Denizli";
    else city = "Genel";
  }

  if (!source) {
    if (/uosb|uşak|usak/.test(lower)) source = "UOSB";
    else if (/sosb|sakarya/.test(lower)) source = "SOSB";
    else if (/bosb|bursa/.test(lower)) source = "BOSB";
    else if (/dosb|denizli/.test(lower)) source = "DOSB";
    else source = "OSB";
  }

  if (!slug) {
    slug = `${cityToSlug(city)}-${source.toLowerCase()}`.replace(/-osb-osb$/, "-osb");
  }

  return { slug, city, source, label: folderName };
}

export function mergeCampaignTemplatesToFile(): Record<string, OutreachMailTemplate> {
  const merged: Record<string, OutreachMailTemplate> = {};

  if (existsSync(CAMPAIGNS_DIR)) {
    for (const dir of readdirSync(CAMPAIGNS_DIR, { withFileTypes: true }).filter((d) =>
      d.isDirectory()
    )) {
      const jsonPath = join(CAMPAIGNS_DIR, dir.name, "mail-templates.json");
      if (!existsSync(jsonPath)) continue;
      Object.assign(merged, JSON.parse(readFileSync(jsonPath, "utf8")));
    }
  }

  const legacy = join(process.cwd(), "data/usak-osb/mail-templates.json");
  if (existsSync(legacy)) {
    Object.assign(merged, JSON.parse(readFileSync(legacy, "utf8")));
  }

  writeFileSync(OUTPUT, JSON.stringify(merged, null, 2));
  return merged;
}

export function loadAllMailTemplates(): Record<string, OutreachMailTemplate> {
  if (existsSync(OUTPUT)) {
    return JSON.parse(readFileSync(OUTPUT, "utf8"));
  }
  return mergeCampaignTemplatesToFile();
}
