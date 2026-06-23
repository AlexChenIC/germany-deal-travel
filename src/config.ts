import type {
  AirConditioningStatus,
  DealCategory,
  HeatEscapeStayType,
  KidActivityCategory,
  TravelScope,
} from "./types";

export const actionsWorkflowUrl =
  "https://github.com/AlexChenIC/germany-deal-travel/actions/workflows/pages.yml";

export const googleMapsEmbedApiKey = import.meta.env.VITE_GOOGLE_MAPS_EMBED_API_KEY?.trim();

export const categoryLabels: Record<DealCategory, string> = {
  event: "活动",
  "hotel-resort": "酒店/度假村",
  package: "机酒套餐",
  flight: "机票",
  cruise: "邮轮",
  "all-inclusive": "全包",
  "day-trip": "一日游",
  planning: "灵感",
};

export const scopeLabels: Record<TravelScope, string> = {
  "berlin-city": "柏林市内",
  "berlin-nearby": "柏林周边",
  germany: "德国",
  europe: "欧洲",
  "sun-resort": "阳光度假",
  "long-haul": "长线",
};

export const kidCategoryLabels: Record<KidActivityCategory, string> = {
  cafe: "儿童咖啡",
  music: "音乐/演出",
  "open-play": "开放活动",
  swim: "游泳课",
  museum: "博物馆/室内",
  theatre: "儿童剧场",
  calendar: "活动日历",
};

export const heatStayTypeLabels: Record<HeatEscapeStayType, string> = {
  "waterpark-resort": "水上度假区",
  "lake-resort": "湖畔度假",
  "thermal-spa": "温泉 SPA",
  "spa-hotel": "SPA 酒店",
  "city-staycation": "城市避暑",
};

export const acStatusLabels: Record<AirConditioningStatus, string> = {
  confirmed: "确认房间空调",
  likely: "较可信空调",
  uncertain: "空调待确认",
  none: "不建议高温周末",
};

export const apiSafetyChecklist = [
  {
    id: "budget",
    labelZh: "Google Cloud 预算提醒",
    statusZh: "已设置 €10/月提醒",
    noteZh: "Budget 只负责提醒，不会自动封顶 API 消耗。",
  },
  {
    id: "places-key",
    labelZh: "Google Places 后端 key",
    statusZh: "仅在 GitHub Actions secret 中使用",
    noteZh: "不要把 GOOGLE_PLACES_API_KEY 放进前端环境变量。",
  },
  {
    id: "serpapi-key",
    labelZh: "SerpApi 后端 key",
    statusZh: "仅在每日数据更新中使用",
    noteZh: "免费额度较小，避免频繁手动重跑价格查询。",
  },
  {
    id: "embed-key",
    labelZh: "Google Maps Embed key",
    statusZh: "可公开，但建议限制来源域名",
    noteZh: "只用于内嵌地图；如启用，限制到 GitHub Pages 域名。",
  },
  {
    id: "quota",
    labelZh: "Google Maps Platform quota",
    statusZh: "建议在控制台降低每日/每分钟调用量",
    noteZh: "quota 比预算提醒更接近硬保护。",
  },
];
