import type { Company } from "@/types";

export type ParsedCompanyReport = {
  detectedName: string;
  companyId: string | null;
  website: string | null;
  text: string;
  findings: string;
  impact: string | null;
  matchScore: number;
};

function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/\.pdf$/i, "")
    .replace(/[-_]/g, " ")
    .replace(/\bt\s*caret\b/gi, "ticaret")
    .replace(/\bsanay\b/gi, "sanayi")
    .replace(/\btic\b/gi, "ticaret")
    .replace(/\s+(san|tic|a\.ş|a\.s|ltd|şti)[.\s]*/gi, " ")
    .replace(/[^a-z0-9ğüşıöç\s]/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Dosya adından firma adı çıkar: 07_BOSCH_SANAY_VE_T_CARET_A.pdf */
export function parseCompanyNameFromFilename(filename: string): string {
  let name = filename.replace(/\.pdf$/i, "").replace(/^\d+[-_]/, "");
  name = name.replace(/_/g, " ");
  name = name
    .replace(/\bT\s*CARET\b/gi, "Ticaret")
    .replace(/\bSANAY\b/gi, "Sanayi")
    .replace(/\bTICARET\b/gi, "Ticaret")
    .replace(/\bVE\b/g, "ve")
    .replace(/\s+A\.?\s*$/i, " A.Ş.");

  return name
    .split(" ")
    .filter(Boolean)
    .map((w) => {
      if (w.toLowerCase() === "ve") return "ve";
      return w.length <= 2 ? w.toUpperCase() : w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();
    })
    .join(" ")
    .replace(/\bA\.ş\./gi, "A.Ş.");
}

export function findBestCompanyMatch(
  query: string,
  companies: Company[]
): { company: Company; score: number } | null {
  const q = normalize(query);
  if (!q) return null;

  let best: Company | null = null;
  let bestScore = 0;

  for (const company of companies) {
    const name = normalize(company.name);
    if (!name) continue;
    if (q.includes(name) || name.includes(q)) return { company, score: 1 };
    const score = wordOverlap(q, name);
    if (score > bestScore) {
      bestScore = score;
      best = company;
    }
  }

  return best && bestScore >= 0.35 ? { company: best, score: bestScore } : null;
}

function wordOverlap(a: string, b: string): number {
  const wordsA = a.split(" ").filter((w) => w.length > 2);
  if (wordsA.length === 0) return 0;
  return wordsA.filter((w) => b.includes(w)).length / wordsA.length;
}

function getDomain(url: string | null): string | null {
  if (!url) return null;
  try {
    const host = new URL(url.startsWith("http") ? url : `https://${url}`).hostname;
    return host.replace(/^www\./, "").toLowerCase();
  } catch {
    return url.replace(/^https?:\/\//, "").replace(/^www\./, "").split("/")[0].toLowerCase();
  }
}

function nameVariants(name: string): string[] {
  const base = name.trim();
  const stripped = base
    .replace(/\s+(A\.Ş\.|A\.S\.|Ltd\.?\s*Şti\.?|San\.?\s*Tic\.?)/gi, "")
    .trim();
  const words = stripped.split(/\s+/).filter((w) => w.length > 2);
  return [base, stripped, words.slice(0, 3).join(" "), words.slice(0, 2).join(" ")].filter(
    (v, i, arr) => v.length >= 4 && arr.indexOf(v) === i
  );
}

function findPosition(text: string, needle: string): number {
  const lower = text.toLowerCase();
  const n = needle.toLowerCase();
  return lower.indexOf(n);
}

function findCompanyStart(text: string, company: Company): { index: number; score: number } | null {
  let bestIndex = -1;
  let bestScore = 0;

  const domain = getDomain(company.website);
  if (domain) {
    const idx = findPosition(text, domain);
    if (idx >= 0) return { index: idx, score: 1 };
  }

  for (const variant of nameVariants(company.name)) {
    const idx = findPosition(text, variant);
    if (idx >= 0) {
      const score = wordOverlap(normalize(variant), normalize(company.name));
      if (score > bestScore) {
        bestScore = score;
        bestIndex = idx;
      }
    }
  }

  if (bestIndex >= 0 && bestScore >= 0.4) {
    return { index: bestIndex, score: bestScore };
  }
  return null;
}

export function matchCompanyByFilename(
  filename: string,
  companies: Company[]
): Company | null {
  const parsed = parseCompanyNameFromFilename(filename);
  return findBestCompanyMatch(parsed, companies)?.company ?? findBestCompanyMatch(normalize(filename), companies)?.company ?? null;
}

export function matchCompanyFromPdfText(
  text: string,
  companies: Company[]
): Company | null {
  const patterns = [
    /firma\s*:\s*(.+)/i,
    /company\s*:\s*(.+)/i,
    /denetlenen\s*firma\s*:\s*(.+)/i,
    /(?:^|\n)\s*(\d+\.\s*)?([A-ZÇĞİÖŞÜ][^\n]{4,60}(?:A\.Ş|Ltd|San|Tic)[^\n]*)/m,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (!match) continue;
    const raw = (match[2] ?? match[1]).split("\n")[0].trim();
    const hit = findBestCompanyMatch(raw, companies);
    if (hit) return hit.company;
  }

  // PDF içinde geçen anahtar kelime ile eşleştir (ör. BOSCH)
  for (const company of companies) {
    const keyword = normalize(company.name).split(" ")[0];
    if (keyword.length >= 4 && normalize(text).includes(keyword)) {
      return company;
    }
  }

  return null;
}

/** Toplu rapor PDF'sini (50 firma vb.) CRM'deki firmalarla eşleştirir */
export function parseBulkAuditPdf(
  text: string,
  companies: Company[]
): ParsedCompanyReport[] {
  type Marker = { index: number; company: Company; score: number };
  const markers: Marker[] = [];

  for (const company of companies) {
    const found = findCompanyStart(text, company);
    if (found) {
      markers.push({ index: found.index, company, score: found.score });
    }
  }

  if (markers.length === 0) return [];

  markers.sort((a, b) => a.index - b.index);

  const used = new Set<string>();
  const unique: Marker[] = [];
  for (const m of markers) {
    if (used.has(m.company.id)) continue;
    used.add(m.company.id);
    unique.push(m);
  }

  const reports: ParsedCompanyReport[] = [];

  for (let i = 0; i < unique.length; i++) {
    const { company, index, score } = unique[i];
    const end = i + 1 < unique.length ? unique[i + 1].index : text.length;
    const section = text.slice(index, end).trim();
    if (section.length < 30) continue;

    const { findings, impact } = parseAuditSections(section);
    reports.push({
      detectedName: company.name,
      companyId: company.id,
      website: company.website,
      text: section,
      findings: findings || section,
      impact,
      matchScore: score,
    });
  }

  return reports.sort((a, b) => b.matchScore - a.matchScore);
}

export function parseAuditSections(text: string): {
  findings: string;
  impact: string | null;
} {
  const markers = [
    /iş\s*etkisi\s*:?/i,
    /is\s*etkisi\s*:?/i,
    /business\s*impact\s*:?/i,
    /önerilen\s*paket/i,
  ];

  let splitIndex = -1;
  for (const marker of markers) {
    const match = text.match(marker);
    if (match?.index !== undefined) {
      splitIndex = match.index;
      break;
    }
  }

  if (splitIndex > 0) {
    const findings = text.slice(0, splitIndex).trim();
    const impactBlock = text.slice(splitIndex).trim();
    const impactMatch = impactBlock.match(
      /(?:iş\s*etkisi|is\s*etkisi|business\s*impact)\s*:?\s*([\s\S]*?)(?=önerilen\s*paket|$)/i
    );
    return {
      findings,
      impact: impactMatch?.[1]?.trim() || impactBlock || null,
    };
  }

  return { findings: text.trim(), impact: null };
}

export type ExtractedCompany = {
  member_no: string | null;
  name: string;
  sector: string | null;
  website: string | null;
  email: string | null;
  phone: string | null;
  source: string | null;
  findings: string | null;
  impact: string | null;
  rawText: string;
};

function flattenPdfText(text: string): string {
  return text.replace(/\r\n/g, " ").replace(/\s+/g, " ").trim();
}

const BOSB_SECTORS = [
  "OTOMOTİV VE OTOMOTİV YAN SANAYİ",
  "PLASTİK KAUÇUK",
  "METAL SANAYİ",
  "MAKİNA",
  "TEKSTİL",
  "AMBALAJ",
  "KİMYA",
  "LOJİSTİK",
  "DİĞER",
  "İNŞAAT",
  "GIDA",
  "GIDA SANAYİ",
  "ENERJİ",
  "ELEKTRİK",
  "MOBİLYA",
  "TURİZM",
  "LOJİSTİK",
].sort((a, b) => b.length - a.length);

function normalizeWebsite(raw: string | null): string | null {
  if (!raw || raw === "-") return null;
  const cleaned = raw.replace(/\s+/g, "");
  if (!cleaned) return null;
  if (/^https?:\/\//i.test(cleaned)) return cleaned;
  if (/^www\./i.test(cleaned)) return `https://${cleaned}`;
  if (cleaned.includes(".")) return `https://${cleaned}`;
  return null;
}

/** Genua tablo satırı: No | Firma Adı | Sektör | Telefon | E-posta | Web Sitesi */
function parseGenuaTableRow(content: string): {
  name: string;
  sector: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
} {
  let rest = content.trim();

  // Web Sitesi (sonda)
  let website: string | null = null;
  const webMatch = rest.match(/\s+(www\.[\w.-]+(?:\s+[\w.-]+)?)\s*$/i);
  if (webMatch) {
    website = normalizeWebsite(webMatch[1]);
    rest = rest.slice(0, webMatch.index).trim();
  } else if (/\s+-\s*$/.test(rest)) {
    rest = rest.replace(/\s+-\s*$/, "").trim();
  } else {
    const bareDomain = rest.match(/\s+([\w.-]+\.(?:com|com\.tr|eu|net|org)(?:\.tr)?)\s*$/i);
    if (bareDomain) {
      website = normalizeWebsite(bareDomain[1]);
      rest = rest.slice(0, bareDomain.index).trim();
    }
  }

  // E-posta
  let email: string | null = null;
  const emailMatch = rest.match(/([\w.+-]+@[\w.-]+\.\w{2,})/);
  if (emailMatch) {
    email = emailMatch[1];
    rest = rest.replace(emailMatch[0], "").trim();
  } else if (/\s+-\s/.test(rest) || /\s+-\s*$/.test(rest)) {
    rest = rest.replace(/\s+-\s*$/, "").replace(/\s+-\s+/, " ").trim();
  }

  // Telefon: 0224 294 77 00 | 0902 244 11 08 | 0216 458 55 55
  let phone: string | null = null;
  const phoneMatch = rest.match(/((?:0\d{3}|0902)\s+\d{3}\s+\d{2}\s+\d{2})\s*$/);
  if (phoneMatch) {
    phone = phoneMatch[1].trim();
    rest = rest.slice(0, phoneMatch.index).trim();
  }

  // Sektör (sondan bilinen anahtar kelimeler)
  let sector: string | null = null;
  for (const s of BOSB_SECTORS) {
    const re = new RegExp(`\\s+(${s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})\\s*$`, "i");
    const m = rest.match(re);
    if (m) {
      sector = m[1].toUpperCase();
      rest = rest.slice(0, m.index).trim();
      break;
    }
  }

  const name = rest.trim();
  return { name, sector, phone, email, website };
}

/** BOSB/Genua tablo PDF — 50/400 firma listesi */
export function extractMemberListRows(text: string): ExtractedCompany[] {
  const flat = flattenPdfText(text);
  const source = extractSource(text) ?? "BOSB";

  // Satırlar: 822 BOSCH... | 1187 BAYKAL... (3-4 haneli OSB no)
  const segments = flat.split(/\s(?=\d{3,4}\s+(?=[A-ZÇĞİÖŞÜİ]))/);
  const rows: ExtractedCompany[] = [];
  const seen = new Set<string>();

  for (const seg of segments) {
    const m = seg.match(/^(\d{3,4})\s+(.*)$/);
    if (!m) continue;

    const memberNo = m[1];
    const num = parseInt(memberNo, 10);
    // OSB üye no: 100-9999 arası; telefon parçası değil
    if (num < 100 || num > 9999) continue;

    const parsed = parseGenuaTableRow(m[2]);
    if (parsed.name.length < 5) continue;
    if (/^(no|firma|sekt|telefon|e-posta|web|genua|bosb|sayfa|rapor)/i.test(parsed.name)) continue;

    const key = normalize(parsed.name);
    if (seen.has(key)) continue;
    seen.add(key);

    rows.push({
      member_no: memberNo,
      name: parsed.name,
      sector: parsed.sector,
      website: parsed.website,
      email: parsed.email,
      phone: parsed.phone,
      source,
      findings: null,
      impact: null,
      rawText: seg.trim(),
    });
  }

  return rows;
}

/** BOSB üye listesi / firma tablosu PDF'si mi? */
export function isMemberListDocument(text: string, filename: string): boolean {
  const f = filename.toLowerCase();
  const t = text.toLowerCase();
  if (/en.?buyuk|uye.?firmalar|firma.?listesi|_liste|member.?list|firma.?raporu|bosb.*firma/i.test(f)) return true;
  if (/web\s*sitesi/.test(t) && /firma\s*ad/.test(t)) return true;
  if (/toplam\s*firma\s*say/.test(t)) return true;
  if (/firma\s*ad[ıi]/.test(t) && /sekt[öo]r/.test(t)) return true;
  if (/\bno\s+firma\s+ad/i.test(t)) return true;
  const rowHits = (text.match(/\s\d{3,4}\s+[A-ZÇĞİÖŞÜİ]/g) ?? []).length;
  return rowHits >= 5;
}

function extractWebsite(text: string): string | null {
  const http = text.match(/https?:\/\/[^\s,)]+/i);
  if (http) return http[0].replace(/[.,;]+$/, "");
  const www = text.match(/www\.[\w.-]+/i);
  if (www) return normalizeWebsite(www[0]);
  return null;
}

function extractEmail(text: string): string | null {
  const match = text.match(/[\w.+-]+@[\w.-]+\.\w{2,}/);
  return match ? match[0] : null;
}

function extractPhone(text: string): string | null {
  const match = text.match(/(?:\+90|0)\s*[\d\s().-]{10,}/);
  return match ? match[0].trim() : null;
}

function extractSource(text: string): string | null {
  if (/\bBOSB\b/i.test(text)) return "BOSB";
  if (/\bDOSB\b/i.test(text)) return "DOSB";
  return null;
}

function extractNameFromText(text: string): string | null {
  const patterns = [
    /firma\s*:\s*(.+)/i,
    /denetlenen\s*firma\s*:\s*(.+)/i,
    /company\s*:\s*(.+)/i,
    /(?:^|\n)\s*\d+\.\s*([^\n]{4,80}(?:A\.Ş|A\.S|Ltd|Şti|San|Tic)[^\n]*)/im,
  ];
  for (const p of patterns) {
    const m = text.match(p);
    if (m?.[1]) return m[1].split("\n")[0].trim();
  }
  return null;
}

function parseCompanyBlock(block: string, fallbackName?: string): ExtractedCompany | null {
  const name = cleanCompanyName(extractNameFromText(block) ?? fallbackName);
  if (!name || name.length < 3) return null;
  const { findings, impact } = parseAuditSections(block);
  return {
    member_no: null,
    name,
    sector: null,
    website: extractWebsite(block),
    email: extractEmail(block),
    phone: extractPhone(block),
    source: extractSource(block),
    findings: findings || block.trim(),
    impact,
    rawText: block.trim(),
  };
}

function cleanCompanyName(name: string | null | undefined): string | null {
  if (!name) return null;
  return name
    .replace(/^(?:firma|denetlenen\s+firma|company)\s*:?\s*/i, "")
    .replace(/\s*(?:web\s*sitesi|website|url)\s*:?\s*.*$/i, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

const COMPANY_SUFFIX =
  /(?:A\.?\s*Ş\.?|A\.?\s*S\.?|Ltd\.?\s*Şti\.?|Limited|San\.?\s*Tic\.?|Sanayi\s+ve\s+Ticaret|Sanayi|Ticaret)/i;

type TextMarker = { index: number; name: string };

function collectNumberedMarkers(text: string): TextMarker[] {
  const markers: TextMarker[] = [];
  const patterns = [
    /(?:^|\n|\s)(\d{1,3})\s*[\.\)]\s*([A-ZÇĞİÖŞÜ][^\n]{4,120}?(?:A\.?\s*Ş\.?|Ltd\.?\s*Şti\.?|San\.?\s*Tic\.?|Sanayi|Ticaret)[^\n]{0,40})/gi,
    /(?:^|\n)\s*(\d{1,3})\s*[-–:]\s*([A-ZÇĞİÖŞÜ][^\n]{4,120}?(?:A\.?\s*Ş\.?|Ltd\.?\s*Şti\.?|San\.?\s*Tic\.?)[^\n]{0,40})/gi,
  ];

  for (const re of patterns) {
    let m: RegExpExecArray | null;
    while ((m = re.exec(text)) !== null) {
      const name = cleanCompanyName(m[2]);
      if (name && name.length >= 4) {
        markers.push({ index: m.index + m[0].indexOf(m[2]), name });
      }
    }
  }

  return markers;
}

function collectFirmaMarkers(text: string): TextMarker[] {
  const markers: TextMarker[] = [];
  const re =
    /(?:^|\n)\s*(?:\d{1,3}\s*[\.\)]\s*)?(?:Firma|FİRMA|Denetlenen\s+Firma|Company)\s*:?\s*([^\n]{4,120})/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    const name = cleanCompanyName(m[1]);
    if (name && name.length >= 4 && COMPANY_SUFFIX.test(name)) {
      markers.push({ index: m.index, name });
    }
  }
  return markers;
}

function dedupeMarkers(markers: TextMarker[]): TextMarker[] {
  const sorted = [...markers].sort((a, b) => a.index - b.index);
  const out: TextMarker[] = [];
  for (const m of sorted) {
    if (out.some((o) => Math.abs(o.index - m.index) < 15)) continue;
    out.push(m);
  }
  return out;
}

function blocksFromMarkers(text: string, markers: TextMarker[]): ExtractedCompany[] {
  const results: ExtractedCompany[] = [];
  for (let i = 0; i < markers.length; i++) {
    const start = markers[i].index;
    const end = i + 1 < markers.length ? markers[i + 1].index : text.length;
    const block = text.slice(start, end).trim();
    if (block.length < 25) continue;
    const parsed = parseCompanyBlock(block, markers[i].name);
    if (parsed) results.push(parsed);
  }
  return results;
}

function tryBulkExtraction(text: string): ExtractedCompany[] {
  const strategies = [
    () => blocksFromMarkers(text, dedupeMarkers(collectFirmaMarkers(text))),
    () => blocksFromMarkers(text, dedupeMarkers(collectNumberedMarkers(text))),
  ];

  let best: ExtractedCompany[] = [];
  for (const run of strategies) {
    const results = run();
    if (results.length > best.length) best = results;
  }
  return best;
}

/** PDF metninden firmaları çıkar — tablo listesi, denetim raporu veya tek firma */
export function extractCompaniesFromPdf(text: string, filename: string): ExtractedCompany[] {
  const cleaned = text.replace(/\r\n/g, "\n").trim();

  // 1) BOSB/DOSB üye firma tablosu (400 firma vb.)
  if (isMemberListDocument(cleaned, filename)) {
    const listRows = extractMemberListRows(cleaned);
    if (listRows.length >= 2) return listRows;
  }

  // 2) Denetim raporu — numaralı / Firma: blokları
  const bulk = tryBulkExtraction(cleaned);
  if (bulk.length >= 2) return bulk;

  const firmaParts = cleaned.split(/(?=(?:^|\s)(?:\d{1,3}\s*[\.\)]\s*)?(?:Firma|FİRMA)\s*:)/i).filter((p) => p.trim().length > 40);
  if (firmaParts.length >= 2) {
    const results = firmaParts
      .map((p) => parseCompanyBlock(p))
      .filter((c): c is ExtractedCompany => c !== null);
    if (results.length >= 2) return results;
  }

  const numbered = Array.from(
    cleaned.matchAll(
      /(?:^|\n|\s)(\d{1,3})\s*[\.\)]\s*([^\n]{5,120}?(?:A\.?\s*Ş\.?|Ltd\.?\s*Şti\.?|San\.?\s*Tic\.?|Sanayi|Ticaret)[^\n]{0,40})/gi
    )
  );
  if (numbered.length >= 2) {
    const results: ExtractedCompany[] = [];
    for (let i = 0; i < numbered.length; i++) {
      const start = numbered[i].index ?? 0;
      const end = i + 1 < numbered.length ? (numbered[i + 1].index ?? cleaned.length) : cleaned.length;
      const block = cleaned.slice(start, end);
      const parsed = parseCompanyBlock(block, numbered[i][2].trim());
      if (parsed) results.push(parsed);
    }
    if (results.length >= 2) return results;
  }

  // Liste belgesi ama parse edilemedi — tek kayıt oluşturma
  if (isMemberListDocument(cleaned, filename)) {
    return [];
  }

  // 3) Tek firma denetim raporu
  const singleName =
    cleanCompanyName(extractNameFromText(cleaned)) ?? parseCompanyNameFromFilename(filename);
  const { findings, impact } = parseAuditSections(cleaned);
  return [
    {
      member_no: null,
      name: singleName,
      sector: null,
      website: extractWebsite(cleaned),
      email: extractEmail(cleaned),
      phone: extractPhone(cleaned),
      source: extractSource(cleaned) ?? "BOSB",
      findings: findings || cleaned,
      impact,
      rawText: cleaned,
    },
  ];
}

export function guessAuditStatus(text: string): Company["audit_status"] {
  const lower = text.toLowerCase();
  if (lower.includes("website yok") || lower.includes("web sitesi bulunmuyor")) {
    return "website_yok";
  }
  if (
    lower.includes("kritik") ||
    (lower.includes("ssl") && lower.includes("dolmuş")) ||
    lower.includes("erişilemiyor")
  ) {
    return "kritik";
  }
  if (lower.includes("iyi durumda") || lower.includes("genel olarak iyi")) {
    return "iyi";
  }
  if (lower.includes("orta") || lower.includes("iyileştirme")) {
    return "orta";
  }
  return "bilinmiyor";
}
