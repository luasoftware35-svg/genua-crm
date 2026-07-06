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
