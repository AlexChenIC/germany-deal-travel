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
    "all inclusive": ["all inclusive", "all-inclusive", "全包"],
    "全包": ["all inclusive", "all-inclusive", "全包"],
    "全食宿": ["vollpension", "full board", "全食宿"],
    "加纳利": ["kanaren", "canary", "canarias", "加纳利"],
    "加那利": ["kanaren", "canary", "canarias", "加那利"],
    "兰萨罗特": ["lanzarote", "兰萨罗特"],
    "大加纳利": ["gran canaria", "大加纳利"],
    "特内里费": ["teneriffa", "tenerife", "特内里费"],
  };

  const terms = new Set([normalized]);
  for (const [key, values] of Object.entries(aliases)) {
    if (normalized === key || values.some((alias) => normalizeSearchText(alias) === normalized)) {
      values.forEach((alias) => terms.add(normalizeSearchText(alias)));
    }
  }
  return Array.from(terms);
}
