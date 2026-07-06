export function cityToSlug(city: string): string {
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

export function slugToCity(slug: string, cities: string[]): string | null {
  const normalized = slug.toLowerCase();
  return cities.find((c) => cityToSlug(c) === normalized) ?? null;
}

export const DEFAULT_CITY = "Bursa";

/** OSB kaynağı → şehir (SOSB = Sakarya, BOSB = Bursa) */
export const OSB_CITY_BY_SOURCE: Record<string, string> = {
  SOSB: "Sakarya",
  BOSB: "Bursa",
  DOSB: "Denizli",
};

export function inferSourceFromFilename(filename: string): string | null {
  const f = filename.toLowerCase();
  if (f.includes("sosb")) return "SOSB";
  if (f.includes("bosb")) return "BOSB";
  if (f.includes("dosb")) return "DOSB";
  return null;
}

export function inferCityFromImport(input: {
  source?: string | null;
  filename?: string;
  text?: string;
}): string {
  if (input.text) {
    if (/\bsakarya\b/i.test(input.text)) return "Sakarya";
    if (/\bbursa\b/i.test(input.text)) return "Bursa";
    if (/\bdenizli\b/i.test(input.text)) return "Denizli";
  }

  const source =
    input.source?.toUpperCase() ??
    (input.filename ? inferSourceFromFilename(input.filename) : null);

  if (source && OSB_CITY_BY_SOURCE[source]) {
    return OSB_CITY_BY_SOURCE[source];
  }

  return DEFAULT_CITY;
}
