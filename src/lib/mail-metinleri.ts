export type ParsedCompanyMail = {
  index: number;
  companyName: string;
  to: string;
  subject: string;
  body: string;
};

const CLOSING_MARKERS = [
  /^İyi çalışmalar/i,
  /^Saygılarımızla/i,
  /^Genua Digital Media/i,
];

function stripClosing(body: string): string {
  const lines = body.split("\n");
  const out: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      if (out.length > 0 && out[out.length - 1] !== "") out.push("");
      continue;
    }
    if (CLOSING_MARKERS.some((re) => re.test(trimmed))) break;
    out.push(line);
  }

  return out.join("\n").trim();
}

function normalizeEmailAddress(email: string): string {
  const trimmed = email.trim();
  const [localRaw, domainRaw] = trimmed.split("@");
  if (!domainRaw) return trimmed;

  const normalizePart = (part: string) =>
    part
      .replace(/ü/g, "u")
      .replace(/ı/g, "i")
      .replace(/ğ/g, "g")
      .replace(/ş/g, "s")
      .replace(/ö/g, "o")
      .replace(/ç/g, "c")
      .replace(/Ü/g, "u")
      .replace(/İ/g, "i")
      .replace(/Ğ/g, "g")
      .replace(/Ş/g, "s")
      .replace(/Ö/g, "o")
      .replace(/Ç/g, "c");

  const local = normalizePart(localRaw);
  let fixedDomain = normalizePart(domainRaw)
    .replace(/\.comçtr$/i, ".com.tr")
    .replace(/\.comctr$/i, ".com.tr");

  if (fixedDomain === "outlok.com") fixedDomain = "outlook.com";
  if (fixedDomain === "muratbey.com") fixedDomain = "muratbey.com.tr";
  if (fixedDomain === "seslicom.tr") fixedDomain = "sesli.com.tr";
  if (fixedDomain === "endernonwevens.com") fixedDomain = "endernonwovens.com";

  return `${local}@${fixedDomain}`;
}

function extractEmailFromKime(raw: string): string {
  const firstPart = raw.split(/[;,]/)[0]?.trim() ?? raw;
  const match = firstPart.match(
    /[a-zA-Z0-9._%+\-ğüşıöçĞÜŞİÖÇ]+@[a-zA-Z0-9.\-ğüşıöçĞÜŞİÖÇ]+\.[a-zA-Z]{2,}/
  );
  return match ? normalizeEmailAddress(match[0]) : "";
}

/** mail_metinleri.md dosyasından firma bazlı mail içeriklerini çıkarır */
export function parseMailMetinleri(markdown: string): ParsedCompanyMail[] {
  const sections = markdown.split(/^##\s+(\d+)\.\s+/m);
  const results: ParsedCompanyMail[] = [];

  for (let i = 1; i < sections.length; i += 2) {
    const index = Number(sections[i]);
    const block = sections[i + 1] ?? "";
    const companyName = block.split("\n")[0]?.trim() ?? "";
    const toRaw = block.match(/\*\*Kime:\*\*\s*(.+)/)?.[1]?.trim() ?? "";
    const to = extractEmailFromKime(toRaw);
    const subject = block.match(/\*\*Konu:\*\*\s*(.+)/)?.[1]?.trim() ?? "";

    const bodyStart = block.indexOf("Merhaba,");
    let body = "";
    if (bodyStart >= 0) {
      body = stripClosing(block.slice(bodyStart));
    }

    if (!companyName || !to || !subject || !body) continue;

    results.push({ index, companyName, to, subject, body });
  }

  return results.sort((a, b) => a.index - b.index);
}
