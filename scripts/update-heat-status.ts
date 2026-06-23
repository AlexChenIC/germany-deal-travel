import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import type {
  HeatAvailabilityStatus,
  HeatEscapeLiveData,
  HeatEscapeStay,
  HeatEscapeStayData,
  HeatReviewRiskLevel,
  HeatReviewSnippet,
  HeatStayLiveStatus,
  HeatStayPriceStatus,
  HeatStayReviewStatus,
  HeatStayWindow,
  HeatWeatherDay,
  HeatWeatherForecast,
  HeatWeatherLevel,
} from "../src/types";

const rootDir = process.cwd();
const heatStayPath = path.join(rootDir, "src/data/heat-escape-stays.json");
const outputPath = path.join(rootDir, "src/data/heat-live-status.json");
const publicOutputPath = path.join(rootDir, "public/heat-live-status.json");
const timezone = "Europe/Berlin";
const berlinLatitude = 52.52;
const berlinLongitude = 13.405;
const serpApiKey = process.env.SERPAPI_API_KEY?.trim();
const googlePlacesApiKey = process.env.GOOGLE_PLACES_API_KEY?.trim();

interface SerpApiProperty {
  name?: string;
  title?: string;
  link?: string;
  property_token?: string;
  serpapi_property_details_link?: string;
  rate_per_night?: {
    lowest?: string;
    extracted_lowest?: number;
  };
  total_rate?: {
    lowest?: string;
    extracted_lowest?: number;
  };
  prices?: Array<{
    rate_per_night?: {
      lowest?: string;
      extracted_lowest?: number;
    };
    total_rate?: {
      lowest?: string;
      extracted_lowest?: number;
    };
    link?: string;
  }>;
}

interface GoogleReview {
  rating?: number;
  relative_time_description?: string;
  text?: string;
  time?: number;
}

interface GooglePlaceCandidate {
  place_id?: string;
  name?: string;
  rating?: number;
  user_ratings_total?: number;
}

const reviewRiskRules: Array<{
  labelZh: string;
  terms: string[];
  weight: number;
}> = [
  {
    labelZh: "空调/房间闷热",
    terms: [
      "air conditioning",
      "aircondition",
      "air conditioner",
      "a/c",
      " ac ",
      "climate",
      "klimaanlage",
      "hot room",
      "room was hot",
      "too hot",
      "stuffy",
      "warm room",
      "heiss",
      "heiß",
      "stickig",
    ],
    weight: 4,
  },
  {
    labelZh: "泳池/SPA 受限",
    terms: [
      "pool closed",
      "swimming pool closed",
      "sauna closed",
      "spa closed",
      "crowded pool",
      "pool was crowded",
      "wellness closed",
      "geschlossen",
      "ueberfuellt",
      "überfüllt",
    ],
    weight: 3,
  },
  {
    labelZh: "亲子不便",
    terms: [
      "not child friendly",
      "not family friendly",
      "baby",
      "stroller",
      "pushchair",
      "kids not allowed",
      "children not allowed",
      "kinder nicht",
      "buggy",
    ],
    weight: 3,
  },
  {
    labelZh: "噪音/午睡风险",
    terms: ["noise", "noisy", "loud", "party", "thin walls", "laerm", "lärm", "laut"],
    weight: 2,
  },
  {
    labelZh: "服务/清洁波动",
    terms: ["dirty", "unclean", "service", "rude", "staff", "cleanliness", "sauber", "personal"],
    weight: 2,
  },
];

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

function addDays(dateKey: string, days: number) {
  const date = new Date(`${dateKey}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function buildStayWindow(): HeatStayWindow {
  const envCheckIn = process.env.HEAT_STAY_CHECK_IN?.trim();
  const envCheckOut = process.env.HEAT_STAY_CHECK_OUT?.trim();
  const adults = Number(process.env.HEAT_STAY_ADULTS ?? 3);
  const children = Number(process.env.HEAT_STAY_CHILDREN ?? 1);
  const currency = process.env.HEAT_STAY_CURRENCY?.trim() || "EUR";

  if (envCheckIn && envCheckOut) {
    return {
      checkIn: envCheckIn,
      checkOut: envCheckOut,
      nights: diffDays(envCheckIn, envCheckOut),
      adults,
      children,
      currency,
    };
  }

  const todayKey = dateKeyInTimezone(new Date(), timezone);
  const today = new Date(`${todayKey}T12:00:00Z`);
  const dayOfWeek = today.getUTCDay();
  const daysUntilSaturday = (6 - dayOfWeek + 7) % 7 || 7;
  const checkIn = addDays(todayKey, daysUntilSaturday);
  const nights = Number(process.env.HEAT_STAY_NIGHTS ?? 2);

  return {
    checkIn,
    checkOut: addDays(checkIn, nights),
    nights,
    adults,
    children,
    currency,
  };
}

function diffDays(start: string, end: string) {
  const startMs = new Date(`${start}T12:00:00Z`).getTime();
  const endMs = new Date(`${end}T12:00:00Z`).getTime();
  return Math.max(1, Math.round((endMs - startMs) / (1000 * 60 * 60 * 24)));
}

async function fetchJson(url: string, options?: RequestInit): Promise<unknown> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 25000);
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        "user-agent":
          "Mozilla/5.0 (compatible; BerlinFamilyTravelRadar/0.1; +https://github.com/AlexChenIC/germany-deal-travel)",
        accept: "application/json",
        ...(options?.headers ?? {}),
      },
    });
    if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
    return response.json();
  } finally {
    clearTimeout(timeout);
  }
}

async function fetchWeather(previous?: HeatEscapeLiveData): Promise<HeatWeatherForecast> {
  const params = new URLSearchParams({
    latitude: String(berlinLatitude),
    longitude: String(berlinLongitude),
    daily:
      "temperature_2m_max,temperature_2m_min,apparent_temperature_max,precipitation_probability_max",
    forecast_days: "16",
    timezone,
  });
  const sourceUrl = `https://api.open-meteo.com/v1/forecast?${params.toString()}`;

  try {
    const json = (await fetchJson(sourceUrl)) as {
      daily?: {
        time?: string[];
        temperature_2m_max?: number[];
        temperature_2m_min?: number[];
        apparent_temperature_max?: number[];
        precipitation_probability_max?: number[];
      };
    };
    const time = json.daily?.time ?? [];
    const days: HeatWeatherDay[] = time
      .map((date, index): HeatWeatherDay | undefined => {
        const maxTempC = roundTemp(json.daily?.temperature_2m_max?.[index]);
        if (typeof maxTempC !== "number") return undefined;
        return {
          date,
          maxTempC,
          minTempC: roundTemp(json.daily?.temperature_2m_min?.[index]),
          apparentMaxTempC: roundTemp(json.daily?.apparent_temperature_max?.[index]),
          precipitationProbabilityMax: json.daily?.precipitation_probability_max?.[index],
        };
      })
      .filter((day): day is HeatWeatherDay => day !== undefined);

    return {
      sourceName: "Open-Meteo",
      sourceUrl,
      status: "ok",
      days,
      trigger: buildWeatherTrigger(days),
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (previous?.weather.days.length) {
      return {
        ...previous.weather,
        status: "fallback",
        message: `天气抓取失败，已使用上次缓存：${message}`,
      };
    }
    return {
      sourceName: "Open-Meteo",
      sourceUrl,
      status: "error",
      message,
      days: [],
      trigger: {
        active: false,
        level: "none",
        hotDayCount: 0,
        messageZh: "天气数据暂时不可用，避暑排序未启用天气加权。",
      },
    };
  }
}

function roundTemp(value: number | undefined) {
  return typeof value === "number" ? Math.round(value * 10) / 10 : undefined;
}

function buildWeatherTrigger(days: HeatWeatherDay[]): HeatWeatherForecast["trigger"] {
  const validDays = days.filter((day) => typeof day.maxTempC === "number");
  if (validDays.length === 0) {
    return {
      active: false,
      level: "none",
      hotDayCount: 0,
      messageZh: "暂无可用天气预报。",
    };
  }

  const peak = validDays.reduce((max, day) =>
    day.maxTempC > max.maxTempC ? day : max,
  );
  const hotDayCount = validDays.filter((day) => day.maxTempC >= 32).length;
  const level: HeatWeatherLevel =
    peak.maxTempC >= 35 ? "extreme" : peak.maxTempC >= 32 ? "hot" : peak.maxTempC >= 29 ? "watch" : "none";
  const active = level === "hot" || level === "extreme";
  const label =
    level === "extreme"
      ? "35°C+ 强避暑触发"
      : level === "hot"
        ? "32°C+ 避暑触发"
        : level === "watch"
          ? "接近高温，建议观察"
          : "暂无高温触发";

  return {
    active,
    level,
    peakDate: peak.date,
    peakMaxTempC: peak.maxTempC,
    hotDayCount,
    messageZh: `${label}：未来 16 天柏林最高约 ${peak.maxTempC}°C（${peak.date}）。`,
  };
}

async function fetchPriceStatus(
  stay: HeatEscapeStay,
  window: HeatStayWindow,
): Promise<HeatStayPriceStatus> {
  const sourceUrl = buildGoogleHotelsUrl(stay, window);
  if (!serpApiKey) {
    return {
      status: "unconfigured",
      provider: "SerpApi Google Hotels",
      sourceUrl,
      messageZh: "未配置 SERPAPI_API_KEY；当前提供 Google Hotels 检查入口，不抓取实时价格。",
    };
  }

  const params = new URLSearchParams({
    engine: "google_hotels",
    q: `${stay.name} ${stay.location}`,
    check_in_date: window.checkIn,
    check_out_date: window.checkOut,
    adults: String(window.adults),
    children: String(window.children),
    currency: window.currency,
    gl: "de",
    hl: "en",
    api_key: serpApiKey,
  });

  try {
    const json = (await fetchJson(`https://serpapi.com/search.json?${params.toString()}`)) as {
      properties?: SerpApiProperty[];
      error?: string;
    };
    if (json.error) throw new Error(json.error);
    const property = pickBestProperty(stay, json.properties ?? []);
    if (!property) {
      return {
        status: "unknown",
        provider: "SerpApi Google Hotels",
        sourceUrl,
        fetchedAt: new Date().toISOString(),
        messageZh: "已查询 Google Hotels，但没有稳定匹配到该酒店；请打开检查入口复核。",
      };
    }

    const rate = extractSerpRate(property);
    const status: HeatAvailabilityStatus = rate.priceLabel || rate.totalPriceLabel ? "available" : "unknown";

    return {
      status,
      provider: "SerpApi Google Hotels",
      sourceUrl,
      fetchedAt: new Date().toISOString(),
      priceLabel: rate.priceLabel,
      nightlyPriceValue: rate.nightlyPriceValue,
      totalPriceLabel: rate.totalPriceLabel,
      bookingLink: property.link ?? property.serpapi_property_details_link ?? sourceUrl,
      messageZh:
        status === "available"
          ? "已查询到 Google Hotels 价格线索，仍需回源确认房型空调和取消政策。"
          : "已查询但未返回明确价格；可能无房、价格隐藏或匹配不完整。",
    };
  } catch (error) {
    return {
      status: "error",
      provider: "SerpApi Google Hotels",
      sourceUrl,
      fetchedAt: new Date().toISOString(),
      messageZh: `价格/可订性查询失败：${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

function buildGoogleHotelsUrl(stay: HeatEscapeStay, window: HeatStayWindow) {
  const params = new URLSearchParams({
    q: `${stay.name} ${stay.location}`,
    checkin: window.checkIn,
    checkout: window.checkOut,
    adults: String(window.adults),
    children: String(window.children),
    currency: window.currency,
  });
  return `https://www.google.com/travel/hotels?${params.toString()}`;
}

function pickBestProperty(
  stay: HeatEscapeStay,
  properties: SerpApiProperty[],
): SerpApiProperty | undefined {
  const normalizedStayName = normalizeName(stay.name);
  return (
    properties.find((property) => {
      const candidate = normalizeName(property.name ?? property.title ?? "");
      return candidate.includes(normalizedStayName) || normalizedStayName.includes(candidate);
    }) ?? properties[0]
  );
}

function extractSerpRate(property: SerpApiProperty) {
  const firstPrice = property.prices?.[0];
  const nightlyPriceValue =
    property.rate_per_night?.extracted_lowest ?? firstPrice?.rate_per_night?.extracted_lowest;
  return {
    priceLabel: property.rate_per_night?.lowest ?? firstPrice?.rate_per_night?.lowest,
    nightlyPriceValue,
    totalPriceLabel: property.total_rate?.lowest ?? firstPrice?.total_rate?.lowest,
  };
}

async function fetchReviewStatus(stay: HeatEscapeStay): Promise<HeatStayReviewStatus> {
  if (!googlePlacesApiKey) {
    return buildManualReviewRisk(stay, "unconfigured");
  }

  const fetchedAt = new Date().toISOString();
  try {
    const candidate = await findGooglePlace(stay);
    if (!candidate?.place_id) {
      return {
        ...buildManualReviewRisk(stay, "manual"),
        provider: "Google Places API",
        fetchedAt,
        messageZh: "Google Places 未匹配到地点，暂用人工风险点。",
      };
    }

    const params = new URLSearchParams({
      place_id: candidate.place_id,
      fields: "name,rating,user_ratings_total,reviews",
      reviews_sort: "newest",
      language: "en",
      key: googlePlacesApiKey,
    });
    const sourceUrl = `https://maps.googleapis.com/maps/api/place/details/json?${params.toString()}`;
    const json = (await fetchJson(sourceUrl)) as {
      status?: string;
      error_message?: string;
      result?: {
        rating?: number;
        user_ratings_total?: number;
        reviews?: GoogleReview[];
      };
    };
    if (json.status && json.status !== "OK") {
      throw new Error(json.error_message ?? json.status);
    }

    const reviews = json.result?.reviews ?? [];
    const analysis = analyzeReviewRisk(reviews);
    return {
      status: "ok",
      provider: "Google Places API",
      sourceUrl: stay.mapsUrl,
      fetchedAt,
      rating: json.result?.rating ?? candidate.rating,
      reviewCount: json.result?.user_ratings_total ?? candidate.user_ratings_total,
      newestReviewCount: reviews.length,
      riskLevel: analysis.riskLevel,
      signals: analysis.signals,
      snippets: analysis.snippets,
      messageZh:
        reviews.length > 0
          ? "已抓取 Google Places 最新排序评论样本；Google 最多返回少量评论，仍需打开地图复核。"
          : "已匹配 Google Places，但没有返回近期评论样本。",
    };
  } catch (error) {
    return {
      ...buildManualReviewRisk(stay, "error"),
      provider: "Google Places API",
      fetchedAt,
      messageZh: `近期评论查询失败，暂用人工风险点：${
        error instanceof Error ? error.message : String(error)
      }`,
    };
  }
}

async function findGooglePlace(stay: HeatEscapeStay): Promise<GooglePlaceCandidate | undefined> {
  const params = new URLSearchParams({
    input: `${stay.name} ${stay.location}`,
    inputtype: "textquery",
    fields: "place_id,name,rating,user_ratings_total",
    language: "en",
    key: googlePlacesApiKey ?? "",
  });
  const json = (await fetchJson(
    `https://maps.googleapis.com/maps/api/place/findplacefromtext/json?${params.toString()}`,
  )) as {
    status?: string;
    error_message?: string;
    candidates?: GooglePlaceCandidate[];
  };
  if (json.status && json.status !== "OK") throw new Error(json.error_message ?? json.status);
  return json.candidates?.[0];
}

function buildManualReviewRisk(
  stay: HeatEscapeStay,
  status: HeatStayReviewStatus["status"],
): HeatStayReviewStatus {
  const riskText = stay.risksZh.join(" ");
  const analysis = analyzeTextRisk(riskText);
  return {
    status,
    provider: status === "unconfigured" ? "Google Places API" : "Manual baseline",
    sourceUrl: stay.mapsUrl,
    riskLevel: analysis.riskLevel,
    signals: analysis.signals,
    snippets: [],
    messageZh:
      status === "unconfigured"
        ? "未配置 GOOGLE_PLACES_API_KEY；当前使用人工风险点，未抓取近期评论。"
        : "当前使用人工风险点作为评论风险回退。",
  };
}

function analyzeReviewRisk(reviews: GoogleReview[]) {
  const snippets: HeatReviewSnippet[] = reviews
    .filter((review) => review.text)
    .slice(0, 3)
    .map((review) => ({
      rating: review.rating,
      relativeTime: review.relative_time_description,
      text: trimSnippet(review.text ?? ""),
    }));
  const text = reviews.map((review) => review.text ?? "").join(" ");
  const textRisk = analyzeTextRisk(text);
  const lowRatingCount = reviews.filter((review) => typeof review.rating === "number" && review.rating <= 2).length;
  let riskLevel = textRisk.riskLevel;
  if (lowRatingCount >= 2) riskLevel = "high";
  else if (lowRatingCount >= 1 && riskLevel === "low") riskLevel = "medium";

  return {
    ...textRisk,
    riskLevel,
    snippets,
  };
}

function analyzeTextRisk(text: string): {
  riskLevel: HeatReviewRiskLevel;
  signals: HeatStayReviewStatus["signals"];
} {
  const normalized = ` ${normalizeName(text)} `;
  let score = 0;
  const signals = reviewRiskRules
    .map((rule) => {
      const count = rule.terms.filter((term) => normalized.includes(normalizeName(term))).length;
      score += count > 0 ? rule.weight : 0;
      return count > 0 ? { labelZh: rule.labelZh, count } : undefined;
    })
    .filter((signal): signal is { labelZh: string; count: number } => Boolean(signal));

  return {
    riskLevel: score >= 7 ? "high" : score >= 3 ? "medium" : signals.length > 0 ? "low" : "unknown",
    signals,
  };
}

function normalizeName(value: string) {
  return value
    .toLowerCase()
    .replace(/ß/g, "ss")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z0-9\u4e00-\u9fff]+/g, " ")
    .trim();
}

function trimSnippet(value: string) {
  return value.replace(/\s+/g, " ").trim().slice(0, 220);
}

function buildRecommendationLabel(
  stay: HeatEscapeStay,
  price: HeatStayPriceStatus,
  reviews: HeatStayReviewStatus,
  weather: HeatWeatherForecast,
) {
  if (!weather.trigger.active) return "天气未触发高温加权，按常规短住候选观察。";
  if (price.status === "available" && reviews.riskLevel !== "high") {
    return "高温触发 + 有价格线索，适合优先回源核对房型空调。";
  }
  if (stay.airConditioning.status === "confirmed") {
    return "高温触发 + 空调证据强，适合作为优先候选。";
  }
  if (reviews.riskLevel === "high") {
    return "高温触发但评论风险偏高，建议只作备选并仔细复核。";
  }
  return "高温触发，可进入 shortlist，需核对价格和评论。";
}

function isWeatherBoosted(stay: HeatEscapeStay, weather: HeatWeatherForecast) {
  if (!weather.trigger.active) return false;
  return (
    (stay.airConditioning.status === "confirmed" || stay.airConditioning.status === "likely") &&
    (stay.pool.indoor || stay.pool.outdoor || stay.pool.thermal || stay.pool.lake)
  );
}

async function readPreviousLiveData(): Promise<HeatEscapeLiveData | undefined> {
  try {
    return JSON.parse(await readFile(outputPath, "utf8")) as HeatEscapeLiveData;
  } catch {
    return undefined;
  }
}

async function main() {
  const generatedAt = new Date().toISOString();
  const stayData = JSON.parse(await readFile(heatStayPath, "utf8")) as HeatEscapeStayData;
  const previous = await readPreviousLiveData();
  const stayWindow = buildStayWindow();
  const weather = await fetchWeather(previous);
  const items: HeatStayLiveStatus[] = [];

  for (const stay of stayData.items) {
    const [price, reviews] = await Promise.all([
      fetchPriceStatus(stay, stayWindow),
      fetchReviewStatus(stay),
    ]);
    items.push({
      id: stay.id,
      updatedAt: generatedAt,
      weatherBoost: isWeatherBoosted(stay, weather),
      recommendationLabelZh: buildRecommendationLabel(stay, price, reviews, weather),
      price,
      reviews,
    });
  }

  const data: HeatEscapeLiveData = {
    generatedAt,
    timezone,
    stayWindow,
    weather,
    sourceStatus: {
      price: summarizePriceSource(items),
      reviews: summarizeReviewSource(items),
    },
    items,
  };

  await mkdir(path.dirname(outputPath), { recursive: true });
  await mkdir(path.dirname(publicOutputPath), { recursive: true });
  const serialized = `${JSON.stringify(data, null, 2)}\n`;
  await writeFile(outputPath, serialized);
  await writeFile(publicOutputPath, serialized);
}

function summarizePriceSource(items: HeatStayLiveStatus[]): HeatEscapeLiveData["sourceStatus"]["price"] {
  if (!serpApiKey) {
    return {
      provider: "SerpApi Google Hotels",
      status: "unconfigured",
      messageZh: "未配置 SERPAPI_API_KEY；页面显示 Google Hotels 检查入口。",
    };
  }
  const errorCount = items.filter((item) => item.price.status === "error").length;
  return {
    provider: "SerpApi Google Hotels",
    status: errorCount === 0 ? "ok" : errorCount === items.length ? "error" : "partial",
    messageZh:
      errorCount === 0
        ? "已运行价格/可订性查询。"
        : `价格/可订性查询有 ${errorCount} 个候选失败。`,
  };
}

function summarizeReviewSource(items: HeatStayLiveStatus[]): HeatEscapeLiveData["sourceStatus"]["reviews"] {
  if (!googlePlacesApiKey) {
    return {
      provider: "Google Places API",
      status: "unconfigured",
      messageZh: "未配置 GOOGLE_PLACES_API_KEY；页面使用人工风险点，不抓取近期评论。",
    };
  }
  const errorCount = items.filter((item) => item.reviews.status === "error").length;
  return {
    provider: "Google Places API",
    status: errorCount === 0 ? "ok" : errorCount === items.length ? "error" : "partial",
    messageZh:
      errorCount === 0
        ? "已运行近期评论风险查询。"
        : `近期评论查询有 ${errorCount} 个候选失败。`,
  };
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
