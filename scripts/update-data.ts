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
  "lanzarote",
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
  const rawTitle = firstDefined(item.title);
  const title = rawTitle ? htmlToText(rawTitle) : undefined;
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
    titleZh: generateChineseTitle(title, {
      category,
      scope,
      priceLabel: price.label,
      durationDays,
      departureHint: departureHint(text),
      locationHint: locationHint(text, category, scope),
    }),
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
      titleZh: generateChineseTitle(title, {
        category: "event",
        scope: "berlin-city",
        locationHint: location || "Berlin",
      }),
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
  cachedItems: TravelItem[],
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
    const errorMessage = error instanceof Error ? error.message : String(error);
    if (cachedItems.length > 0) {
      return {
        run: {
          id: source.id,
          name: source.name,
          status: "ok",
          itemCount: cachedItems.length,
          message: `抓取失败，已回退到缓存：${errorMessage}`,
          usedCache: true,
          errorMessage,
          fetchedAt,
        },
        items: cachedItems.map(ensureChineseTitle),
      };
    }

    return {
      run: {
        id: source.id,
        name: source.name,
        status: "error",
        itemCount: 0,
        message: errorMessage,
        errorMessage,
        fetchedAt,
      },
      items: [],
    };
  }
}

function classifyCategory(text: string): DealCategory {
  const lower = text.toLowerCase();
  if (matchesAny(lower, ["csd", "festival", "events today", "weekend tips"])) {
    return "event";
  }
  if (matchesAny(lower, ["kreuzfahrt", "cruise", "aida", "msc", "mein schiff"])) {
    return "cruise";
  }
  if (matchesAny(lower, ["all inclusive", "all-inclusive", "vollpension"])) {
    return "all-inclusive";
  }
  if (matchesAny(lower, ["pauschalreise", "inkl. flug", "flug &", "transfer"])) {
    return "package";
  }
  if (matchesAny(lower, ["bahn", "zug", "rail", "interrail"])) {
    return "day-trip";
  }
  if (
    matchesAny(lower, [
      "hotel",
      "resort",
      "ferienwohnung",
      "ferienhaus",
      "übernachtung",
      "overnight",
      "apartment",
      "therme",
      "wellness",
      "center parcs",
    ])
  ) {
    return "hotel-resort";
  }
  if (
    matchesAny(lower, [
      "flug",
      "flüge",
      "flight",
      "airline",
      "roundtrip",
      "oneway",
      "gepäck",
      "eco",
      "condor",
      "ryanair",
      "norse atlantic",
    ])
  ) {
    return "flight";
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

async function readPreviousItems(): Promise<Map<string, TravelItem[]>> {
  try {
    const previous = JSON.parse(await readFile(outputPath, "utf8")) as RadarData;
    const itemsBySource = new Map<string, TravelItem[]>();
    for (const item of previous.items ?? []) {
      const bucket = itemsBySource.get(item.sourceId) ?? [];
      bucket.push(item);
      itemsBySource.set(item.sourceId, bucket);
    }
    return itemsBySource;
  } catch {
    return new Map();
  }
}

function extractDurationDays(text: string): number | undefined {
  const match = text.match(/(\d{1,2})\s*(nächte|nacht|tage|tag|nights|days)/i);
  if (!match) return undefined;
  return Number(match[1]);
}

function ensureChineseTitle(item: TravelItem): TravelItem {
  if (item.titleZh) return item;
  return {
    ...item,
    titleZh: generateChineseTitle(item.title, {
      category: item.category,
      scope: item.scope,
      priceLabel: item.priceLabel,
      durationDays: item.durationDays,
      departureHint: item.departureHint,
      locationHint: item.locationHint,
    }),
  };
}

function generateChineseTitle(
  title: string,
  context: {
    category: DealCategory;
    scope: TravelScope;
    priceLabel?: string;
    durationDays?: number;
    departureHint?: string;
    locationHint?: string;
  },
): string {
  const cleaned = title
    .replace(/[⭐🔥😍🤩😎🥳☀️🌴🏖️✈️🚅🟢❤️💖🌊🎉🏳️‍🌈✨💦🏝️🤫]/g, "")
    .replace(/\s+/g, " ")
    .trim();
  const translated = translateTravelTitle(cleaned);
  const prefixParts = [
    categoryLabel(context.category),
    scopeLabel(context.scope),
    context.locationHint && !translated.includes(context.locationHint)
      ? translateTravelTitle(context.locationHint)
      : undefined,
  ].filter(Boolean);
  const facts = [
    context.durationDays ? `${context.durationDays} 天/晚` : undefined,
    context.priceLabel ? `${formatChinesePrice(context.priceLabel)} 起` : undefined,
    context.departureHint ? context.departureHint : undefined,
  ].filter(Boolean);

  const prefix = prefixParts.length > 0 ? `${prefixParts.join(" · ")}｜` : "";
  const suffix = facts.length > 0 ? `（${facts.join("，")}）` : "";
  return `${prefix}${translated}${suffix}`.replace(/\s+/g, " ").trim();
}

function formatChinesePrice(priceLabel: string): string {
  return priceLabel.replace(/^ab\s+/i, "").trim();
}

function translateTravelTitle(title: string): string {
  let output = title;
  const replacements: Array<[RegExp, string]> = [
    [/&#038;|&amp;/gi, "&"],
    [/Zum CSD nach Berlin/gi, "去柏林参加 CSD"],
    [/Tierpark Hagenbeck/gi, "哈根贝克动物园"],
    [/Köpenick/gi, "克佩尼克"],
    [/Funchal/gi, "丰沙尔"],
    [/True Italian Pizza/gi, "真意大利披萨"],
    [/\bGut & günstig\b/gi, "又好又便宜"],
    [/\bPolnischen Ostsee\b/gi, "波兰波罗的海"],
    [/Ägypten/gi, "埃及"],
    [/Österreich/gi, "奥地利"],
    [/Düsseldorf/gi, "杜塞尔多夫"],
    [/München/gi, "慕尼黑"],
    [/Köln/gi, "科隆"],
    [/Zürich/gi, "苏黎世"],
    [/Übernachtung/gi, "住宿"],
    [/Luxuskreuzfahrt/gi, "豪华邮轮"],
    [/Málaga/gi, "马拉加"],
    [/Stockholm/gi, "斯德哥尔摩"],
    [/Lübeck/gi, "吕贝克"],
    [/Weissenhäuser Strand/gi, "魏森豪瑟海滩"],
    [/\bFlug\b/gi, "航班"],
    [/\bHoteltransfer\b/gi, "酒店接送"],
    [/\binklusive\b/gi, "含"],
    [/\binkl\./gi, "含"],
    [/\bDirect flights?\b/gi, "直飞航班"],
    [/\bmit der Bahn\b/gi, "坐火车"],
    [/\bvon Deutschland\b/gi, "从德国"],
    [/\bzusätzliche Rabatte\b/gi, "额外折扣"],
    [/\balle bis 26 Jahre\b/gi, "26 岁以下人群"],
    [/\bStrandurlaub\b/gi, "海滩度假"],
    [/\bmit Condor\b/gi, "乘 Condor"],
    [/\ban der\b/gi, "在"],
    [/\ban\b/gi, "在"],
    [/\bin\b/gi, "在"],
    [/\buvm\b/gi, "等"],
    [/\bAuszeit\b/gi, "小休假"],
    [/\bSummer\b/gi, "夏季"],
    [/\bWoche\b/gi, "周"],
    [/\bFlughäfen\b/gi, "机场"],
    [/\bTransfers\b/gi, "接送"],
    [/\bPremium\b/gi, "高级"],
    [/\bZum\b/gi, "去"],
    [/\bLanzarote\b/gi, "兰萨罗特"],
    [/\bWeekend Tips\b/gi, "周末推荐"],
    [/\bEvents Today\b/gi, "今日活动"],
    [/\bEvents Tomorrow\b/gi, "明日活动"],
    [/\bEvent calendar\b/gi, "活动日历"],
    [/\bFood and Dance Festival\b/gi, "美食与舞蹈节"],
    [/\bFood Festival\b/gi, "美食节"],
    [/\bStreet Festival\b/gi, "街头节"],
    [/\bSummer Festival\b/gi, "夏日节"],
    [/\bKosher Street\b/gi, "犹太洁食街头"],
    [/\bLatin\b/gi, "拉丁"],
    [/\bItalian\b/gi, "意大利"],
    [/\bGuided Tours?\b/gi, "导览"],
    [/\bExhibition(s)?\b/gi, "展览"],
    [/\bConcert(s)?\b/gi, "音乐会"],
    [/\bClassical Music\b/gi, "古典音乐"],
    [/\bCabaret\b/gi, "卡巴莱"],
    [/\bComedy\b/gi, "喜剧"],
    [/\bEducation\b/gi, "教育"],
    [/\bSports?\b/gi, "体育"],
    [/\bFestival\b/gi, "节庆"],
    [/\bMuseum\b/gi, "博物馆"],
    [/\bTheatre\b/gi, "剧院"],
    [/\bTickets?\b/gi, "门票"],
    [/\bLast Minute\b/gi, "临期特价"],
    [/\bAll[- ]Inclusive\b/gi, "全包"],
    [/\bInclusive\b/gi, "包含"],
    [/\bincluding\b/gi, "含"],
    [/\bincl\./gi, "含"],
    [/\bNonstopflüge\b/gi, "直飞航班"],
    [/\bDirektflüge\b/gi, "直飞航班"],
    [/\bFlights?\b/gi, "航班"],
    [/\bAirline(s)?\b/gi, "航空公司"],
    [/\bRückflug\b/gi, "返程航班"],
    [/\bHin- und Zurück\b/gi, "往返"],
    [/\bRoundtrip\b/gi, "往返"],
    [/\boneway\b/gi, "单程"],
    [/\bPremium Eco\b/gi, "高级经济舱"],
    [/\bEco\b/gi, "经济舱"],
    [/\bzzgl\. Gepäck\b/gi, "不含行李"],
    [/\bGepäck\b/gi, "行李"],
    [/\bBahn\b/gi, "火车"],
    [/\bZug\b/gi, "火车"],
    [/\bAirport\b/gi, "机场"],
    [/\bHotel\b/gi, "酒店"],
    [/\bHotels\b/gi, "酒店"],
    [/\bResort\b/gi, "度假村"],
    [/\bApartment\b/gi, "公寓"],
    [/\bFerienwohnung\b/gi, "度假公寓"],
    [/\bFerienhaus\b/gi, "度假屋"],
    [/\bBungalow\b/gi, "小屋"],
    [/\bPauschalreisen?\b/gi, "机酒套餐"],
    [/\bCitytrip\b/gi, "城市短途"],
    [/\bCitybreak\b/gi, "城市短假"],
    [/\bKreuzfahrt(en)?\b/gi, "邮轮"],
    [/\bCruise(s)?\b/gi, "邮轮"],
    [/\bInnenkabine\b/gi, "内舱"],
    [/\bAußenkabine\b/gi, "海景舱"],
    [/\bBalkonkabine\b/gi, "阳台舱"],
    [/\bTransfer\b/gi, "接送"],
    [/\bEintritt\b/gi, "门票"],
    [/\bnach Wahl\b/gi, "可选"],
    [/\bFrühstück\b/gi, "早餐"],
    [/\bHalbpension\b/gi, "半膳"],
    [/\bVollpension\b/gi, "全膳"],
    [/\bSelbstverpflegung\b/gi, "自炊"],
    [/\bWellness\b/gi, "康养"],
    [/\bSpa\b/gi, "Spa"],
    [/\bTherme\b/gi, "温泉"],
    [/\bStrand\b/gi, "海滩"],
    [/\bBeach\b/gi, "海滩"],
    [/\bPool\b/gi, "泳池"],
    [/\bWasserpark\b/gi, "水上乐园"],
    [/\bFamil(y|ie|ien)\b/gi, "家庭"],
    [/\bKinder\b/gi, "儿童"],
    [/\bKids\b/gi, "儿童"],
    [/\bBabybett\b/gi, "婴儿床"],
    [/\bMiniclub\b/gi, "儿童俱乐部"],
    [/\bSpielplatz\b/gi, "游乐场"],
    [/\bNächte\b/gi, "晚"],
    [/\bNacht\b/gi, "晚"],
    [/\bTage\b/gi, "天"],
    [/\bTag\b/gi, "天"],
    [/\bWochenende\b/gi, "周末"],
    [/\bSommer\b/gi, "夏季"],
    [/\bWinter\b/gi, "冬季"],
    [/\bHerbst\b/gi, "秋季"],
    [/\bFrühling\b/gi, "春季"],
    [/\bJuli\b/gi, "7 月"],
    [/\bAugust\b/gi, "8 月"],
    [/\bSeptember\b/gi, "9 月"],
    [/\bOktober\b/gi, "10 月"],
    [/\bNovember\b/gi, "11 月"],
    [/\bDezember\b/gi, "12 月"],
    [/\bJanuar\b/gi, "1 月"],
    [/\bFebruar\b/gi, "2 月"],
    [/\bMärz\b/gi, "3 月"],
    [/\bApril\b/gi, "4 月"],
    [/\bMai\b/gi, "5 月"],
    [/\bJuni\b/gi, "6 月"],
    [/\bab\b/gi, "从"],
    [/\bvon\b/gi, "从"],
    [/\bbis\b/gi, "至"],
    [/\bnach\b/gi, "去"],
    [/\bim\b/gi, "在"],
    [/\bam\b/gi, "在"],
    [/\bbei\b/gi, "在"],
    [/\bfür\b/gi, "适合"],
    [/\bmit\b/gi, "含"],
    [/\bund\b/gi, "和"],
    [/\boder\b/gi, "或"],
    [/\bpro Person\b/gi, "每人"],
    [/\bp\.P\./gi, "每人"],
    [/\bNUR\b/gi, "仅"],
    [/\bnur\b/gi, "仅"],
    [/\bTOP\b/gi, "优质"],
    [/\bMega\b/gi, "超值"],
    [/\bBestpreis\b/gi, "好价"],
    [/\bSchnäppchen\b/gi, "特价"],
    [/\bGünstig\b/gi, "低价"],
    [/\bgünstig\b/gi, "低价"],
    [/\bRabatt(code)?\b/gi, "折扣码"],
    [/\bGutschein\b/gi, "优惠券"],
    [/\bSale\b/gi, "促销"],
    [/\bSpecial\b/gi, "特惠"],
    [/\bAngebot(e)?\b/gi, "优惠"],
    [/\bUSA\b/gi, "美国"],
    [/\bBerlin\b/gi, "柏林"],
    [/\bBrandenburg\b/gi, "勃兰登堡"],
    [/\bPotsdam\b/gi, "波茨坦"],
    [/\bSpreewald\b/gi, "施普雷森林"],
    [/\bOstsee\b/gi, "波罗的海"],
    [/\bDeutschland\b/gi, "德国"],
    [/\bGermany\b/gi, "德国"],
    [/\bFrankreich\b/gi, "法国"],
    [/\bFrance\b/gi, "法国"],
    [/\bItalien\b/gi, "意大利"],
    [/\bItaly\b/gi, "意大利"],
    [/\bSpanien\b/gi, "西班牙"],
    [/\bSpain\b/gi, "西班牙"],
    [/\bPortugal\b/gi, "葡萄牙"],
    [/\bÖsterreich\b/gi, "奥地利"],
    [/\bAustria\b/gi, "奥地利"],
    [/\bDänemark\b/gi, "丹麦"],
    [/\bDenmark\b/gi, "丹麦"],
    [/\bPolen\b/gi, "波兰"],
    [/\bPoland\b/gi, "波兰"],
    [/\bNiederlande\b/gi, "荷兰"],
    [/\bNetherlands\b/gi, "荷兰"],
    [/\bTürkei\b/gi, "土耳其"],
    [/\bTurkey\b/gi, "土耳其"],
    [/\bÄgypten\b/gi, "埃及"],
    [/\bEgypt\b/gi, "埃及"],
    [/\bGriechenland\b/gi, "希腊"],
    [/\bGreece\b/gi, "希腊"],
    [/\bRhodos\b/gi, "罗德岛"],
    [/\bKreta\b/gi, "克里特岛"],
    [/\bKorfu\b/gi, "科孚岛"],
    [/\bMallorca\b/gi, "马略卡"],
    [/\bMenorca\b/gi, "梅诺卡"],
    [/\bFormentera\b/gi, "福门特拉"],
    [/\bTeneriffa\b/gi, "特内里费"],
    [/\bFuerteventura\b/gi, "富埃特文图拉"],
    [/\bKanaren\b/gi, "加那利群岛"],
    [/\bSide\b/gi, "锡德"],
    [/\bAntalya\b/gi, "安塔利亚"],
    [/\bHurghada\b/gi, "赫尔格达"],
    [/\bIstanbul\b/gi, "伊斯坦布尔"],
    [/\bBudapest\b/gi, "布达佩斯"],
    [/\bLondon\b/gi, "伦敦"],
    [/\bAmsterdam\b/gi, "阿姆斯特丹"],
    [/\bPrag\b/gi, "布拉格"],
    [/\bParis\b/gi, "巴黎"],
    [/\bHamburg\b/gi, "汉堡"],
    [/\bKöln\b/gi, "科隆"],
    [/\bDüsseldorf\b/gi, "杜塞尔多夫"],
    [/\bFrankfurt\b/gi, "法兰克福"],
    [/\bMünchen\b/gi, "慕尼黑"],
    [/\bHannover\b/gi, "汉诺威"],
    [/\bNürnberg\b/gi, "纽伦堡"],
    [/\bLeipzig\b/gi, "莱比锡"],
    [/\bDresden\b/gi, "德累斯顿"],
    [/\bWien\b/gi, "维也纳"],
    [/\bZürich\b/gi, "苏黎世"],
    [/\bMittelmeer\b/gi, "地中海"],
    [/\bNordeuropa\b/gi, "北欧"],
    [/\bKaribik\b/gi, "加勒比"],
    [/\bAlaska\b/gi, "阿拉斯加"],
    [/\bNew York\b/gi, "纽约"],
    [/\bSingapur\b/gi, "新加坡"],
    [/\bSingapore\b/gi, "新加坡"],
    [/\bMalaysia\b/gi, "马来西亚"],
    [/\bJapan\b/gi, "日本"],
    [/\bMadeira\b/gi, "马德拉"],
  ];

  for (const [pattern, replacement] of replacements) {
    output = output.replace(pattern, replacement);
  }

  return output
    .replace(/\|\s*/g, "｜")
    .replace(/\s*-\s*/g, " - ")
    .replace(/\s*:\s*/g, "：")
    .replace(/\s+/g, " ")
    .trim();
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

function buildStats(items: TravelItem[], runs: SourceRun[], generatedAt: string) {
  const byCategory: Record<string, number> = {};
  const byScope: Record<string, number> = {};
  let newToday = 0;
  let newThisWeek = 0;

  for (const item of items) {
    byCategory[item.category] = (byCategory[item.category] ?? 0) + 1;
    byScope[item.scope] = (byScope[item.scope] ?? 0) + 1;

    const freshness = freshnessKind(item.publishedAt, generatedAt);
    if (freshness === "today") newToday += 1;
    if (freshness) newThisWeek += 1;
  }

  return {
    total: items.length,
    familyFriendly: items.filter((item) => item.familyScore >= 65).length,
    fromBerlin: items.filter((item) => item.fromBerlin).length,
    sourceErrors: runs.filter((run) => run.status === "error").length,
    sourceOk: runs.filter((run) => run.status === "ok").length,
    sourceSkipped: runs.filter((run) => run.status === "skipped").length,
    sourceCacheFallbacks: runs.filter(isCacheFallbackRun).length,
    newToday,
    newThisWeek,
    byCategory,
    byScope,
  };
}

function isCacheFallbackRun(run: SourceRun) {
  return Boolean(run.usedCache || /cached|缓存/i.test(run.message ?? ""));
}

function freshnessKind(
  publishedAt: string | undefined,
  generatedAt: string,
): "today" | "week" | undefined {
  if (!publishedAt) return undefined;
  const publishedDate = new Date(publishedAt);
  const generatedDate = new Date(generatedAt);
  if (
    Number.isNaN(publishedDate.getTime()) ||
    Number.isNaN(generatedDate.getTime()) ||
    publishedDate.getTime() > generatedDate.getTime() + 5 * 60 * 1000
  ) {
    return undefined;
  }

  if (dateKeyInTimezone(publishedDate, timezone) === dateKeyInTimezone(generatedDate, timezone)) {
    return "today";
  }

  const ageMs = generatedDate.getTime() - publishedDate.getTime();
  return ageMs <= 7 * 24 * 60 * 60 * 1000 ? "week" : undefined;
}

function dateKeyInTimezone(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

async function main() {
  const catalog = JSON.parse(await readFile(catalogPath, "utf8")) as SourceDefinition[];
  const previousItems = await readPreviousItems();
  const results = await Promise.all(
    catalog.map((source) => fetchSource(source, previousItems.get(source.id) ?? [])),
  );
  const runs = results.map((result) => result.run);
  const items = dedupeItems(results.flatMap((result) => result.items)).slice(0, 220);
  const generatedAt = new Date().toISOString();

  const data: RadarData = {
    generatedAt,
    timezone,
    homeBase,
    assumptions: [
      "一期以公开 RSS 和可读 HTML 为主，避免需要登录或绕过限制的信息源。",
      "家庭画像按 2 位成人、宝宝/幼儿、可带长辈同行来评分。",
      "价格、库存和日期会快速变化，点击源站前需要二次确认。",
    ],
    stats: buildStats(items, runs, generatedAt),
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
