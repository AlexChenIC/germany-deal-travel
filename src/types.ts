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

export type CanaryIslandId =
  | "gran-canaria"
  | "tenerife"
  | "fuerteventura"
  | "lanzarote";

export type CanaryFitLevel = "top" | "strong" | "check" | "backup";

export type CanaryEvidenceStatus = "confirmed" | "partial" | "missing" | "check";

export interface CanarySourceLink {
  label: string;
  url: string;
  noteZh: string;
}

export interface CanaryAdviceBlock {
  titleZh: string;
  pointsZh: string[];
}

export interface CanaryCuratedBookingLink {
  label: string;
  site: string;
  url: string;
  hotelNameZh?: string;
  reasonZh: string;
  fitZh: string;
  cautionZh: string;
}

export interface CanarySearchJump {
  label: string;
  site: string;
  url: string;
  intentZh: string;
  prefilledZh: string[];
  setManuallyZh: string[];
}

export interface CanaryFlightRoute {
  id: string;
  island: CanaryIslandId;
  islandZh: string;
  airportCode: string;
  airportName: string;
  directStatus: "confirmed" | "seasonal" | "check";
  directStatusZh: string;
  airlines: string[];
  flightTimeZh: string;
  julyAugustNoteZh: string;
  sources: CanarySourceLink[];
}

export interface CanaryPriceHint {
  monthZh: string;
  labelZh: string;
  sourceName: string;
  sourceUrl: string;
  noteZh: string;
}

export interface CanaryFacilitySignal {
  status: CanaryEvidenceStatus;
  labelZh: string;
  detailZh: string;
}

export interface CanaryResortOption {
  id: string;
  name: string;
  nameZh: string;
  island: CanaryIslandId;
  islandZh: string;
  resortArea: string;
  airportCode: string;
  transferMinutes: number;
  fitLevel: CanaryFitLevel;
  fitScore: number;
  priceRank: number;
  priceBandZh: string;
  bestForZh: string;
  routeNoteZh: string;
  mealPlanZh: string;
  roomPlanZh: string;
  babyFitZh: string;
  facilities: {
    allInclusive: CanaryFacilitySignal;
    babyReady: CanaryFacilitySignal;
    kidsPool: CanaryFacilitySignal;
    saunaSpa: CanaryFacilitySignal;
    directFlight: CanaryFacilitySignal;
  };
  priceHints: CanaryPriceHint[];
  prosZh: string[];
  risksZh: string[];
  sourceLinks: CanarySourceLink[];
  bookingLinks: CanarySourceLink[];
  checkedAt: string;
}

export interface CanaryBookingPortal {
  name: string;
  url: string;
  useForZh: string;
  cautionZh: string;
}

export interface CanaryAllInclusiveData {
  updatedAt: string;
  timezone: string;
  partyZh: string;
  travelWindowZh: string;
  stayLengthZh: string;
  assumptionsZh: string[];
  quickTakeawaysZh: string[];
  familyAdviceZh: CanaryAdviceBlock[];
  curatedBookingLinks: CanaryCuratedBookingLink[];
  searchJumpLinks: CanarySearchJump[];
  flightRoutes: CanaryFlightRoute[];
  bookingPortals: CanaryBookingPortal[];
  items: CanaryResortOption[];
}

export type SummerDestinationFit = "best" | "strong" | "deal-only" | "backup";

export type SummerBudgetFit = "target" | "stretch" | "unlikely";

export type SummerRoadTripMealPlan =
  | "true-ai"
  | "kids-ai"
  | "half-board-plus"
  | "full-board-plus";

export type SummerRoadTripFit = "top" | "strong" | "value" | "backup";

export interface SummerSourceLink {
  label: string;
  url: string;
  noteZh: string;
}

export interface SummerDealSignal {
  id: string;
  titleZh: string;
  sourceName: string;
  priceLabelZh: string;
  dateWindowZh: string;
  familyFitZh: string;
  cautionZh: string;
  url: string;
  evidence: SummerSourceLink[];
}

export interface SummerDestinationRecommendation {
  id: string;
  rank: number;
  destinationZh: string;
  regionsZh: string;
  fitLevel: SummerDestinationFit;
  budgetFit: SummerBudgetFit;
  fitScore: number;
  priceExpectationZh: string;
  flightZh: string;
  heatZh: string;
  babyFitZh: string;
  allInclusiveFitZh: string;
  whyZh: string[];
  risksZh: string[];
  searchTermsZh: string[];
  priorityFiltersZh: string[];
  evidence: SummerSourceLink[];
  bookingLinks: SummerSourceLink[];
}

export interface SummerRoadTripStay {
  id: string;
  name: string;
  nameZh: string;
  country: "germany" | "czechia";
  regionZh: string;
  driveTimeZh: string;
  driveHours: number;
  mealPlanLevel: SummerRoadTripMealPlan;
  fitLevel: SummerRoadTripFit;
  budgetFit: SummerBudgetFit;
  fitScore: number;
  mealPlanZh: string;
  priceExpectationZh: string;
  babyFitZh: string;
  poolSpaZh: string;
  bestForZh: string;
  whyZh: string[];
  risksZh: string[];
  sourceLinks: SummerSourceLink[];
  bookingLinks: SummerSourceLink[];
}

export interface SummerSearchPortal {
  label: string;
  site: string;
  url: string;
  intentZh: string;
  bestForZh: string;
  cautionZh: string;
  setManuallyZh: string[];
}

export interface SummerAllInclusiveData {
  updatedAt: string;
  timezone: string;
  partyZh: string;
  travelWindowZh: string;
  budgetZh: string;
  verdictZh: string;
  assumptionsZh: string[];
  quickTakeawaysZh: string[];
  dealSignals: SummerDealSignal[];
  roadTripIntroZh: string;
  roadTripStays: SummerRoadTripStay[];
  destinations: SummerDestinationRecommendation[];
  searchPortals: SummerSearchPortal[];
  actionPlanZh: string[];
  sourceNotesZh: string[];
}

export type RvSuitabilityLevel = "recommended" | "trial-first" | "caution";

export type RvDifficulty = "easy" | "medium" | "hard";

export interface RvSourceLink {
  label: string;
  url: string;
  noteZh: string;
}

export interface RvGuideCard {
  id: string;
  titleZh: string;
  summaryZh: string;
  priority: "must" | "recommended" | "optional";
  pointsZh: string[];
  sources: RvSourceLink[];
}

export interface RvRentalPortal {
  id: string;
  name: string;
  url: string;
  typeZh: string;
  fitZh: string;
  bestForZh: string;
  cautionZh: string;
  mustCheckZh: string[];
  evidence: RvSourceLink[];
}

export interface RvRouteRecommendation {
  id: string;
  titleZh: string;
  regionZh: string;
  nightsZh: string;
  distanceKm: number;
  difficulty: RvDifficulty;
  suitability: RvSuitabilityLevel;
  summerFitZh: string;
  babyFitZh: string;
  routeStopsZh: string[];
  whyZh: string[];
  risksZh: string[];
  bookingHintsZh: string[];
  sources: RvSourceLink[];
}

export interface RvBudgetScenario {
  id: string;
  titleZh: string;
  nights: number;
  routeTypeZh: string;
  rentalZh: string;
  campsiteZh: string;
  fuelZh: string;
  foodZh: string;
  extrasZh: string;
  totalZh: string;
  verdictZh: string;
}

export interface RvFamilyGuideData {
  updatedAt: string;
  timezone: string;
  partyZh: string;
  verdictZh: string;
  recommendedFirstStepZh: string;
  assumptionsZh: string[];
  quickTakeawaysZh: string[];
  guideCards: RvGuideCard[];
  rentalPortals: RvRentalPortal[];
  routes: RvRouteRecommendation[];
  budgetScenarios: RvBudgetScenario[];
  packingChecklistZh: string[];
  sourceNotesZh: string[];
}

export type DiscountSourceCategory =
  | "package-sale"
  | "hotel-club"
  | "curated-top20"
  | "short-stay"
  | "community"
  | "retail-package"
  | "local-activity";

export type DiscountSourcePriority = "primary" | "secondary" | "watch";

export interface DiscountWatchSource {
  id: string;
  name: string;
  url: string;
  category: DiscountSourceCategory;
  priority: DiscountSourcePriority;
  headlineZh: string;
  discountSignalZh: string;
  thresholdZh: string;
  familyFitZh: string;
  useForZh: string[];
  caveatsZh: string[];
  evidence: CanarySourceLink[];
}

export interface RegularBookingLink {
  id: string;
  name: string;
  url: string;
  categoryZh: string;
  useForZh: string;
  bestWhenZh: string;
  cautionZh: string;
}

export interface DiscountWatchData {
  updatedAt: string;
  timezone: string;
  designVerdictZh: string;
  principlesZh: string[];
  regularBookingLinks: RegularBookingLink[];
  sources: DiscountWatchSource[];
}
