export type SourceKind = "rss" | "html" | "api" | "manual";

export type SourceStatus = "active" | "candidate" | "blocked";

export type DealCategory =
  | "event"
  | "hotel-resort"
  | "package"
  | "flight"
  | "cruise"
  | "all-inclusive"
  | "day-trip"
  | "planning";

export type TravelScope =
  | "berlin-city"
  | "berlin-nearby"
  | "germany"
  | "europe"
  | "sun-resort"
  | "long-haul";

export interface SourceDefinition {
  id: string;
  name: string;
  homepage: string;
  kind: SourceKind;
  status: SourceStatus;
  enabled: boolean;
  url?: string;
  focus: string[];
  access: string;
  quality: "high" | "medium" | "watch";
  notes: string;
}

export interface SourceRun {
  id: string;
  name: string;
  status: "ok" | "error" | "skipped";
  itemCount: number;
  message?: string;
  usedCache?: boolean;
  errorMessage?: string;
  fetchedAt: string;
}

export interface TravelItem {
  id: string;
  sourceId: string;
  sourceName: string;
  title: string;
  titleZh: string;
  url: string;
  summary: string;
  publishedAt?: string;
  imageUrl?: string;
  category: DealCategory;
  scope: TravelScope;
  tags: string[];
  priceLabel?: string;
  priceValue?: number;
  durationDays?: number;
  departureHint?: string;
  locationHint?: string;
  familyScore: number;
  familySignals: string[];
  fromBerlin: boolean;
  priorityScore: number;
}

export interface RadarStats {
  total: number;
  familyFriendly: number;
  fromBerlin: number;
  sourceErrors: number;
  sourceOk?: number;
  sourceSkipped?: number;
  sourceCacheFallbacks?: number;
  newToday?: number;
  newThisWeek?: number;
  byCategory: Record<string, number>;
  byScope: Record<string, number>;
}

export interface RadarData {
  generatedAt: string;
  timezone: string;
  homeBase: string;
  assumptions: string[];
  stats: RadarStats;
  sources: SourceRun[];
  items: TravelItem[];
}

export type KidActivityCategory =
  | "cafe"
  | "music"
  | "open-play"
  | "swim"
  | "museum"
  | "theatre"
  | "calendar";

export type KidActivityFitLevel = "excellent" | "good" | "limited" | "future" | "check";

export type KidFacilityStatus = "yes" | "partial" | "unknown" | "no";

export interface KidActivitySuitability {
  baby: KidActivityFitLevel;
  heat: KidActivityFitLevel;
  rain: KidActivityFitLevel;
  indoorCooling: KidFacilityStatus;
  stroller: KidFacilityStatus;
  changingTable: KidFacilityStatus;
  lowCost: boolean;
  verificationDate: string;
  refreshAfter: string;
  notesZh: string[];
}

export interface KidActivity {
  id: string;
  name: string;
  nameZh: string;
  category: KidActivityCategory;
  summaryZh: string;
  ageRange: string;
  cost: string;
  booking: string;
  address: string;
  district: string;
  lat?: number;
  lng?: number;
  website: string;
  sourceName: string;
  sourceUrl: string;
  tags: string[];
  tipZh: string;
  suitability: KidActivitySuitability;
}

export interface KidActivityData {
  updatedAt: string;
  timezone: string;
  notes: string[];
  items: KidActivity[];
}

export type HeatEscapeStayType =
  | "waterpark-resort"
  | "lake-resort"
  | "thermal-spa"
  | "spa-hotel"
  | "city-staycation";

export type AirConditioningStatus = "confirmed" | "likely" | "uncertain" | "none";

export interface HeatEscapeEvidence {
  label: string;
  url: string;
}

export interface HeatEscapeStay {
  id: string;
  name: string;
  nameZh: string;
  type: HeatEscapeStayType;
  ratingLabel: string;
  location: string;
  region: string;
  carMinutes: number;
  trainMinutes?: number;
  travelNoteZh: string;
  priceRangeZh: string;
  bookingUrl: string;
  mapsUrl: string;
  airConditioning: {
    status: AirConditioningStatus;
    confidence: 1 | 2 | 3;
    labelZh: string;
    evidence: HeatEscapeEvidence[];
  };
  pool: {
    indoor: boolean;
    outdoor: boolean;
    children: boolean;
    thermal: boolean;
    lake: boolean;
    labelZh: string;
    evidence: HeatEscapeEvidence[];
  };
  spa: {
    sauna: boolean;
    treatments: boolean;
    labelZh: string;
    evidence: HeatEscapeEvidence[];
  };
  family: {
    babyScore: 1 | 2 | 3 | 4 | 5;
    labelZh: string;
    babyNotesZh: string;
  };
  heatScore: 1 | 2 | 3 | 4 | 5;
  prosZh: string[];
  risksZh: string[];
  checkedAt: string;
}

export interface HeatEscapeStayData {
  updatedAt: string;
  timezone: string;
  notes: string[];
  items: HeatEscapeStay[];
}

export type HeatWeatherLevel = "none" | "watch" | "hot" | "extreme";

export interface HeatWeatherDay {
  date: string;
  maxTempC: number;
  minTempC?: number;
  apparentMaxTempC?: number;
  precipitationProbabilityMax?: number;
}

export interface HeatWeatherTrigger {
  active: boolean;
  level: HeatWeatherLevel;
  peakDate?: string;
  peakMaxTempC?: number;
  hotDayCount: number;
  messageZh: string;
}

export interface HeatWeatherForecast {
  sourceName: string;
  sourceUrl: string;
  status: "ok" | "fallback" | "error";
  message?: string;
  days: HeatWeatherDay[];
  trigger: HeatWeatherTrigger;
}

export interface HeatStayWindow {
  checkIn: string;
  checkOut: string;
  nights: number;
  adults: number;
  children: number;
  currency: string;
}

export type HeatAvailabilityStatus =
  | "available"
  | "sold-out"
  | "unknown"
  | "unconfigured"
  | "error";

export interface HeatStayPriceStatus {
  status: HeatAvailabilityStatus;
  provider: string;
  sourceUrl: string;
  fetchedAt?: string;
  priceLabel?: string;
  nightlyPriceValue?: number;
  totalPriceLabel?: string;
  bookingLink?: string;
  messageZh: string;
}

export type HeatReviewRiskLevel = "low" | "medium" | "high" | "unknown";

export interface HeatReviewRiskSignal {
  labelZh: string;
  count: number;
}

export interface HeatReviewSnippet {
  rating?: number;
  relativeTime?: string;
  text: string;
}

export interface HeatStayReviewStatus {
  status: "ok" | "manual" | "unconfigured" | "error";
  provider: string;
  sourceUrl?: string;
  fetchedAt?: string;
  rating?: number;
  reviewCount?: number;
  newestReviewCount?: number;
  riskLevel: HeatReviewRiskLevel;
  signals: HeatReviewRiskSignal[];
  snippets: HeatReviewSnippet[];
  messageZh: string;
}

export interface HeatStayLiveStatus {
  id: string;
  updatedAt: string;
  weatherBoost: boolean;
  recommendationLabelZh: string;
  price: HeatStayPriceStatus;
  reviews: HeatStayReviewStatus;
}

export interface HeatEscapeLiveData {
  generatedAt: string;
  timezone: string;
  stayWindow: HeatStayWindow;
  weather: HeatWeatherForecast;
  sourceStatus: {
    price: {
      provider: string;
      status: "ok" | "unconfigured" | "partial" | "error";
      messageZh: string;
    };
    reviews: {
      provider: string;
      status: "ok" | "unconfigured" | "partial" | "error";
      messageZh: string;
    };
  };
  items: HeatStayLiveStatus[];
}
