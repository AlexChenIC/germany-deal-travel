import type { TravelItem } from "../types";

export type DiscountFocusMode = "all" | "family" | "package" | "nearby";

export type DiscountStrength = "excellent" | "strong" | "watch";

export interface DiscountFocusItem {
  item: TravelItem;
  score: number;
  strength: DiscountStrength;
  discountPercent?: number;
  primarySignalZh: string;
  reasonsZh: string[];
  cautionZh?: string;
}

interface DiscountFocusOptions {
  excludedIds: ReadonlySet<string>;
  mode?: DiscountFocusMode;
  limit?: number;
}

const primarySourceIds = new Set([
  "urlaubspiraten",
  "mydealz-reisen",
  "travel-dealz",
  "urlaubstracker",
]);

const relevantDiscountTerms = [
  "40%",
  "45%",
  "50%",
  "60%",
  "70%",
  "80%",
  "rabatt",
  "sparen",
  "ersparnis",
  "preisvorteil",
  "mega-deal",
  "deal",
  "sale",
  "last minute",
  "gutschein",
  "coupon",
  "aktionscode",
  "voucher",
  "black week",
  "secret saver",
  "kostenlos stornierbar",
  "nur",
  "ab",
];

const familyTerms = [
  "family",
  "familie",
  "familienurlaub",
  "kind",
  "kinder",
  "baby",
  "kids",
  "kinderpool",
  "wasserpark",
  "apartment",
  "transfer",
  "frühstück",
  "halbpension",
  "all inclusive",
  "all-inclusive",
  "vollpension",
];

const packageTerms = [
  "pauschalreise",
  "pauschalreisen",
  "flug",
  "flüge",
  "flight",
  "hotel",
  "transfer",
  "all inclusive",
  "all-inclusive",
  "vollpension",
  "halbpension",
  "kanaren",
  "gran canaria",
  "teneriffa",
  "fuerteventura",
  "lanzarote",
  "türkei",
  "turkey",
  "ägypten",
  "egypt",
  "mallorca",
  "kreta",
  "griechenland",
];

const nearbyTerms = [
  "berlin",
  "brandenburg",
  "deutschland",
  "ostsee",
  "nordsee",
  "see",
  "lake",
  "therme",
  "spa",
  "wellness",
  "sauna",
  "pool",
  "tropical islands",
  "center parcs",
  "hotel",
  "resort",
];

const irrelevantTerms = [
  "kreditkarte",
  "credit card",
  "dkb",
  "amex",
  "paypal",
  "cashback",
  "uber",
  "gift card",
  "geschenkkarte",
  "guthaben",
  "duty free",
  "heinemann",
  "amazon",
  "sim card",
  "vpn",
  "lounge pass",
];

const babyRiskTerms = ["adults-only", "adult only", "erwachsenenhotel", "nur für erwachsene"];

export function buildDiscountFocusItems(
  items: TravelItem[],
  options: DiscountFocusOptions,
): DiscountFocusItem[] {
  const mode = options.mode ?? "all";

  return items
    .filter((item) => !options.excludedIds.has(item.id))
    .map(scoreDiscountItem)
    .filter((candidate) => candidate !== null)
    .filter((candidate) => matchesMode(candidate.item, mode))
    .sort((a, b) => b.score - a.score)
    .slice(0, options.limit ?? 12);
}

export function extractDiscountPercent(text: string): number | undefined {
  const normalized = text.replace(",", ".").toLowerCase();
  const matches = Array.from(normalized.matchAll(/(?:-|bis zu\s*)?(\d{1,2})\s?%/g))
    .map((match) => Number(match[1]))
    .filter((value) => Number.isFinite(value));

  const fractionMatches = Array.from(
    normalized.matchAll(/(?:1\s*nacht\s*geschenkt|4\s*nächte\s*(?:reisen\s*)?und\s*nur\s*3\s*nächte\s*zahl)/g),
  ).map(() => 25);

  const allMatches = [...matches, ...fractionMatches];
  if (allMatches.length === 0) return undefined;
  return Math.max(...allMatches);
}

export function isLikelyIrrelevantTravelDiscount(item: TravelItem): boolean {
  const text = itemContentText(item);
  const hasTripCore =
    item.category === "package" ||
    item.category === "all-inclusive" ||
    item.category === "hotel-resort" ||
    item.category === "cruise" ||
    containsAny(text, [
      "hotel",
      "reise",
      "urlaub",
      "pauschal",
      "flug",
      "ferien",
      "wellness",
      "spa",
      "therme",
      "resort",
      "cruise",
      "kreuzfahrt",
    ]);

  return containsAny(text, irrelevantTerms) && !hasTripCore;
}

function scoreDiscountItem(item: TravelItem): DiscountFocusItem | null {
  const text = itemText(item);
  if (isLikelyIrrelevantTravelDiscount(item)) return null;

  const discountPercent = extractDiscountPercent(text);
  const hasDiscountSignal =
    (discountPercent ?? 0) >= 25 || containsAny(text, relevantDiscountTerms);
  const hasCoreTravelSignal = isCoreTravelItem(item, text);
  const isPrimarySource = primarySourceIds.has(item.sourceId);
  const priceSignal = priceSignalScore(item, text);

  if (
    !hasCoreTravelSignal ||
    (!hasDiscountSignal && !isPrimarySource && priceSignal === 0)
  ) {
    return null;
  }

  let score =
    item.priorityScore * 0.6 +
    item.familyScore * 0.45 +
    sourceScore(item.sourceId) +
    priceSignal;

  if (discountPercent) score += discountPercent * 1.4;
  if ((discountPercent ?? 0) >= 40) score += 36;
  if ((discountPercent ?? 0) >= 50) score += 18;
  if (item.fromBerlin) score += 10;
  if (item.category === "all-inclusive") score += 18;
  if (item.category === "package") score += 12;
  if (item.category === "hotel-resort") score += 10;
  if (containsAny(text, familyTerms)) score += 12;
  if (containsAny(text, ["pool", "spa", "wellness", "sauna", "therme", "wasserpark"])) {
    score += 14;
  }
  if (containsAny(text, ["kanaren", "gran canaria", "teneriffa", "fuerteventura", "lanzarote"])) {
    score += 10;
  }
  if (containsAny(text, babyRiskTerms)) score -= 30;

  const reasonsZh = buildReasons(item, text, discountPercent);
  const strength = discountPercent
    ? discountPercent >= 50
      ? "excellent"
      : discountPercent >= 40
        ? "strong"
        : "watch"
    : score >= 150
      ? "strong"
      : "watch";

  return {
    item,
    score: Math.round(score),
    strength,
    discountPercent,
    primarySignalZh: primarySignal(discountPercent, item, text),
    reasonsZh,
    cautionZh: containsAny(text, babyRiskTerms)
      ? "疑似成人限定或不适合宝宝，务必二次核对。"
      : item.familyScore < 65
        ? "家庭适配分不高，先核对婴儿床、儿童设施、房型和交通。"
        : undefined,
  };
}

function buildReasons(
  item: TravelItem,
  text: string,
  discountPercent: number | undefined,
): string[] {
  const reasons = [
    discountPercent && discountPercent >= 40
      ? `明确出现 ${discountPercent}% 左右大折扣信号`
      : discountPercent
        ? `出现 ${discountPercent}% 折扣/省钱信号`
        : undefined,
    primarySourceIds.has(item.sourceId) ? "来自重点折扣信息源" : undefined,
    item.category === "all-inclusive" ? "全包，带宝宝时餐食和现场决策更省心" : undefined,
    item.category === "package" ? "机酒/套餐类，适合集中核对总价" : undefined,
    containsAny(text, ["transfer", "direktflug", "direct flight", "flug"])
      ? "包含航班/接送线索，适合柏林出发旅行核验"
      : undefined,
    containsAny(text, ["pool", "wasserpark", "spa", "wellness", "sauna", "therme"])
      ? "有泳池/水世界/SPA/桑拿线索"
      : undefined,
    containsAny(text, familyTerms) || item.familyScore >= 75
      ? "亲子/家庭适配信号较强"
      : undefined,
    item.priceLabel ? `价格线索：${item.priceLabel}` : undefined,
    item.fromBerlin ? "与柏林或德国出发相关" : undefined,
  ];

  return unique(reasons).slice(0, 5);
}

function primarySignal(
  discountPercent: number | undefined,
  item: TravelItem,
  text: string,
) {
  if (discountPercent && discountPercent >= 50) return "50%+ 大折扣优先核对";
  if (discountPercent && discountPercent >= 40) return "40%+ 大折扣";
  if (item.category === "all-inclusive") return "全包/套餐重点观察";
  if (containsAny(text, ["spa", "wellness", "therme", "pool", "wasserpark"])) {
    return "避暑/SPA/泳池线索";
  }
  if (item.priceLabel) return "价格异常或低价线索";
  return "折扣源高信号";
}

function matchesMode(item: TravelItem, mode: DiscountFocusMode) {
  if (mode === "all") return true;
  const text = itemText(item);
  if (mode === "family") return item.familyScore >= 65 || containsAny(text, familyTerms);
  if (mode === "package") {
    return (
      ["all-inclusive", "package", "flight", "cruise"].includes(item.category) ||
      containsAny(text, packageTerms)
    );
  }
  return (
    ["berlin-city", "berlin-nearby", "germany"].includes(item.scope) ||
    containsAny(text, nearbyTerms)
  );
}

function isCoreTravelItem(item: TravelItem, text: string) {
  if (item.category !== "planning") return true;
  return containsAny(text, [...packageTerms, ...nearbyTerms, "kreuzfahrt", "cruise"]);
}

function sourceScore(sourceId: string) {
  if (sourceId === "urlaubspiraten") return 24;
  if (sourceId === "mydealz-reisen") return 18;
  if (sourceId === "urlaubstracker") return 16;
  if (sourceId === "travel-dealz") return 14;
  return 8;
}

function priceSignalScore(item: TravelItem, text: string) {
  if (!item.priceValue) return 0;
  if (
    ["all-inclusive", "package"].includes(item.category) &&
    item.priceValue <= 650 &&
    containsAny(text, packageTerms)
  ) {
    return 26;
  }
  if (item.category === "hotel-resort" && item.priceValue <= 160) return 18;
  if (item.category === "cruise" && item.priceValue <= 900) return 16;
  if (item.category === "event" && item.priceValue <= 30) return 8;
  return 0;
}

function itemText(item: TravelItem) {
  return [
    item.title,
    item.titleZh,
    item.summary,
    item.tags.join(" "),
    item.priceLabel,
    item.departureHint,
    item.locationHint,
    item.sourceName,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function itemContentText(item: TravelItem) {
  return [
    item.title,
    item.titleZh,
    item.summary,
    item.tags.join(" "),
    item.priceLabel,
    item.departureHint,
    item.locationHint,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function containsAny(text: string, terms: string[]) {
  return terms.some((term) => text.includes(term));
}

function unique(values: Array<string | undefined>) {
  return [...new Set(values.filter((value): value is string => Boolean(value)))];
}
