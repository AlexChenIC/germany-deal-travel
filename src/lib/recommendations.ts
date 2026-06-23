import type { KidActivity, KidActivityCategory, TravelItem } from "../types";

export type RecommendationBucketId =
  | "berlin-soon"
  | "cool-weekends"
  | "sun-all-inclusive"
  | "cruise-watch";

export interface FamilyProfile {
  homeBase: string;
  group: string;
  priorities: string[];
}

export interface TravelRecommendation {
  item: TravelItem;
  score: number;
  reasons: string[];
  cautions: string[];
}

export interface RecommendationBucket {
  id: RecommendationBucketId;
  title: string;
  summary: string;
  emptyText: string;
  items: TravelRecommendation[];
}

export interface KidRecommendation {
  activity: KidActivity;
  score: number;
  reasons: string[];
}

export interface FamilyRecommendations {
  profile: FamilyProfile;
  buckets: RecommendationBucket[];
  kidPicks: KidRecommendation[];
}

interface RecommendationInput {
  items: TravelItem[];
  kidActivities: KidActivity[];
  excludedIds: ReadonlySet<string>;
  generatedAt: string;
  timezone: string;
}

interface BucketConfig {
  id: RecommendationBucketId;
  title: string;
  summary: string;
  emptyText: string;
  limit: number;
  matches: (item: TravelItem, text: string) => boolean;
  extraScore: (item: TravelItem, text: string, freshness: FreshnessKind | undefined) => number;
  baseReasons: (
    item: TravelItem,
    text: string,
    freshness: FreshnessKind | undefined,
  ) => Array<string | undefined>;
}

type FreshnessKind = "today" | "week";

const familyProfile: FamilyProfile = {
  homeBase: "Berlin",
  group: "3 位成年人 + 1 位约 11 个月宝宝，可兼顾长辈同行",
  priorities: [
    "避暑和低折腾优先",
    "宝宝友好、推车友好、室内/水边/泳池加分",
    "柏林市内和柏林出发优先",
    "长途旅行优先全包、直飞、接送和餐食省心",
  ],
};

const bucketConfigs: BucketConfig[] = [
  {
    id: "berlin-soon",
    title: "近期柏林活动",
    summary: "适合临时安排、交通成本低、宝宝作息更容易控制的城市内活动。",
    emptyText: "当前没有足够匹配的柏林近期活动。",
    limit: 5,
    matches: (item) => item.category === "event" && item.scope === "berlin-city",
    extraScore: (item, text, freshness) =>
      (freshness === "today" ? 24 : freshness === "week" ? 14 : 0) +
      (containsAny(text, ["family", "familie", "kinder", "kids", "museum", "park"]) ? 8 : 0) +
      (item.priceValue && item.priceValue <= 60 ? 5 : 0),
    baseReasons: (item, text, freshness) => [
      "柏林市内，适合半日或临时安排",
      freshness === "today"
        ? "今天新增，适合优先扫一眼"
        : freshness === "week"
          ? "本周新增，信息相对新鲜"
          : undefined,
      item.familyScore >= 65 ? "家庭友好评分较高" : undefined,
      containsAny(text, ["museum", "park", "festival", "family", "familie", "kinder"])
        ? "内容与亲子/城市轻活动相关"
        : undefined,
    ],
  },
  {
    id: "cool-weekends",
    title: "周边避暑与短住",
    summary: "优先看柏林周边、德国境内、波罗的海、温泉/SPA、泳池和家庭酒店。",
    emptyText: "当前没有足够匹配的周边避暑或短住项目。",
    limit: 5,
    matches: (item, text) =>
      ["berlin-nearby", "germany"].includes(item.scope) &&
      ["hotel-resort", "day-trip", "planning"].includes(item.category) &&
      containsAny(text, [
        "ostsee",
        "strand",
        "beach",
        "pool",
        "wasser",
        "therme",
        "spa",
        "wellness",
        "ferienwohnung",
        "apartment",
        "center parcs",
        "familie",
        "kinder",
      ]),
    extraScore: (item, text) =>
      (item.scope === "berlin-nearby" ? 18 : 8) +
      (containsAny(text, ["pool", "wasser", "therme", "spa", "wellness"]) ? 16 : 0) +
      (containsAny(text, ["ostsee", "strand", "beach"]) ? 12 : 0) +
      (item.durationDays && item.durationDays <= 4 ? 7 : 0) +
      (item.priceValue && item.priceValue <= 150 ? 6 : 0),
    baseReasons: (item, text) => [
      item.scope === "berlin-nearby" ? "柏林周边，适合 1-2 晚短住" : "德国境内，交通风险较低",
      containsAny(text, ["pool", "wasser", "therme", "spa", "wellness"])
        ? "包含泳池/水边/SPA/康养线索，适合热天关注"
        : undefined,
      containsAny(text, ["ostsee", "strand", "beach"])
        ? "海边或水边方向，适合避暑备选"
        : undefined,
      item.familyScore >= 65 ? "家庭友好评分较高" : undefined,
      item.durationDays && item.durationDays <= 4 ? "时长适合周末或小长假" : undefined,
    ],
  },
  {
    id: "sun-all-inclusive",
    title: "远期阳光/全包",
    summary: "适合提前观察土耳其、埃及、希腊、西班牙等低操心度度假产品。",
    emptyText: "当前没有足够匹配的阳光/全包旅行项目。",
    limit: 5,
    matches: (item, text) =>
      ["sun-resort", "europe"].includes(item.scope) &&
      ["all-inclusive", "package", "hotel-resort"].includes(item.category) &&
      containsAny(text, [
        "all inclusive",
        "all-inclusive",
        "vollpension",
        "transfer",
        "flug",
        "flight",
        "turkey",
        "türkei",
        "egypt",
        "ägypten",
        "greece",
        "griechenland",
        "mallorca",
        "menorca",
        "side",
        "antalya",
        "hurghada",
      ]),
    extraScore: (item, text) =>
      (item.category === "all-inclusive" ? 22 : 0) +
      (containsAny(text, ["transfer", "hoteltransfer", "direktflug", "nonstop"]) ? 12 : 0) +
      (containsAny(text, ["all inclusive", "all-inclusive", "vollpension"]) ? 14 : 0) +
      (item.fromBerlin ? 10 : 0) +
      (item.durationDays && item.durationDays >= 5 && item.durationDays <= 9 ? 7 : 0),
    baseReasons: (item, text) => [
      item.category === "all-inclusive" ? "全包产品，带宝宝时餐食和现场决策更省心" : undefined,
      containsAny(text, ["transfer", "hoteltransfer"]) ? "有接送线索，落地后折腾更少" : undefined,
      containsAny(text, ["direktflug", "nonstop", "direct flight"]) ? "有直飞线索，适合带宝宝优先核对" : undefined,
      item.fromBerlin ? "与柏林出发相关" : undefined,
      item.durationDays && item.durationDays >= 5 && item.durationDays <= 9
        ? "时长适合一周左右家庭度假"
        : undefined,
    ],
  },
  {
    id: "cruise-watch",
    title: "邮轮与大型旅行观察",
    summary: "邮轮、渡轮和更大型旅行先放入观察，不急订，重点核对婴儿政策和节奏。",
    emptyText: "当前没有足够匹配的邮轮或大型旅行项目。",
    limit: 4,
    matches: (item) => item.category === "cruise",
    extraScore: (item, text) =>
      (item.scope === "berlin-nearby" || item.scope === "europe" ? 12 : 0) +
      (containsAny(text, ["all inclusive", "all-inclusive", "vollpension", "getränkepaket"]) ? 10 : 0) +
      (item.durationDays && item.durationDays <= 7 ? 8 : 0) +
      (item.priceValue && item.priceValue <= 800 ? 6 : 0),
    baseReasons: (item, text) => [
      item.scope === "berlin-nearby" || item.scope === "europe"
        ? "欧洲/近德国方向，整体旅行复杂度较低"
        : "大型旅行，适合作为远期观察",
      containsAny(text, ["all inclusive", "all-inclusive", "vollpension", "getränkepaket"])
        ? "餐食/饮品省心线索较强"
        : undefined,
      item.durationDays && item.durationDays <= 7 ? "时长较短，适合先试水" : undefined,
      "需要二次核对婴儿登船年龄、婴儿床和岸上节奏",
    ],
  },
];

export function buildFamilyRecommendations(
  input: RecommendationInput,
): FamilyRecommendations {
  const availableItems = input.items.filter((item) => !input.excludedIds.has(item.id));

  return {
    profile: familyProfile,
    buckets: bucketConfigs.map((config) => ({
      id: config.id,
      title: config.title,
      summary: config.summary,
      emptyText: config.emptyText,
      items: availableItems
        .filter((item) => config.matches(item, itemText(item)))
        .map((item) => scoreTravelRecommendation(item, config, input))
        .sort((a, b) => b.score - a.score)
        .slice(0, config.limit),
    })),
    kidPicks: input.kidActivities
      .map(scoreKidRecommendation)
      .sort((a, b) => b.score - a.score)
      .slice(0, 6),
  };
}

function scoreTravelRecommendation(
  item: TravelItem,
  config: BucketConfig,
  input: RecommendationInput,
): TravelRecommendation {
  const text = itemText(item);
  const freshness = freshnessKind(item.publishedAt, input.generatedAt, input.timezone);
  const score =
    item.priorityScore +
    item.familyScore * 0.7 +
    config.extraScore(item, text, freshness) +
    (item.priceValue && item.priceValue <= 250 ? 4 : 0) -
    riskPenalty(item, text);

  return {
    item,
    score: Math.round(score),
    reasons: unique(
      [
        ...config.baseReasons(item, text, freshness),
        item.priceLabel ? `价格线索：${item.priceLabel}` : undefined,
        item.familySignals.length > 0 ? item.familySignals[0] : undefined,
      ].filter(Boolean) as string[],
    ).slice(0, 4),
    cautions: buildCautions(item, text),
  };
}

function buildCautions(item: TravelItem, text: string) {
  const cautions: string[] = [];
  if (item.category === "flight" || item.category === "package") {
    cautions.push("需核对航班时间、行李和婴儿票政策");
  }
  if (item.category === "cruise") {
    cautions.push("需核对婴儿登船年龄和婴儿床");
  }
  if (
    item.category === "event" &&
    containsAny(text, ["csd", "party", "club", "nightlife", "nachtclub"])
  ) {
    cautions.push("可能拥挤、吵闹或偏成人，带宝宝需谨慎");
  }
  if (item.category === "event" && containsAny(text, ["festival", "street festival"])) {
    cautions.push("热天和人流需要现场二次判断");
  }
  if (item.scope === "sun-resort") {
    cautions.push("暑期目的地可能很热，优先确认房间空调和泳池");
  }
  if (containsAny(text, ["adults-only", "adults only", "erwachsenenhotel"])) {
    cautions.push("可能成人限定，需谨慎核对");
  }
  if (!item.priceLabel) {
    cautions.push("价格需回源站确认");
  }
  return cautions.slice(0, 2);
}

function riskPenalty(item: TravelItem, text: string) {
  let penalty = 0;
  if (containsAny(text, ["adults-only", "adults only", "erwachsenenhotel"])) penalty += 80;
  if (
    item.category === "event" &&
    containsAny(text, ["csd", "party", "club", "nightlife", "nachtclub"])
  ) {
    penalty += 36;
  }
  if (item.scope === "long-haul") penalty += 10;
  if (item.priceValue && item.priceValue > 3000) penalty += 10;
  return penalty;
}

function scoreKidRecommendation(activity: KidActivity): KidRecommendation {
  const text = normalizeText(
    [
      activity.name,
      activity.nameZh,
      activity.summaryZh,
      activity.ageRange,
      activity.cost,
      activity.booking,
      activity.tags.join(" "),
      activity.tipZh,
    ].join(" "),
  );
  const categoryScore: Record<KidActivityCategory, number> = {
    cafe: 34,
    "open-play": 36,
    music: 28,
    swim: 24,
    museum: 26,
    theatre: 10,
    calendar: 22,
  };
  const reasons = [
    containsAny(text, ["婴幼儿", "低龄", "baby", "3 个月"]) ? "年龄段对 11 个月宝宝更友好" : undefined,
    containsAny(text, ["室内", "indoor"]) ? "室内活动，热天/雨天更稳" : undefined,
    containsAny(text, ["免费", "低价", "公益"]) ? "免费或低价，适合先试" : undefined,
    activity.category === "swim" ? "游泳课名额紧张，值得长期关注" : undefined,
    activity.category === "music" ? "亲子音乐项目，适合提前看低龄场次" : undefined,
    activity.category === "cafe" ? "儿童咖啡馆，适合短时放电和休息" : undefined,
    activity.category === "open-play" ? "开放活动/家庭中心，适合建立固定节奏" : undefined,
  ].filter(Boolean) as string[];

  return {
    activity,
    score:
      categoryScore[activity.category] +
      (containsAny(text, ["婴幼儿", "低龄", "3 个月"]) ? 18 : 0) +
      (containsAny(text, ["室内"]) ? 10 : 0) +
      (containsAny(text, ["免费", "低价", "公益"]) ? 8 : 0) +
      (containsAny(text, ["需抢课", "需提前", "预约", "购票"]) ? 3 : 0),
    reasons: unique(reasons).slice(0, 3),
  };
}

function itemText(item: TravelItem) {
  return normalizeText(
    [
      item.title,
      item.titleZh,
      item.summary,
      item.tags.join(" "),
      item.locationHint,
      item.departureHint,
      item.familySignals.join(" "),
    ]
      .filter(Boolean)
      .join(" "),
  );
}

function containsAny(text: string, terms: string[]) {
  return terms.some((term) => text.includes(normalizeText(term)));
}

function normalizeText(value: string) {
  return value
    .toLowerCase()
    .replace(/ß/g, "ss")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");
}

function freshnessKind(
  publishedAt: string | undefined,
  generatedAt: string,
  timeZone: string,
): FreshnessKind | undefined {
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
  if (dateKeyInTimezone(publishedDate, timeZone) === dateKeyInTimezone(generatedDate, timeZone)) {
    return "today";
  }
  return generatedDate.getTime() - publishedDate.getTime() <= 7 * 24 * 60 * 60 * 1000
    ? "week"
    : undefined;
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

function unique(values: string[]) {
  return Array.from(new Set(values));
}
