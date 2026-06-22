import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import * as cheerio from "cheerio";
import { XMLParser } from "fast-xml-parser";
import type {
  DealCategory,
  RadarData,
  SourceDefinition,
  SourceRun,
  TravelItem,
  TravelScope,
} from "../src/types";

const rootDir = process.cwd();
const catalogPath = path.join(rootDir, "src/data/source-catalog.json");
const outputPath = path.join(rootDir, "src/data/radar-data.json");
const publicOutputPath = path.join(rootDir, "public/radar-data.json");
const timezone = "Europe/Berlin";
const homeBase = "Berlin";

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  trimValues: true,
  cdataPropName: "#cdata",
});

const euroPattern =
  /(?:ab\s*)?(\d{1,3}(?:[.\s]\d{3})*(?:,\d{2})?|\d{2,5})(?:\s*)(?:€|EUR|Euro)/i;

const berlinDepartureTerms = [
  "ab berlin",
  "from berlin",
  "berlin ber",
  "ber airport",
  "flüge ab berlin",
  "flug ab berlin",
  "berlin brandenburg",
  "berlin",
];

const nearbyTerms = [
  "brandenburg",
  "potsdam",
  "spreewald",
  "ostsee",
  "mecklenburg",
  "sachsen",
  "harz",
  "hamburg",
  "polnische ostsee",
  "dänemark",
  "denmark",
  "poland",
  "polen",
];

const germanyTerms = [
  "deutschland",
  "germany",
  "köln",
  "hamburg",
  "münchen",
  "munich",
  "düsseldorf",
  "frankfurt",
  "nürnberg",
  "leipzig",
  "dresden",
];

const sunResortTerms = [
  "türkei",
  "turkey",
  "ägypten",
  "egypt",
  "mallorca",
  "menorca",
  "rhodos",
  "kreta",
  "griechenland",
  "greece",
  "kanaren",
  "teneriffa",
  "fuerteventura",
  "side",
  "antalya",
  "hurghada",
  "all inclusive",
  "all-inclusive",
];

const europeTerms = [
  "italien",
  "italy",
  "spanien",
  "spain",
  "frankreich",
  "france",
  "portugal",
  "österreich",
  "austria",
  "niederlande",
  "netherlands",
  "belgien",
  "belgium",
  "dänemark",
  "denmark",
  "polen",
  "poland",
  "budapest",
  "london",
  "paris",
  "amsterdam",
  "prag",
];

function arrayify<T>(value: T | T[] | undefined): T[] {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

function compactText(value: unknown): string {
  if (!value) return "";
  if (typeof value === "string") return value.replace(/\s+/g, " ").trim();
  if (typeof value === "object" && "#cdata" in value) {
    return compactText((value as Record<string, unknown>)["#cdata"]);
  }
  return String(value).replace(/\s+/g, " ").trim();
}

function htmlToText(html: string): string {
  return cheerio.load(html).text().replace(/\s+/g, " ").trim();
}

function absoluteUrl(url: string | undefined, base: string): string | undefined {
  if (!url) return undefined;
  try {
    return new URL(url, base).toString();
  } catch {
    return undefined;
  }
}

async function fetchText(url: string): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        "user-agent":
          "Mozilla/5.0 (compatible; BerlinFamilyTravelRadar/0.1; +https://github.com/AlexChenIC/germany-deal-travel)",
        accept:
          "application/rss+xml, application/xml, text/xml, text/html;q=0.9, */*;q=0.8",
      },
    });
    if (!response.ok) {
      throw new Error(`${response.status} ${response.statusText}`);
    }
    return response.text();
  } finally {
    clearTimeout(timeout);
  }
}

function firstDefined(...values: unknown[]): string | undefined {
  for (const value of values) {
    const text = compactText(value);
    if (text) return text;
  }
  return undefined;
}

function getFeedItems(xml: string): Record<string, unknown>[] {
  const parsed = parser.parse(xml) as Record<string, unknown>;
  const rss = parsed.rss as Record<string, unknown> | undefined;
  const channel = rss?.channel as Record<string, unknown> | undefined;
  return arrayify(channel?.item as Record<string, unknown> | Record<string, unknown>[]);
}

function sourceCategory(source: SourceDefinition): DealCategory | undefined {
  if (source.focus.includes("berlin-events")) return "event";
  return undefined;
}

function normalizeRssItem(
  item: Record<string, unknown>,
  source: SourceDefinition,
): TravelItem | undefined {
  const title = firstDefined(item.title);
  const url = firstDefined(item.link, item.guid);
  if (!title || !url) return undefined;

  const rawDescription = firstDefined(
    item["content:encoded"],
    item.description,
  );
  const summary = htmlToText(rawDescription ?? "").slice(0, 460);
  const categoryValues = arrayify(item.category as unknown).map((entry) =>
    compactText(entry),
  );
  const text = `${title} ${summary} ${categoryValues.join(" ")}`;
  const imageUrl = extractRssImage(item, source.homepage);
  const price = extractPrice(text, item);
  const category = sourceCategory(source) ?? classifyCategory(text);
  const scope = classifyScope(text, category);
  const fromBerlin = isFromBerlin(text, category);
  const family = scoreFamilyFit(text, category, scope);
  const durationDays = extractDurationDays(text);
  const tags = buildTags(text, category, scope, source, family.signals);

  return {
    id: createId(source.id, url, title),
    sourceId: source.id,
    sourceName: source.name,
    title,
    url,
    summary,
    publishedAt: normalizeDate(firstDefined(item.pubDate)),
    imageUrl,
    category,
    scope,
    tags,
    priceLabel: price.label,
    priceValue: price.value,
    durationDays,
    departureHint: departureHint(text),
    locationHint: locationHint(text, category, scope),
    familyScore: family.score,
    familySignals: family.signals,
    fromBerlin,
    priorityScore: priorityScore({
      category,
      scope,
      fromBerlin,
      familyScore: family.score,
      priceValue: price.value,
      publishedAt: normalizeDate(firstDefined(item.pubDate)),
      source,
    }),
  };
}

function extractRssImage(
  item: Record<string, unknown>,
  baseUrl: string,
): string | undefined {
  const enclosure = item.enclosure as Record<string, unknown> | undefined;
  const mediaContent = item["media:content"] as Record<string, unknown> | undefined;
  const mediaThumbnail = item["media:thumbnail"] as
    | Record<string, unknown>
    | undefined;
  const rawDescription = firstDefined(item["content:encoded"], item.description);
  const htmlImage = rawDescription
    ? cheerio.load(rawDescription)("img").first().attr("src")
    : undefined;

  return absoluteUrl(
    firstDefined(
      enclosure?.["@_url"],
      mediaContent?.["@_url"],
      mediaThumbnail?.["@_url"],
      htmlImage,
    ),
    baseUrl,
  );
}

async function scrapeVisitBerlin(source: SourceDefinition): Promise<TravelItem[]> {
  if (!source.url) return [];
  const html = await fetchText(source.url);
  const $ = cheerio.load(html);
  const items: TravelItem[] = [];

  $("article.teaser-search--event").each((_, element) => {
    const card = $(element);
    const title = card.find(".teaser-search__heading").first().text().trim();
    const link = absoluteUrl(
      card.find(".teaser-search__mainlink").first().attr("href"),
      source.homepage,
    );
    if (!title || !link) return;

    const summary = card
      .find(".teaser-search__text")
      .first()
      .text()
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 460);
    const publishedAt = card.find("time").first().attr("datetime");
    const categoryLabel = card.find(".category-label").first().text().trim();
    const location = card
      .find(".teaser-search__location .nopr")
      .first()
      .text()
      .replace(/\s+/g, " ")
      .trim();
    const imageUrl = absoluteUrl(
      card.find("img.teaser-search__img").first().attr("src"),
      source.homepage,
    );
    const text = `${title} ${summary} ${categoryLabel} ${location}`;
    const family = scoreFamilyFit(text, "event", "berlin-city");

    items.push({
      id: createId(source.id, link, title),
      sourceId: source.id,
      sourceName: source.name,
      title,
      url: link,
      summary,
      publishedAt: normalizeDate(publishedAt),
      imageUrl,
      category: "event",
      scope: "berlin-city",
      tags: buildTags(text, "event", "berlin-city", source, family.signals),
      locationHint: location || "Berlin",
      familyScore: family.score,
      familySignals: family.signals,
      fromBerlin: true,
      priorityScore: priorityScore({
        category: "event",
        scope: "berlin-city",
        fromBerlin: true,
        familyScore: family.score,
        publishedAt: normalizeDate(publishedAt),
        source,
      }),
    });
  });

  return items.slice(0, 36);
}

async function fetchSource(
  source: SourceDefinition,
): Promise<{ run: SourceRun; items: TravelItem[] }> {
  const fetchedAt = new Date().toISOString();

  if (!source.enabled || source.status !== "active") {
    return {
      run: {
        id: source.id,
        name: source.name,
        status: "skipped",
        itemCount: 0,
        message: source.notes,
        fetchedAt,
      },
      items: [],
    };
  }

  try {
    let items: TravelItem[] = [];
    if (source.kind === "rss" && source.url) {
      const xml = await fetchText(source.url);
      items = getFeedItems(xml)
        .map((item) => normalizeRssItem(item, source))
        .filter((item): item is TravelItem => Boolean(item));
    } else if (source.id === "visitberlin-events") {
      items = await scrapeVisitBerlin(source);
    }

    return {
      run: {
        id: source.id,
        name: source.name,
        status: "ok",
        itemCount: items.length,
        fetchedAt,
      },
      items,
    };
  } catch (error) {
    return {
      run: {
        id: source.id,
        name: source.name,
        status: "error",
        itemCount: 0,
        message: error instanceof Error ? error.message : String(error),
        fetchedAt,
      },
      items: [],
    };
  }
}

function classifyCategory(text: string): DealCategory {
  const lower = text.toLowerCase();
  if (matchesAny(lower, ["kreuzfahrt", "cruise", "aida", "msc", "mein schiff"])) {
    return "cruise";
  }
  if (matchesAny(lower, ["all inclusive", "all-inclusive", "vollpension"])) {
    return "all-inclusive";
  }
  if (matchesAny(lower, ["pauschalreise", "inkl. flug", "flug &", "transfer"])) {
    return "package";
  }
  if (matchesAny(lower, ["flug", "flüge", "flight", "airline", "roundtrip"])) {
    return "flight";
  }
  if (
    matchesAny(lower, [
      "hotel",
      "resort",
      "ferienwohnung",
      "apartment",
      "therme",
      "wellness",
      "center parcs",
    ])
  ) {
    return "hotel-resort";
  }
  if (matchesAny(lower, ["ticket", "festival", "event", "museum", "show"])) {
    return "event";
  }
  return "planning";
}

function classifyScope(text: string, category: DealCategory): TravelScope {
  const lower = text.toLowerCase();
  if (category === "event") return "berlin-city";
  if (matchesAny(lower, ["berlin city", "citytrip berlin", "csd nach berlin"])) {
    return "berlin-city";
  }
  if (matchesAny(lower, nearbyTerms)) return "berlin-nearby";
  if (matchesAny(lower, germanyTerms)) return "germany";
  if (matchesAny(lower, sunResortTerms)) return "sun-resort";
  if (matchesAny(lower, europeTerms)) return "europe";
  return "long-haul";
}

function isFromBerlin(text: string, category: DealCategory): boolean {
  const lower = text.toLowerCase();
  if (category === "event") return true;
  return matchesAny(lower, berlinDepartureTerms);
}

function matchesAny(text: string, terms: string[]): boolean {
  return terms.some((term) => text.includes(term.toLowerCase()));
}

function extractPrice(
  text: string,
  item: Record<string, unknown>,
): { label?: string; value?: number } {
  const pepperMerchant = item["pepper:merchant"] as
    | Record<string, unknown>
    | undefined;
  const merchantPrice = firstDefined(pepperMerchant?.["@_price"]);
  const match = merchantPrice ? merchantPrice.match(euroPattern) : text.match(euroPattern);
  if (!match) return {};
  const value = Number(match[1].replace(/[.\s]/g, "").replace(",", "."));
  if (Number.isNaN(value)) return { label: match[0] };
  return {
    label: match[0].replace(/\s+/g, " ").trim(),
    value,
  };
}

function extractDurationDays(text: string): number | undefined {
  const match = text.match(/(\d{1,2})\s*(nächte|nacht|tage|tag|nights|days)/i);
  if (!match) return undefined;
  return Number(match[1]);
}

function departureHint(text: string): string | undefined {
  const lower = text.toLowerCase();
  if (matchesAny(lower, ["ab berlin", "berlin ber", "flüge ab berlin"])) {
    return "ab Berlin/BER";
  }
  const match = text.match(
    /ab\s+(Berlin|Hamburg|Düsseldorf|Duesseldorf|Köln|Koeln|Frankfurt|München|Munich|Hannover|Leipzig|Nürnberg|Wien|Zürich)/i,
  );
  return match ? `ab ${match[1]}` : undefined;
}

function locationHint(
  text: string,
  category: DealCategory,
  scope: TravelScope,
): string | undefined {
  if (category === "event") return "Berlin";
  if (scope === "sun-resort") {
    const match = text.match(
      /(Türkei|Turkey|Ägypten|Egypt|Mallorca|Menorca|Rhodos|Kreta|Side|Antalya|Hurghada|Formentera|Korfu|Griechenland)/i,
    );
    return match?.[1];
  }
  if (scope === "berlin-nearby" || scope === "germany" || scope === "europe") {
    const match = text.match(
      /(Brandenburg|Potsdam|Spreewald|Ostsee|Hamburg|Köln|Frankreich|Portugal|Italien|Spanien|Österreich|Dänemark|Polen|Amsterdam|London|Budapest)/i,
    );
    return match?.[1];
  }
  return undefined;
}

function scoreFamilyFit(
  text: string,
  category: DealCategory,
  scope: TravelScope,
): { score: number; signals: string[] } {
  const lower = text.toLowerCase();
  let score = 48;
  const signals: string[] = [];

  const positive: Array<[string[], string, number]> = [
    [["familie", "family", "kinder", "kids", "kind"], "家庭/儿童相关", 18],
    [["babybett", "baby bed", "gitterbett"], "可关注婴儿床", 16],
    [["miniclub", "kinderclub", "spielplatz", "kinderpool"], "儿童设施", 16],
    [["strand", "beach", "pool", "wasserpark"], "水边/泳池", 8],
    [["transfer", "zug-zum-flug", "direktflug", "nonstop"], "交通省心", 8],
    [["all inclusive", "all-inclusive", "vollpension", "halbpension"], "餐食省心", 10],
    [["ferienwohnung", "apartment", "küche"], "空间/厨房友好", 8],
    [["weekend", "wochenende", "2 nächte", "3 tage"], "短途可控", 6],
    [["food festival", "festival", "park", "museum"], "城市活动", 4],
  ];

  const negative: Array<[string[], string, number]> = [
    [["adults-only", "adults only", "erwachsenenhotel"], "成人限定", -35],
    [["party", "club", "nightlife", "nachtclub"], "夜生活为主", -14],
    [["langstrecke", "long-haul", "japan", "singapur", "malaysia"], "长途负担", -10],
    [["nicht geeignet", "not suitable"], "需二次确认", -12],
  ];

  for (const [terms, label, value] of positive) {
    if (matchesAny(lower, terms)) {
      score += value;
      signals.push(label);
    }
  }

  for (const [terms, label, value] of negative) {
    if (matchesAny(lower, terms)) {
      score += value;
      signals.push(label);
    }
  }

  if (category === "event" && scope === "berlin-city") score += 8;
  if (scope === "berlin-nearby") score += 7;
  if (scope === "long-haul") score -= 8;

  return {
    score: Math.max(0, Math.min(100, score)),
    signals: Array.from(new Set(signals)).slice(0, 5),
  };
}

function buildTags(
  text: string,
  category: DealCategory,
  scope: TravelScope,
  source: SourceDefinition,
  familySignals: string[],
): string[] {
  const lower = text.toLowerCase();
  const tags = new Set<string>([categoryLabel(category), scopeLabel(scope)]);
  if (matchesAny(lower, ["last minute", "last-minute"])) tags.add("Last Minute");
  if (matchesAny(lower, ["gutschein", "code", "rabatt", "voucher"])) {
    tags.add("优惠码/折扣");
  }
  if (matchesAny(lower, ["wellness", "spa", "therme"])) tags.add("Spa/温泉");
  if (matchesAny(lower, ["strand", "beach", "meer"])) tags.add("海边");
  if (matchesAny(lower, ["berlin", "potsdam", "brandenburg"])) tags.add("近柏林");
  if (source.id.includes("berlin")) tags.add("柏林活动");
  familySignals.forEach((signal) => tags.add(signal));
  return Array.from(tags).slice(0, 8);
}

function categoryLabel(category: DealCategory): string {
  return {
    event: "活动",
    "hotel-resort": "酒店/度假村",
    package: "机酒套餐",
    flight: "机票",
    cruise: "邮轮",
    "all-inclusive": "全包",
    "day-trip": "一日游",
    planning: "灵感",
  }[category];
}

function scopeLabel(scope: TravelScope): string {
  return {
    "berlin-city": "柏林市内",
    "berlin-nearby": "柏林周边",
    germany: "德国",
    europe: "欧洲",
    "sun-resort": "阳光度假",
    "long-haul": "长线",
  }[scope];
}

function priorityScore(input: {
  category: DealCategory;
  scope: TravelScope;
  fromBerlin: boolean;
  familyScore: number;
  priceValue?: number;
  publishedAt?: string;
  source: SourceDefinition;
}): number {
  let score = input.familyScore;
  if (input.fromBerlin) score += 14;
  if (input.scope === "berlin-city") score += 14;
  if (input.scope === "berlin-nearby") score += 10;
  if (input.category === "all-inclusive" || input.category === "cruise") score += 7;
  if (input.source.quality === "high") score += 5;
  if (input.priceValue && input.priceValue < 250) score += 6;
  if (input.publishedAt) {
    const ageHours =
      (Date.now() - new Date(input.publishedAt).getTime()) / (1000 * 60 * 60);
    if (ageHours < 36) score += 10;
    else if (ageHours < 96) score += 5;
  }
  return Math.round(score);
}

function normalizeDate(value: string | undefined): string | undefined {
  if (!value) return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
}

function createId(sourceId: string, url: string, title: string): string {
  return `${sourceId}-${createHash("sha1")
    .update(`${url}${title}`)
    .digest("hex")
    .slice(0, 12)}`;
}

function dedupeItems(items: TravelItem[]): TravelItem[] {
  const byKey = new Map<string, TravelItem>();
  for (const item of items) {
    const normalizedTitle = item.title.toLowerCase().replace(/\W+/g, " ").trim();
    const key = item.url || normalizedTitle;
    const existing = byKey.get(key);
    if (!existing || item.priorityScore > existing.priorityScore) {
      byKey.set(key, item);
    }
  }
  return Array.from(byKey.values()).sort((a, b) => {
    if (b.priorityScore !== a.priorityScore) return b.priorityScore - a.priorityScore;
    return (
      new Date(b.publishedAt ?? 0).getTime() -
      new Date(a.publishedAt ?? 0).getTime()
    );
  });
}

function buildStats(items: TravelItem[], runs: SourceRun[]) {
  const byCategory: Record<string, number> = {};
  const byScope: Record<string, number> = {};

  for (const item of items) {
    byCategory[item.category] = (byCategory[item.category] ?? 0) + 1;
    byScope[item.scope] = (byScope[item.scope] ?? 0) + 1;
  }

  return {
    total: items.length,
    familyFriendly: items.filter((item) => item.familyScore >= 65).length,
    fromBerlin: items.filter((item) => item.fromBerlin).length,
    sourceErrors: runs.filter((run) => run.status === "error").length,
    byCategory,
    byScope,
  };
}

async function main() {
  const catalog = JSON.parse(await readFile(catalogPath, "utf8")) as SourceDefinition[];
  const results = await Promise.all(catalog.map((source) => fetchSource(source)));
  const runs = results.map((result) => result.run);
  const items = dedupeItems(results.flatMap((result) => result.items)).slice(0, 220);

  const data: RadarData = {
    generatedAt: new Date().toISOString(),
    timezone,
    homeBase,
    assumptions: [
      "一期以公开 RSS 和可读 HTML 为主，避免需要登录或绕过限制的信息源。",
      "家庭画像按 2 位成人、宝宝/幼儿、可带长辈同行来评分。",
      "价格、库存和日期会快速变化，点击源站前需要二次确认。",
    ],
    stats: buildStats(items, runs),
    sources: runs,
    items,
  };

  await mkdir(path.dirname(outputPath), { recursive: true });
  await mkdir(path.dirname(publicOutputPath), { recursive: true });
  const payload = `${JSON.stringify(data, null, 2)}\n`;
  await writeFile(outputPath, payload);
  await writeFile(publicOutputPath, payload);

  const okCount = runs.filter((run) => run.status === "ok").length;
  const errorCount = runs.filter((run) => run.status === "error").length;
  console.log(
    `Updated ${items.length} items from ${okCount} active sources (${errorCount} errors).`,
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
