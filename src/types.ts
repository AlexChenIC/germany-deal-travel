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
