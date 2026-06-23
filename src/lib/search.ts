export function normalizeSearchText(value: string) {
  return value
    .toLowerCase()
    .replace(/ß/g, "ss")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");
}

export function expandQuery(value: string) {
  const normalized = normalizeSearchText(value.trim());
  if (!normalized) return [];

  const aliases: Record<string, string[]> = {
    turkey: ["turkey", "turkei", "tuerkei", "side", "antalya"],
    egypt: ["egypt", "agypten", "aegypten", "hurghada"],
    cruise: ["cruise", "kreuzfahrt", "msc", "aida", "mein schiff"],
    baby: ["baby", "babybett", "gitterbett", "kinder"],
    family: ["family", "familie", "kinder", "kids"],
    "all inclusive": ["all inclusive", "all-inclusive", "vollpension"],
  };

  const terms = new Set([normalized]);
  for (const [key, values] of Object.entries(aliases)) {
    if (normalized.includes(key)) {
      values.forEach((alias) => terms.add(normalizeSearchText(alias)));
    }
  }
  return Array.from(terms);
}
