import {
  AirVent,
  Baby,
  BadgeEuro,
  BedDouble,
  CalendarDays,
  CheckCircle2,
  CircleAlert,
  Clock3,
  Compass,
  Coffee,
  Drama,
  ExternalLink,
  Filter,
  Heart,
  Hotel,
  EyeOff,
  Landmark,
  MessageSquareWarning,
  MapPin,
  MapPinned,
  Music2,
  Plane,
  RefreshCcw,
  RotateCcw,
  Search,
  ShieldCheck,
  Ship,
  Snowflake,
  Sparkles,
  Tags,
  ThermometerSun,
  Waves,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Metric, SelectField, TabButton } from "./components/Controls";
import {
  CardFacts,
  displayTitle,
  FreshnessBadge,
  iconForCategory,
  ItemActions,
  SpotlightCard,
  TravelCard,
} from "./components/TravelCards";
import heatEscapeStaysJson from "./data/heat-escape-stays.json";
import heatLiveStatusJson from "./data/heat-live-status.json";
import kidsActivitiesJson from "./data/kids-activities.json";
import radarJson from "./data/radar-data.json";
import sourceCatalogJson from "./data/source-catalog.json";
import {
  acStatusLabels,
  actionsWorkflowUrl,
  categoryLabels,
  googleMapsEmbedApiKey,
  heatStayTypeLabels,
  kidCategoryLabels,
  scopeLabels,
} from "./config";
import { useStoredIdSet } from "./hooks/useStoredIdSet";
import {
  countFreshItems,
  formatDateTime,
  formatFullDateTime,
  formatMonthDay,
  formatRelativeDateTime,
  type FreshnessKind,
} from "./lib/date";
import {
  buildFamilyRecommendations,
  type FamilyRecommendations,
  type KidRecommendation,
  type RecommendationBucket,
  type TravelRecommendation,
} from "./lib/recommendations";
import { expandQuery, normalizeSearchText } from "./lib/search";
import { PlanView } from "./pages/PlanView";
import { SourcesView } from "./pages/SourcesView";
import type {
  AirConditioningStatus,
  DealCategory,
  HeatEscapeStay,
  HeatEscapeStayData,
  HeatEscapeLiveData,
  HeatReviewRiskLevel,
  HeatEscapeStayType,
  HeatStayLiveStatus,
  KidActivity,
  KidActivityCategory,
  KidActivityData,
  KidActivityFitLevel,
  KidFacilityStatus,
  RadarData,
  SourceRun,
  SourceDefinition,
  TravelItem,
  TravelScope,
} from "./types";

const radar = radarJson as RadarData;
const sourceCatalog = sourceCatalogJson as SourceDefinition[];
const kidsActivities = kidsActivitiesJson as KidActivityData;
const heatEscapeStays = heatEscapeStaysJson as HeatEscapeStayData;
const heatLiveStatus = heatLiveStatusJson as HeatEscapeLiveData;

type Tab =
  | "picks"
  | "heat"
  | "radar"
  | "events"
  | "favorites"
  | "kids"
  | "sources"
  | "plan";
type SortMode = "priority" | "newest" | "price";
type HeatSortMode = "fit" | "distance" | "baby" | "ac" | "price" | "review";
type AutomationStatus = "ok" | "warning" | "error";

interface AutomationSummary {
  status: AutomationStatus;
  generatedAt: string;
  timezone: string;
  activeTotal: number;
  okCount: number;
  errorCount: number;
  skippedCount: number;
  cacheFallbackCount: number;
  issueCount: number;
  newToday: number;
  newThisWeek: number;
  staleHours: number;
  problemRuns: SourceRun[];
}

function App() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<DealCategory | "all">("all");
  const [scope, setScope] = useState<TravelScope | "all">("all");
  const [sourceId, setSourceId] = useState("all");
  const [familyOnly, setFamilyOnly] = useState(true);
  const [fromBerlinOnly, setFromBerlinOnly] = useState(false);
  const [sortMode, setSortMode] = useState<SortMode>("priority");
  const [activeTab, setActiveTabState] = useState<Tab>(getInitialTab);
  const favorites = useStoredIdSet("germany-deal-travel:favorites:v1");
  const excluded = useStoredIdSet("germany-deal-travel:excluded:v1");

  useEffect(() => {
    const syncTabFromHash = () => setActiveTabState(hashToTab(window.location.hash));
    window.addEventListener("hashchange", syncTabFromHash);
    window.addEventListener("popstate", syncTabFromHash);
    syncTabFromHash();
    return () => {
      window.removeEventListener("hashchange", syncTabFromHash);
      window.removeEventListener("popstate", syncTabFromHash);
    };
  }, []);

  const filteredItems = useMemo(() => {
    const queryTerms = expandQuery(query);
    const baseItems = radar.items.filter((item) => {
      const haystack = [
        item.title,
        item.titleZh ?? "",
        item.summary,
        item.tags.join(" "),
        item.sourceName,
        item.locationHint ?? "",
      ].join(" ");
      const normalizedHaystack = normalizeSearchText(haystack);
      return (
        (queryTerms.length === 0 ||
          queryTerms.some((term) => normalizedHaystack.includes(term))) &&
        (category === "all" || item.category === category) &&
        (scope === "all" || item.scope === scope) &&
        (sourceId === "all" || item.sourceId === sourceId) &&
        (!familyOnly || item.familyScore >= 65) &&
        (!fromBerlinOnly || item.fromBerlin) &&
        !excluded.ids.has(item.id)
      );
    });

    return baseItems.sort((a, b) => {
      if (sortMode === "newest") {
        return (
          new Date(b.publishedAt ?? 0).getTime() -
          new Date(a.publishedAt ?? 0).getTime()
        );
      }
      if (sortMode === "price") {
        return (a.priceValue ?? Number.MAX_SAFE_INTEGER) -
          (b.priceValue ?? Number.MAX_SAFE_INTEGER);
      }
      return b.priorityScore - a.priorityScore;
    });
  }, [
    category,
    excluded.ids,
    familyOnly,
    fromBerlinOnly,
    query,
    scope,
    sortMode,
    sourceId,
  ]);

  const favoriteItems = useMemo(
    () =>
      radar.items.filter(
        (item) => favorites.ids.has(item.id) && !excluded.ids.has(item.id),
      ),
    [excluded.ids, favorites.ids],
  );
  const excludedItems = useMemo(
    () => radar.items.filter((item) => excluded.ids.has(item.id)),
    [excluded.ids],
  );
  const familyRecommendations = useMemo(
    () =>
      buildFamilyRecommendations({
        items: radar.items,
        kidActivities: kidsActivities.items,
        excludedIds: excluded.ids,
        generatedAt: radar.generatedAt,
        timezone: radar.timezone,
      }),
    [excluded.ids],
  );
  const automationSummary = buildAutomationSummary(radar);

  const spotlight = filteredItems.slice(0, 4);
  const listItems =
    activeTab === "events"
      ? filteredItems.filter((item) => item.category === "event")
      : filteredItems;

  const selectTab = (tab: Tab) => {
    setActiveTabState(tab);
    if (typeof window === "undefined") return;
    const nextHash = tab === "radar" ? "" : `#${tab}`;
    const nextUrl = `${window.location.pathname}${window.location.search}${nextHash}`;
    window.history.pushState(null, "", nextUrl);
  };

  const toggleFavorite = (id: string) => {
    if (excluded.ids.has(id)) {
      excluded.remove(id);
    }
    favorites.toggle(id);
  };

  const excludeItem = (id: string) => {
    favorites.remove(id);
    excluded.add(id);
  };

  return (
    <main className="app-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">Berlin home base</p>
          <h1>柏林家庭出行雷达</h1>
        </div>
        <div className="update-pill">
          <RefreshCcw size={16} aria-hidden="true" />
          <span>{formatDateTime(radar.generatedAt)}</span>
        </div>
      </header>

      <section className="metric-strip" aria-label="summary">
        <Metric label="总条目" value={radar.stats.total} icon={<Compass />} />
        <Metric label="家庭友好" value={radar.stats.familyFriendly} icon={<Baby />} />
        <Metric label="柏林相关" value={radar.stats.fromBerlin} icon={<MapPin />} />
        <Metric
          label="源站提醒"
          value={automationSummary.issueCount}
          icon={<CircleAlert />}
        />
      </section>

      <AutomationStatusPanel summary={automationSummary} />

      <nav className="tabs" aria-label="views">
        <TabButton active={activeTab === "picks"} onClick={() => selectTab("picks")}>
          为我推荐
        </TabButton>
        <TabButton active={activeTab === "heat"} onClick={() => selectTab("heat")}>
          避暑短住
        </TabButton>
        <TabButton active={activeTab === "radar"} onClick={() => selectTab("radar")}>
          推荐雷达
        </TabButton>
        <TabButton active={activeTab === "events"} onClick={() => selectTab("events")}>
          柏林活动
        </TabButton>
        <TabButton
          active={activeTab === "favorites"}
          onClick={() => selectTab("favorites")}
        >
          我的收藏
        </TabButton>
        <TabButton active={activeTab === "kids"} onClick={() => selectTab("kids")}>
          儿童活动
        </TabButton>
        <TabButton
          active={activeTab === "sources"}
          onClick={() => selectTab("sources")}
        >
          信息源
        </TabButton>
        <TabButton active={activeTab === "plan"} onClick={() => selectTab("plan")}>
          路线规划
        </TabButton>
      </nav>

      {activeTab === "picks" ? (
        <PersonalizedPicksView
          recommendations={familyRecommendations}
          favoriteIds={favorites.ids}
          onToggleFavorite={toggleFavorite}
          onExclude={excludeItem}
        />
      ) : activeTab === "heat" ? (
        <HeatEscapeView />
      ) : activeTab === "sources" ? (
        <SourcesView runs={radar.sources} sources={sourceCatalog} timezone={radar.timezone} />
      ) : activeTab === "plan" ? (
        <PlanView />
      ) : activeTab === "favorites" ? (
        <FavoritesView
          favoriteItems={favoriteItems}
          excludedItems={excludedItems}
          onToggleFavorite={toggleFavorite}
          onExclude={excludeItem}
          onRestoreExcluded={excluded.remove}
          onClearExcluded={excluded.clear}
          favoriteIds={favorites.ids}
        />
      ) : activeTab === "kids" ? (
        <KidsActivitiesView />
      ) : (
        <>
          <section className="toolbar" aria-label="filters">
            <label className="search-box">
              <Search size={18} aria-hidden="true" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="搜索：Turkey, CSD, cruise, baby..."
              />
            </label>

            <SelectField
              icon={<Filter size={16} />}
              value={category}
              onChange={(value) => setCategory(value as DealCategory | "all")}
              options={[
                ["all", "全部类型"],
                ...Object.entries(categoryLabels),
              ]}
            />
            <SelectField
              icon={<MapPin size={16} />}
              value={scope}
              onChange={(value) => setScope(value as TravelScope | "all")}
              options={[["all", "全部区域"], ...Object.entries(scopeLabels)]}
            />
            <SelectField
              icon={<Tags size={16} />}
              value={sourceId}
              onChange={setSourceId}
              options={[
                ["all", "全部来源"],
                ...sourceCatalog
                  .filter((source) => source.status === "active")
                  .map((source) => [source.id, source.name] as [string, string]),
              ]}
            />
            <SelectField
              icon={<Sparkles size={16} />}
              value={sortMode}
              onChange={(value) => setSortMode(value as SortMode)}
              options={[
                ["priority", "按推荐"],
                ["newest", "按最新"],
                ["price", "按价格"],
              ]}
            />

            <button
              className={familyOnly ? "toggle is-on" : "toggle"}
              onClick={() => setFamilyOnly((value) => !value)}
              type="button"
            >
              <Baby size={17} aria-hidden="true" />
              家庭优先
            </button>
            <button
              className={fromBerlinOnly ? "toggle is-on" : "toggle"}
              onClick={() => setFromBerlinOnly((value) => !value)}
              type="button"
            >
              <Plane size={17} aria-hidden="true" />
              柏林出发
            </button>
          </section>

          {spotlight.length > 0 && (
            <section className="spotlight-grid" aria-label="top picks">
              {spotlight.map((item) => (
                <SpotlightCard
                  generatedAt={radar.generatedAt}
                  key={item.id}
                  item={item}
                  isFavorite={favorites.ids.has(item.id)}
                  timezone={radar.timezone}
                  onToggleFavorite={toggleFavorite}
                  onExclude={excludeItem}
                />
              ))}
            </section>
          )}

          <section className="results-header">
            <h2>{activeTab === "events" ? "柏林活动" : "全部匹配"}</h2>
            <span>{listItems.length} 条</span>
          </section>

          <section className="card-grid">
            {listItems.map((item) => (
              <TravelCard
                generatedAt={radar.generatedAt}
                key={item.id}
                item={item}
                isFavorite={favorites.ids.has(item.id)}
                timezone={radar.timezone}
                onToggleFavorite={toggleFavorite}
                onExclude={excludeItem}
              />
            ))}
          </section>

          {listItems.length === 0 && (
            <div className="empty-state">
              <Search size={28} aria-hidden="true" />
              <p>当前筛选没有结果</p>
            </div>
          )}
        </>
      )}
    </main>
  );
}

function AutomationStatusPanel({ summary }: { summary: AutomationSummary }) {
  const statusLabel =
    summary.status === "error"
      ? "需要查看"
      : summary.status === "warning"
        ? "有提醒"
        : "运行正常";
  const statusIcon =
    summary.status === "ok" ? (
      <CheckCircle2 size={18} aria-hidden="true" />
    ) : (
      <CircleAlert size={18} aria-hidden="true" />
    );
  const staleText =
    summary.staleHours > 30
      ? `数据已 ${Math.round(summary.staleHours)} 小时未更新`
      : formatRelativeDateTime(summary.generatedAt);

  return (
    <section className={`automation-panel is-${summary.status}`} aria-label="每日自动检索状态">
      <div className="automation-copy">
        <div className="automation-heading">
          <RefreshCcw size={18} aria-hidden="true" />
          <h2>每日自动检索</h2>
          <span className={`status-chip is-${summary.status}`}>
            {statusIcon}
            {statusLabel}
          </span>
        </div>
        <p>
          最近更新：{formatFullDateTime(summary.generatedAt, summary.timezone)}，
          {staleText}。GitHub Actions 每天 05:10 UTC 自动更新，柏林时间夏季约
          07:10、冬季约 06:10。
        </p>
        <a className="text-link automation-link" href={actionsWorkflowUrl} target="_blank" rel="noreferrer">
          打开自动化任务
          <ExternalLink size={15} aria-hidden="true" />
        </a>
      </div>

      <div className="automation-stats" aria-label="自动检索统计">
        <AutomationStat label="已接入源" value={`${summary.okCount}/${summary.activeTotal}`} />
        <AutomationStat label="失败来源" value={summary.errorCount} tone={summary.errorCount > 0 ? "error" : "ok"} />
        <AutomationStat label="跳过/候选" value={summary.skippedCount} />
        <AutomationStat label="缓存回退" value={summary.cacheFallbackCount} tone={summary.cacheFallbackCount > 0 ? "warning" : "ok"} />
        <AutomationStat label="今日新增" value={summary.newToday} tone={summary.newToday > 0 ? "fresh" : undefined} />
        <AutomationStat label="近 7 天新增" value={summary.newThisWeek} tone={summary.newThisWeek > 0 ? "fresh" : undefined} />
      </div>

      {summary.problemRuns.length > 0 && (
        <div className="automation-alerts">
          {summary.problemRuns.map((run) => (
            <div className={isCacheFallbackRun(run) ? "automation-alert is-warning" : "automation-alert is-error"} key={run.id}>
              <strong>{run.name}</strong>
              <span>
                {isCacheFallbackRun(run) ? "已使用缓存回退" : "抓取失败"}
                {run.message ? `：${run.message}` : ""}
              </span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function AutomationStat({
  label,
  value,
  tone,
}: {
  label: string;
  value: number | string;
  tone?: "ok" | "warning" | "error" | "fresh";
}) {
  return (
    <div className={tone ? `automation-stat is-${tone}` : "automation-stat"}>
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  );
}

function PersonalizedPicksView({
  recommendations,
  favoriteIds,
  onToggleFavorite,
  onExclude,
}: {
  recommendations: FamilyRecommendations;
  favoriteIds: Set<string>;
  onToggleFavorite: (id: string) => void;
  onExclude: (id: string) => void;
}) {
  const totalTravelPicks = recommendations.buckets.reduce(
    (count, bucket) => count + bucket.items.length,
    0,
  );

  return (
    <section className="picks-page">
      <div className="picks-hero">
        <div>
          <p className="eyebrow">Family decision board</p>
          <h2>为我推荐</h2>
          <p>
            按当前家庭画像自动挑选近期活动、周边避暑、远期全包和邮轮观察项。
          </p>
        </div>
        <div className="family-profile-panel">
          <strong>{recommendations.profile.group}</strong>
          <div>
            {recommendations.profile.priorities.map((priority) => (
              <span key={priority}>{priority}</span>
            ))}
          </div>
        </div>
      </div>

      <section className="picks-metrics" aria-label="personalized recommendation summary">
        <Metric label="旅行推荐" value={totalTravelPicks} icon={<Sparkles />} />
        <Metric label="儿童建议" value={recommendations.kidPicks.length} icon={<Baby />} />
        <Metric
          label="避暑候选"
          value={bucketCount(recommendations.buckets, "cool-weekends")}
          icon={<Hotel />}
        />
        <Metric
          label="远期观察"
          value={
            bucketCount(recommendations.buckets, "sun-all-inclusive") +
            bucketCount(recommendations.buckets, "cruise-watch")
          }
          icon={<Ship />}
        />
      </section>

      {recommendations.buckets.map((bucket) => (
        <RecommendationBucketSection
          bucket={bucket}
          favoriteIds={favoriteIds}
          key={bucket.id}
          onExclude={onExclude}
          onToggleFavorite={onToggleFavorite}
        />
      ))}

      <section className="recommendation-section">
        <div className="recommendation-header">
          <div>
            <p className="eyebrow">Berlin kids</p>
            <h3>儿童活动建议</h3>
          </div>
          <span>{recommendations.kidPicks.length} 条</span>
        </div>
        <div className="kid-pick-grid">
          {recommendations.kidPicks.map((pick) => (
            <KidRecommendationCard key={pick.activity.id} pick={pick} />
          ))}
        </div>
      </section>
    </section>
  );
}

function HeatEscapeView() {
  const [reliableAcOnly, setReliableAcOnly] = useState(true);
  const [poolOnly, setPoolOnly] = useState(true);
  const [spaOnly, setSpaOnly] = useState(false);
  const [babyReadyOnly, setBabyReadyOnly] = useState(false);
  const [availableOnly, setAvailableOnly] = useState(false);
  const [maxCarMinutes, setMaxCarMinutes] = useState("120");
  const [sortMode, setSortMode] = useState<HeatSortMode>("fit");
  const liveStatusById = useMemo(
    () => new Map(heatLiveStatus.items.map((item) => [item.id, item])),
    [],
  );

  const filteredStays = useMemo(() => {
    const maxMinutes = Number(maxCarMinutes);
    return heatEscapeStays.items
      .filter((stay) => {
        const liveStatus = liveStatusById.get(stay.id);
        return (
          (!reliableAcOnly || isReliableAc(stay.airConditioning.status)) &&
          (!poolOnly || hasPool(stay)) &&
          (!spaOnly || stay.spa.sauna || stay.spa.treatments) &&
          (!babyReadyOnly || stay.family.babyScore >= 4) &&
          (!availableOnly || liveStatus?.price.status === "available") &&
          stay.carMinutes <= maxMinutes
        );
      })
      .sort((a, b) => {
        const liveA = liveStatusById.get(a.id);
        const liveB = liveStatusById.get(b.id);
        if (sortMode === "distance") return a.carMinutes - b.carMinutes;
        if (sortMode === "baby") return b.family.babyScore - a.family.babyScore;
        if (sortMode === "ac") {
          return b.airConditioning.confidence - a.airConditioning.confidence;
        }
        if (sortMode === "price") return priceSortValue(liveA) - priceSortValue(liveB);
        if (sortMode === "review") return reviewRiskSortValue(liveA) - reviewRiskSortValue(liveB);
        return scoreHeatStay(b, liveB) - scoreHeatStay(a, liveA);
      });
  }, [
    availableOnly,
    babyReadyOnly,
    liveStatusById,
    maxCarMinutes,
    poolOnly,
    reliableAcOnly,
    sortMode,
    spaOnly,
  ]);

  const reliableAcCount = heatEscapeStays.items.filter((stay) =>
    isReliableAc(stay.airConditioning.status),
  ).length;
  const babyReadyCount = heatEscapeStays.items.filter(
    (stay) => stay.family.babyScore >= 4,
  ).length;
  const availableCount = heatLiveStatus.items.filter(
    (item) => item.price.status === "available",
  ).length;
  const peakTemp = heatLiveStatus.weather.trigger.peakMaxTempC;

  return (
    <section className="heat-page">
      <div className="heat-hero">
        <div>
          <p className="eyebrow">35°C+ weekend escape</p>
          <h2>避暑短住</h2>
          <p>
            专门筛选柏林 1-2 小时范围内，房间空调较可信、有泳池或 SPA、适合三位成年人和
            11 个月宝宝短住的酒店候选。
          </p>
        </div>
        <div className="heat-notes">
          {heatEscapeStays.notes.map((note) => (
            <span key={note}>{note}</span>
          ))}
        </div>
      </div>

      <section className="heat-metrics" aria-label="heat escape summary">
        <Metric label="候选酒店" value={heatEscapeStays.items.length} icon={<Hotel />} />
        <Metric label="可靠空调" value={reliableAcCount} icon={<AirVent />} />
        <Metric
          label="高温峰值"
          value={peakTemp ? `${peakTemp}°C` : "待更新"}
          icon={<ThermometerSun />}
        />
        <Metric label="宝宝优先" value={babyReadyCount} icon={<Baby />} />
        <Metric label="有价格线索" value={availableCount} icon={<BadgeEuro />} />
      </section>

      <HeatWeatherPanel />

      <section className="heat-toolbar" aria-label="heat stay filters">
        <button
          className={reliableAcOnly ? "toggle is-on" : "toggle"}
          onClick={() => setReliableAcOnly((value) => !value)}
          type="button"
        >
          <Snowflake size={17} aria-hidden="true" />
          可靠空调
        </button>
        <button
          className={poolOnly ? "toggle is-on" : "toggle"}
          onClick={() => setPoolOnly((value) => !value)}
          type="button"
        >
          <Waves size={17} aria-hidden="true" />
          有泳池
        </button>
        <button
          className={spaOnly ? "toggle is-on" : "toggle"}
          onClick={() => setSpaOnly((value) => !value)}
          type="button"
        >
          <Sparkles size={17} aria-hidden="true" />
          桑拿/SPA
        </button>
        <button
          className={babyReadyOnly ? "toggle is-on" : "toggle"}
          onClick={() => setBabyReadyOnly((value) => !value)}
          type="button"
        >
          <Baby size={17} aria-hidden="true" />
          宝宝优先
        </button>
        <button
          className={availableOnly ? "toggle is-on" : "toggle"}
          onClick={() => setAvailableOnly((value) => !value)}
          type="button"
        >
          <BadgeEuro size={17} aria-hidden="true" />
          有价格
        </button>
        <SelectField
          icon={<Clock3 size={16} />}
          value={maxCarMinutes}
          onChange={setMaxCarMinutes}
          options={[
            ["45", "45 分钟内"],
            ["75", "75 分钟内"],
            ["90", "90 分钟内"],
            ["120", "2 小时内"],
          ]}
        />
        <SelectField
          icon={<Filter size={16} />}
          value={sortMode}
          onChange={(value) => setSortMode(value as HeatSortMode)}
          options={[
            ["fit", "按家庭匹配"],
            ["distance", "按距离"],
            ["baby", "按宝宝友好"],
            ["ac", "按空调证据"],
            ["price", "按价格线索"],
            ["review", "按评论风险"],
          ]}
        />
      </section>

      <section className="results-header">
        <h2>避暑候选</h2>
        <span>{filteredStays.length} 条</span>
      </section>

      <section className="heat-card-grid">
        {filteredStays.map((stay, index) => (
          <HeatStayCard
            key={stay.id}
            liveStatus={liveStatusById.get(stay.id)}
            rank={index + 1}
            stay={stay}
          />
        ))}
      </section>

      {filteredStays.length === 0 && (
        <div className="empty-state">
          <Search size={28} aria-hidden="true" />
          <p>当前筛选没有结果</p>
        </div>
      )}
    </section>
  );
}

function HeatWeatherPanel() {
  const trigger = heatLiveStatus.weather.trigger;
  const stayWindow = heatLiveStatus.stayWindow;
  const visibleDays = heatLiveStatus.weather.days.slice(0, 10);

  return (
    <section
      className={`heat-weather-panel is-${trigger.level}`}
      aria-label="Berlin heat forecast"
    >
      <div className="heat-weather-main">
        <div className="heat-section-title">
          <ThermometerSun size={18} aria-hidden="true" />
          <h3>{trigger.active ? "天气触发推荐已开启" : "天气观察"}</h3>
          <span className={`heat-trigger-chip is-${trigger.level}`}>
            {heatWeatherLevelLabel(trigger.level)}
          </span>
        </div>
        <p>{trigger.messageZh}</p>
        <div className="heat-status-row">
          <span>
            <CalendarDays size={15} aria-hidden="true" />
            {stayWindow.checkIn} 至 {stayWindow.checkOut}，{stayWindow.nights} 晚
          </span>
          <span>
            <Baby size={15} aria-hidden="true" />
            {stayWindow.adults} 位成人 + {stayWindow.children} 位宝宝/儿童
          </span>
          <span>
            <RefreshCcw size={15} aria-hidden="true" />
            {formatFullDateTime(heatLiveStatus.generatedAt, heatLiveStatus.timezone)}
          </span>
        </div>
      </div>

      <div className="heat-source-panel">
        <HeatSourceStatus
          label="价格/可订性"
          message={heatLiveStatus.sourceStatus.price.messageZh}
          status={heatLiveStatus.sourceStatus.price.status}
        />
        <HeatSourceStatus
          label="近期评论"
          message={heatLiveStatus.sourceStatus.reviews.messageZh}
          status={heatLiveStatus.sourceStatus.reviews.status}
        />
        <a
          className="text-link"
          href={heatLiveStatus.weather.sourceUrl}
          rel="noreferrer"
          target="_blank"
        >
          Open-Meteo 预报源
          <ExternalLink size={14} aria-hidden="true" />
        </a>
      </div>

      <div className="heat-forecast-strip" aria-label="upcoming forecast">
        {visibleDays.map((day) => (
          <div className={day.maxTempC >= 35 ? "heat-day is-extreme" : day.maxTempC >= 32 ? "heat-day is-hot" : "heat-day"} key={day.date}>
            <strong>{formatMonthDay(day.date)}</strong>
            <span>{day.maxTempC}°C</span>
            {day.apparentMaxTempC && <small>体感 {day.apparentMaxTempC}°C</small>}
          </div>
        ))}
      </div>
    </section>
  );
}

function HeatSourceStatus({
  label,
  message,
  status,
}: {
  label: string;
  message: string;
  status: HeatEscapeLiveData["sourceStatus"]["price"]["status"];
}) {
  return (
    <div className={`heat-source-status is-${status}`}>
      <strong>{label}</strong>
      <span>{message}</span>
    </div>
  );
}

function HeatStayCard({
  stay,
  rank,
  liveStatus,
}: {
  stay: HeatEscapeStay;
  rank: number;
  liveStatus?: HeatStayLiveStatus;
}) {
  const evidenceLinks = collectHeatEvidence(stay);
  const acTone = stay.airConditioning.status;

  return (
    <article className="heat-card">
      <div className="heat-card-top">
        <div>
          <div className="card-meta">
            <span>{heatStayTypeLabels[stay.type]}</span>
            <span>{stay.ratingLabel}</span>
          </div>
          <h3>{stay.nameZh}</h3>
          <p className="original-title">{stay.name}</p>
        </div>
        <div className="heat-rank">
          <strong>{rank}</strong>
          <span>推荐</span>
        </div>
      </div>

      <div className="heat-location-row">
        <span>
          <MapPin size={15} aria-hidden="true" />
          {stay.location}
        </span>
        <span>
          <Clock3 size={15} aria-hidden="true" />
          {formatHeatTravelTime(stay)}
        </span>
        <span>
          <BadgeEuro size={15} aria-hidden="true" />
          {stay.priceRangeZh}
        </span>
      </div>

      <div className="heat-score-grid">
        <HeatScore label="避暑" value={`${stay.heatScore}/5`} icon={<ThermometerSun />} />
        <HeatScore label="宝宝" value={`${stay.family.babyScore}/5`} icon={<Baby />} />
        <HeatScore
          label="匹配"
          value={String(scoreHeatStay(stay, liveStatus))}
          icon={<ShieldCheck />}
        />
      </div>

      {liveStatus && <HeatLiveStatusBlock status={liveStatus} />}

      <div className="heat-section-block">
        <div className="heat-section-title">
          <AirVent size={17} aria-hidden="true" />
          <span className={`ac-badge is-${acTone}`}>{acStatusLabels[acTone]}</span>
        </div>
        <p>{stay.airConditioning.labelZh}</p>
      </div>

      <div className="heat-feature-grid">
        <div className="heat-section-block">
          <div className="heat-section-title">
            <Waves size={17} aria-hidden="true" />
            <strong>泳池/水区</strong>
          </div>
          <p>{stay.pool.labelZh}</p>
        </div>
        <div className="heat-section-block">
          <div className="heat-section-title">
            <Sparkles size={17} aria-hidden="true" />
            <strong>桑拿/SPA</strong>
          </div>
          <p>{stay.spa.labelZh}</p>
        </div>
      </div>

      <div className="heat-section-block">
        <div className="heat-section-title">
          <BedDouble size={17} aria-hidden="true" />
          <strong>家庭适配</strong>
        </div>
        <p>{stay.family.labelZh}</p>
        <p className="heat-baby-note">{stay.family.babyNotesZh}</p>
      </div>

      <div className="heat-list-grid">
        <HeatTextList title="优点" tone="pro" items={stay.prosZh} />
        <HeatTextList title="风险" tone="risk" items={stay.risksZh} />
      </div>

      <HeatEvidenceLinks links={evidenceLinks} />

      <div className="link-row heat-card-links">
        <a className="primary-link" href={stay.bookingUrl} target="_blank" rel="noreferrer">
          打开预订/官网
          <ExternalLink size={16} aria-hidden="true" />
        </a>
        <a className="text-link map-link" href={stay.mapsUrl} target="_blank" rel="noreferrer">
          Google 地图
          <MapPin size={15} aria-hidden="true" />
        </a>
      </div>

      <span className="heat-checked">核验日期：{stay.checkedAt}</span>
    </article>
  );
}

function HeatLiveStatusBlock({ status }: { status: HeatStayLiveStatus }) {
  return (
    <div className="heat-live-block">
      <div className="heat-live-heading">
        <div>
          <span className={status.weatherBoost ? "heat-boost-chip is-on" : "heat-boost-chip"}>
            {status.weatherBoost ? "高温加权" : "常规观察"}
          </span>
          <p>{status.recommendationLabelZh}</p>
        </div>
        <small>{formatDateTime(status.updatedAt)}</small>
      </div>
      <div className="heat-live-grid">
        <HeatPriceBlock status={status} />
        <HeatReviewBlock status={status} />
      </div>
    </div>
  );
}

function HeatPriceBlock({ status }: { status: HeatStayLiveStatus }) {
  const price = status.price;
  return (
    <div className={`heat-live-card is-${price.status}`}>
      <div className="heat-section-title">
        <BadgeEuro size={17} aria-hidden="true" />
        <strong>价格/可订性</strong>
        <span className={`live-status-chip is-${price.status}`}>
          {priceStatusLabel(price.status)}
        </span>
      </div>
      {(price.priceLabel || price.totalPriceLabel) && (
        <div className="heat-price-line">
          {price.priceLabel && <strong>{price.priceLabel}</strong>}
          {price.totalPriceLabel && <span>总价 {price.totalPriceLabel}</span>}
        </div>
      )}
      <p>{price.messageZh}</p>
      <a className="text-link" href={price.bookingLink ?? price.sourceUrl} target="_blank" rel="noreferrer">
        打开价格检查
        <ExternalLink size={14} aria-hidden="true" />
      </a>
    </div>
  );
}

function HeatReviewBlock({ status }: { status: HeatStayLiveStatus }) {
  const reviews = status.reviews;
  return (
    <div className={`heat-live-card is-risk-${reviews.riskLevel}`}>
      <div className="heat-section-title">
        <MessageSquareWarning size={17} aria-hidden="true" />
        <strong>近期评论风险</strong>
        <span className={`risk-chip is-${reviews.riskLevel}`}>
          {reviewRiskLabel(reviews.riskLevel)}
        </span>
      </div>
      <p>{reviews.messageZh}</p>
      {(reviews.rating || reviews.reviewCount) && (
        <div className="heat-review-facts">
          {reviews.rating && <span>评分 {reviews.rating}</span>}
          {reviews.reviewCount && <span>{reviews.reviewCount} 条评价</span>}
          {reviews.newestReviewCount && <span>样本 {reviews.newestReviewCount} 条</span>}
        </div>
      )}
      {reviews.signals.length > 0 && (
        <div className="heat-signal-row">
          {reviews.signals.map((signal) => (
            <span key={signal.labelZh}>
              {signal.labelZh} × {signal.count}
            </span>
          ))}
        </div>
      )}
      {reviews.snippets.length > 0 && (
        <div className="heat-review-snippets">
          {reviews.snippets.map((snippet) => (
            <blockquote key={`${snippet.rating ?? "review"}-${snippet.text}`}>
              {snippet.rating && <strong>{snippet.rating}/5</strong>}
              <span>{snippet.text}</span>
            </blockquote>
          ))}
        </div>
      )}
      {reviews.sourceUrl && (
        <a className="text-link" href={reviews.sourceUrl} target="_blank" rel="noreferrer">
          打开评论源
          <ExternalLink size={14} aria-hidden="true" />
        </a>
      )}
    </div>
  );
}

function HeatScore({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: React.ReactElement;
}) {
  return (
    <div className="heat-score">
      {icon}
      <div>
        <strong>{value}</strong>
        <span>{label}</span>
      </div>
    </div>
  );
}

function HeatTextList({
  title,
  tone,
  items,
}: {
  title: string;
  tone: "pro" | "risk";
  items: string[];
}) {
  return (
    <div className={`heat-text-list is-${tone}`}>
      <strong>{title}</strong>
      <ul>
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

function HeatEvidenceLinks({ links }: { links: Array<{ label: string; url: string }> }) {
  if (links.length === 0) return null;
  return (
    <div className="heat-evidence">
      <strong>证据链接</strong>
      <div>
        {links.map((link) => (
          <a className="text-link" href={link.url} key={link.url} target="_blank" rel="noreferrer">
            {link.label}
            <ExternalLink size={14} aria-hidden="true" />
          </a>
        ))}
      </div>
    </div>
  );
}

function RecommendationBucketSection({
  bucket,
  favoriteIds,
  onToggleFavorite,
  onExclude,
}: {
  bucket: RecommendationBucket;
  favoriteIds: Set<string>;
  onToggleFavorite: (id: string) => void;
  onExclude: (id: string) => void;
}) {
  return (
    <section className="recommendation-section">
      <div className="recommendation-header">
        <div>
          <p className="eyebrow">{bucketTitleHint(bucket.id)}</p>
          <h3>{bucket.title}</h3>
          <p>{bucket.summary}</p>
        </div>
        <span>{bucket.items.length} 条</span>
      </div>

      {bucket.items.length > 0 ? (
        <div className="recommendation-grid">
          {bucket.items.map((recommendation) => (
            <RecommendationTravelCard
              isFavorite={favoriteIds.has(recommendation.item.id)}
              key={recommendation.item.id}
              recommendation={recommendation}
              onExclude={onExclude}
              onToggleFavorite={onToggleFavorite}
            />
          ))}
        </div>
      ) : (
        <div className="empty-state compact">
          <Search size={24} aria-hidden="true" />
          <p>{bucket.emptyText}</p>
        </div>
      )}
    </section>
  );
}

function RecommendationTravelCard({
  recommendation,
  isFavorite,
  onToggleFavorite,
  onExclude,
}: {
  recommendation: TravelRecommendation;
  isFavorite: boolean;
  onToggleFavorite: (id: string) => void;
  onExclude: (id: string) => void;
}) {
  const item = recommendation.item;
  const Icon = iconForCategory(item.category);

  return (
    <article className="recommendation-card">
      <div className="recommendation-card-top">
        <div className="recommendation-icon">
          <Icon size={22} aria-hidden="true" />
        </div>
        <div className="recommendation-score">
          <strong>{recommendation.score}</strong>
          <span>匹配分</span>
        </div>
      </div>
      <div className="card-meta">
        <span>{item.sourceName}</span>
        <div className="meta-end">
          <FreshnessBadge generatedAt={radar.generatedAt} item={item} timezone={radar.timezone} />
          <span>{scopeLabels[item.scope]}</span>
        </div>
      </div>
      <h3>{displayTitle(item)}</h3>
      <p className="original-title">{item.title}</p>
      <p>{item.summary}</p>
      <ReasonList reasons={recommendation.reasons} />
      {recommendation.cautions.length > 0 && (
        <div className="caution-list">
          {recommendation.cautions.map((caution) => (
            <span key={caution}>{caution}</span>
          ))}
        </div>
      )}
      <CardFacts item={item} />
      <ItemActions
        isFavorite={isFavorite}
        onExclude={() => onExclude(item.id)}
        onToggleFavorite={() => onToggleFavorite(item.id)}
      />
      <a className="text-link" href={item.url} target="_blank" rel="noreferrer">
        查看详情
        <ExternalLink size={15} aria-hidden="true" />
      </a>
    </article>
  );
}

function KidRecommendationCard({ pick }: { pick: KidRecommendation }) {
  const activity = pick.activity;
  const Icon = iconForKidCategory(activity.category);

  return (
    <article className="kid-pick-card">
      <div className="kid-pick-top">
        <div className={`kid-icon kid-${activity.category}`}>
          <Icon size={21} aria-hidden="true" />
        </div>
        <div className="recommendation-score">
          <strong>{pick.score}</strong>
          <span>匹配分</span>
        </div>
      </div>
      <div className="card-meta">
        <span>{kidCategoryLabels[activity.category]}</span>
        <span>{activity.district}</span>
      </div>
      <h3>{activity.nameZh}</h3>
      <p className="original-title">{activity.name}</p>
      <p>{activity.summaryZh}</p>
      <ReasonList reasons={pick.reasons} />
      <div className="fact-row">
        <span>{activity.ageRange}</span>
        <span>{activity.cost}</span>
        <span>{activity.booking}</span>
      </div>
      <div className="link-row">
        <a className="text-link" href={activity.website} target="_blank" rel="noreferrer">
          打开活动页
          <ExternalLink size={15} aria-hidden="true" />
        </a>
        <a className="text-link map-link" href={buildGoogleMapsUrl(activity)} target="_blank" rel="noreferrer">
          Google 地图
          <MapPin size={15} aria-hidden="true" />
        </a>
      </div>
    </article>
  );
}

function ReasonList({ reasons }: { reasons: string[] }) {
  if (reasons.length === 0) return null;
  return (
    <div className="reason-list">
      {reasons.map((reason) => (
        <span key={reason}>{reason}</span>
      ))}
    </div>
  );
}

function bucketCount(buckets: RecommendationBucket[], id: RecommendationBucket["id"]) {
  return buckets.find((bucket) => bucket.id === id)?.items.length ?? 0;
}

function bucketTitleHint(id: RecommendationBucket["id"]) {
  return {
    "berlin-soon": "Near-term",
    "cool-weekends": "Cool-down",
    "sun-all-inclusive": "Longer trip",
    "cruise-watch": "Watchlist",
  }[id];
}

function FavoritesView({
  favoriteItems,
  excludedItems,
  favoriteIds,
  onToggleFavorite,
  onExclude,
  onRestoreExcluded,
  onClearExcluded,
}: {
  favoriteItems: TravelItem[];
  excludedItems: TravelItem[];
  favoriteIds: Set<string>;
  onToggleFavorite: (id: string) => void;
  onExclude: (id: string) => void;
  onRestoreExcluded: (id: string) => void;
  onClearExcluded: () => void;
}) {
  return (
    <section className="collection-page">
      <div className="collection-hero">
        <div>
          <p className="eyebrow">Personal shortlist</p>
          <h2>我的收藏</h2>
          <p>
            适合把想进一步核对、和家人讨论、或等待价格变化的项目先收在这里。
          </p>
        </div>
        <div className="collection-stats" aria-label="collection summary">
          <Metric label="收藏" value={favoriteItems.length} icon={<Heart />} />
          <Metric label="已排除" value={excludedItems.length} icon={<EyeOff />} />
        </div>
      </div>

      <section className="results-header">
        <h2>收藏清单</h2>
        <span>{favoriteItems.length} 条</span>
      </section>

      {favoriteItems.length > 0 ? (
        <section className="card-grid">
          {favoriteItems.map((item) => (
            <TravelCard
              generatedAt={radar.generatedAt}
              key={item.id}
              item={item}
              isFavorite={favoriteIds.has(item.id)}
              timezone={radar.timezone}
              onToggleFavorite={onToggleFavorite}
              onExclude={onExclude}
            />
          ))}
        </section>
      ) : (
        <div className="empty-state">
          <Heart size={28} aria-hidden="true" />
          <p>还没有收藏项目</p>
        </div>
      )}

      <section className="excluded-panel">
        <div className="results-header">
          <h2>排除列表</h2>
          <div className="header-actions">
            <span>{excludedItems.length} 条</span>
            {excludedItems.length > 0 && (
              <button className="icon-action" onClick={onClearExcluded} type="button">
                <RotateCcw size={16} aria-hidden="true" />
                全部恢复
              </button>
            )}
          </div>
        </div>

        {excludedItems.length > 0 ? (
          <div className="excluded-list">
            {excludedItems.map((item) => (
              <article className="excluded-row" key={item.id}>
                <div>
                  <span>{item.sourceName}</span>
                  <h3>{displayTitle(item)}</h3>
                  <p>{item.title}</p>
                </div>
                <button
                  className="icon-action"
                  onClick={() => onRestoreExcluded(item.id)}
                  type="button"
                >
                  <RotateCcw size={16} aria-hidden="true" />
                  恢复
                </button>
              </article>
            ))}
          </div>
        ) : (
          <div className="empty-state compact">
            <EyeOff size={24} aria-hidden="true" />
            <p>当前没有被排除的项目</p>
          </div>
        )}
      </section>
    </section>
  );
}

function KidsActivitiesView() {
  const [kidCategory, setKidCategory] = useState<KidActivityCategory | "all">("all");
  const [kidQuery, setKidQuery] = useState("");
  const [babyFitOnly, setBabyFitOnly] = useState(true);
  const [heatFitOnly, setHeatFitOnly] = useState(false);
  const [rainFitOnly, setRainFitOnly] = useState(false);
  const [lowCostOnly, setLowCostOnly] = useState(false);
  const [selectedMapActivityId, setSelectedMapActivityId] = useState("");

  const filteredKidsActivities = useMemo(() => {
    const queryTerms = expandQuery(kidQuery);
    return kidsActivities.items.filter((activity) => {
      const haystack = [
        activity.name,
        activity.nameZh,
        activity.summaryZh,
        activity.district,
        activity.address,
        activity.tags.join(" "),
      ].join(" ");
      const normalizedHaystack = normalizeSearchText(haystack);
      return (
        (kidCategory === "all" || activity.category === kidCategory) &&
        (!babyFitOnly || isGoodKidFit(activity.suitability.baby)) &&
        (!heatFitOnly || isGoodKidFit(activity.suitability.heat)) &&
        (!rainFitOnly || isGoodKidFit(activity.suitability.rain)) &&
        (!lowCostOnly || activity.suitability.lowCost) &&
        (queryTerms.length === 0 ||
          queryTerms.some((term) => normalizedHaystack.includes(term)))
      );
    });
  }, [babyFitOnly, heatFitOnly, kidCategory, kidQuery, lowCostOnly, rainFitOnly]);

  const categoryOptions: Array<[KidActivityCategory | "all", string]> = [
    ["all", "全部"],
    ...Object.entries(kidCategoryLabels).map(
      ([value, label]) => [value as KidActivityCategory, label] as [
        KidActivityCategory,
        string,
      ],
    ),
  ];

  const mapItems = filteredKidsActivities.filter(hasMapLocation);
  const selectedMapActivity =
    mapItems.find((activity) => activity.id === selectedMapActivityId) ?? mapItems[0];

  return (
    <section className="kids-page">
      <div className="kids-hero">
        <div>
          <p className="eyebrow">Berlin kids city guide</p>
          <h2>柏林市区儿童活动资料库</h2>
          <p>
            儿童咖啡馆、亲子音乐会、开放活动、儿童博物馆、剧场和游泳课入口。
          </p>
        </div>
        <div className="kids-notes">
          {kidsActivities.notes.map((note) => (
            <span key={note}>{note}</span>
          ))}
        </div>
      </div>

      <section className="kids-workbench">
        <div className="kids-map-panel">
          <div className="panel-title">
            <MapPinned size={18} aria-hidden="true" />
            <h3>柏林活动地图</h3>
          </div>
          <KidsMapPanel
            items={mapItems}
            selectedActivity={selectedMapActivity}
            onSelectActivity={setSelectedMapActivityId}
          />
        </div>

        <div className="kids-filter-panel">
          <label className="search-box">
            <Search size={18} aria-hidden="true" />
            <input
              value={kidQuery}
              onChange={(event) => setKidQuery(event.target.value)}
              placeholder="搜索：游泳、音乐、免费、Prenzlauer Berg..."
            />
          </label>

          <div className="kid-category-grid" aria-label="kids activity categories">
            {categoryOptions.map(([value, label]) => (
              <button
                className={kidCategory === value ? "kid-category is-active" : "kid-category"}
                key={value}
                onClick={() => setKidCategory(value)}
                type="button"
              >
                {label}
              </button>
            ))}
          </div>

          <div className="kid-filter-toggles" aria-label="kids activity fit filters">
            <button
              className={babyFitOnly ? "toggle is-on" : "toggle"}
              onClick={() => setBabyFitOnly((value) => !value)}
              type="button"
            >
              <Baby size={17} aria-hidden="true" />
              11个月宝宝
            </button>
            <button
              className={heatFitOnly ? "toggle is-on" : "toggle"}
              onClick={() => setHeatFitOnly((value) => !value)}
              type="button"
            >
              <ThermometerSun size={17} aria-hidden="true" />
              热天适合
            </button>
            <button
              className={rainFitOnly ? "toggle is-on" : "toggle"}
              onClick={() => setRainFitOnly((value) => !value)}
              type="button"
            >
              <Waves size={17} aria-hidden="true" />
              雨天适合
            </button>
            <button
              className={lowCostOnly ? "toggle is-on" : "toggle"}
              onClick={() => setLowCostOnly((value) => !value)}
              type="button"
            >
              <BadgeEuro size={17} aria-hidden="true" />
              免费/低价
            </button>
          </div>

          <div className="kid-highlights">
            <div>
              <strong>{kidsActivities.items.length}</strong>
              <span>精选资料</span>
            </div>
            <div>
              <strong>{mapItems.length}</strong>
              <span>地图点位</span>
            </div>
            <div>
              <strong>{countKidCategory("swim")}</strong>
              <span>游泳入口</span>
            </div>
            <div>
              <strong>{countKidFit("baby")}</strong>
              <span>宝宝适合</span>
            </div>
          </div>
        </div>
      </section>

      <section className="results-header">
        <h2>儿童活动清单</h2>
        <span>{filteredKidsActivities.length} 条</span>
      </section>

      <section className="kids-card-grid">
        {filteredKidsActivities.map((activity) => (
          <KidActivityCard
            activity={activity}
            isMapSelected={selectedMapActivity?.id === activity.id}
            key={activity.id}
            onFocusMap={
              googleMapsEmbedApiKey && hasMapLocation(activity)
                ? () => setSelectedMapActivityId(activity.id)
                : undefined
            }
          />
        ))}
      </section>

      {filteredKidsActivities.length === 0 && (
        <div className="empty-state">
          <Search size={28} aria-hidden="true" />
          <p>当前筛选没有结果</p>
        </div>
      )}
    </section>
  );
}

function KidsMapPanel({
  items,
  selectedActivity,
  onSelectActivity,
}: {
  items: Array<KidActivity & { lat: number; lng: number }>;
  selectedActivity?: KidActivity & { lat: number; lng: number };
  onSelectActivity: (id: string) => void;
}) {
  if (googleMapsEmbedApiKey && selectedActivity) {
    return (
      <div className="google-map-shell">
        <iframe
          allowFullScreen
          className="google-map-frame"
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          src={buildGoogleMapsEmbedUrl(selectedActivity)}
          title={`Google Maps - ${selectedActivity.nameZh}`}
        />
        <div className="map-selector" aria-label="Google Maps location selector">
          {items.map((item, index) => (
            <button
              className={
                selectedActivity.id === item.id
                  ? "map-location-chip is-active"
                  : "map-location-chip"
              }
              key={item.id}
              onClick={() => onSelectActivity(item.id)}
              type="button"
            >
              <span>{index + 1}</span>
              {item.nameZh}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="map-fallback">
      <BerlinKidsMap items={items} onSelectActivity={onSelectActivity} />
      <div className="map-status-note">
        <MapPinned size={16} aria-hidden="true" />
        <span>配置 Google Maps Embed API key 后，这里会自动切换为内嵌 Google Maps。</span>
      </div>
    </div>
  );
}

function BerlinKidsMap({
  items,
  onSelectActivity,
}: {
  items: Array<KidActivity & { lat: number; lng: number }>;
  onSelectActivity?: (id: string) => void;
}) {
  return (
    <div className="berlin-map" aria-label="柏林儿童活动地图">
      <svg aria-hidden="true" viewBox="0 0 1000 660" preserveAspectRatio="none">
        <path
          className="map-shape"
          d="M119 203 L213 96 L381 90 L483 49 L630 86 L760 80 L902 179 L874 318 L930 430 L819 558 L642 612 L516 574 L391 632 L218 584 L126 463 L74 330 Z"
        />
        <ellipse className="map-ring" cx="500" cy="325" rx="265" ry="184" />
        <path
          className="map-spree"
          d="M88 364 C193 331 239 377 335 341 C453 297 520 380 623 335 C722 292 796 304 920 267"
        />
        <text x="440" y="304">Mitte</text>
        <text x="292" y="430">Kreuzberg</text>
        <text x="520" y="188">Prenzlauer Berg</text>
        <text x="690" y="424">Lichtenberg</text>
      </svg>

      {items.map((item, index) => {
        const point = projectBerlinPoint(item);
        return (
          <button
            className={`map-pin pin-${item.category}`}
            key={item.id}
            onClick={() => {
              onSelectActivity?.(item.id);
              scrollToKidActivity(item.id);
            }}
            style={{ left: `${point.x}%`, top: `${point.y}%` }}
            title={`${item.nameZh} - ${item.district}`}
            type="button"
          >
            <span>{index + 1}</span>
          </button>
        );
      })}
    </div>
  );
}

function KidActivityCard({
  activity,
  isMapSelected,
  onFocusMap,
}: {
  activity: KidActivity;
  isMapSelected: boolean;
  onFocusMap?: () => void;
}) {
  const Icon = iconForKidCategory(activity.category);
  const googleMapsUrl = buildGoogleMapsUrl(activity);
  const googleDirectionsUrl = hasConcreteAddress(activity)
    ? buildGoogleDirectionsUrl(activity)
    : undefined;

  return (
    <article className="kid-card" id={`kid-${activity.id}`}>
      <div className={`kid-icon kid-${activity.category}`}>
        <Icon size={22} aria-hidden="true" />
      </div>
      <div className="kid-card-body">
        <div className="card-meta">
          <span>{kidCategoryLabels[activity.category]}</span>
          <span>{activity.district}</span>
        </div>
        <h3>{activity.nameZh}</h3>
        <p className="original-title">{activity.name}</p>
        <p>{activity.summaryZh}</p>
        <div className="fact-row">
          <span>{activity.ageRange}</span>
          <span>{activity.cost}</span>
          <span>{activity.booking}</span>
          <span>{activity.address}</span>
        </div>
        <div className="tag-row">
          {activity.tags.map((tag) => (
            <span key={tag}>{tag}</span>
          ))}
        </div>
        <KidSuitabilityBlock activity={activity} />
        <p className="kid-tip">{activity.tipZh}</p>
        <div className="link-row">
          <a className="text-link" href={activity.website} target="_blank" rel="noreferrer">
            打开活动页
            <ExternalLink size={15} aria-hidden="true" />
          </a>
          <a className="text-link" href={activity.sourceUrl} target="_blank" rel="noreferrer">
            资料源
            <ExternalLink size={15} aria-hidden="true" />
          </a>
          <a className="text-link map-link" href={googleMapsUrl} target="_blank" rel="noreferrer">
            Google 地图
            <MapPin size={15} aria-hidden="true" />
          </a>
          {onFocusMap && (
            <button
              className={isMapSelected ? "text-link map-link map-focus-button is-active" : "text-link map-link map-focus-button"}
              onClick={onFocusMap}
              type="button"
            >
              上方地图
              <MapPinned size={15} aria-hidden="true" />
            </button>
          )}
          {googleDirectionsUrl && (
            <a
              className="text-link map-link"
              href={googleDirectionsUrl}
              target="_blank"
              rel="noreferrer"
            >
              公交路线
              <Compass size={15} aria-hidden="true" />
            </a>
          )}
        </div>
      </div>
    </article>
  );
}

function KidSuitabilityBlock({ activity }: { activity: KidActivity }) {
  const suitability = activity.suitability;
  const needsReview = isPastDate(suitability.refreshAfter);
  return (
    <div className="kid-suitability">
      <div className="kid-fit-grid" aria-label="kids activity suitability">
        <KidFitBadge label="宝宝" value={suitability.baby} />
        <KidFitBadge label="热天" value={suitability.heat} />
        <KidFitBadge label="雨天" value={suitability.rain} />
        <KidFacilityBadge label="制冷" value={suitability.indoorCooling} />
        <KidFacilityBadge label="推车" value={suitability.stroller} />
        <KidFacilityBadge label="换尿布" value={suitability.changingTable} />
      </div>
      <div className="kid-suitability-notes">
        {suitability.lowCost && <span className="kid-low-cost">免费/低价优先</span>}
        <span className={needsReview ? "kid-review-date is-stale" : "kid-review-date"}>
          核验 {suitability.verificationDate}
          {needsReview ? "，建议复查" : ""}
        </span>
      </div>
      {suitability.notesZh.length > 0 && (
        <p className="kid-suitability-copy">{suitability.notesZh[0]}</p>
      )}
    </div>
  );
}

function KidFitBadge({
  label,
  value,
}: {
  label: string;
  value: KidActivityFitLevel;
}) {
  return (
    <span className={`kid-fit-badge is-${value}`}>
      <strong>{label}</strong>
      {kidFitLabel(value)}
    </span>
  );
}

function KidFacilityBadge({
  label,
  value,
}: {
  label: string;
  value: KidFacilityStatus;
}) {
  return (
    <span className={`kid-fit-badge is-${value}`}>
      <strong>{label}</strong>
      {kidFacilityLabel(value)}
    </span>
  );
}

function formatHeatTravelTime(stay: HeatEscapeStay) {
  const trainPart = stay.trainMinutes ? `；火车约 ${stay.trainMinutes} 分钟` : "";
  return `自驾约 ${stay.carMinutes} 分钟${trainPart}`;
}

function isReliableAc(status: AirConditioningStatus) {
  return status === "confirmed" || status === "likely";
}

function hasPool(stay: HeatEscapeStay) {
  return stay.pool.indoor || stay.pool.outdoor || stay.pool.thermal || stay.pool.lake;
}

function scoreHeatStay(stay: HeatEscapeStay, liveStatus?: HeatStayLiveStatus) {
  const acScore: Record<AirConditioningStatus, number> = {
    confirmed: 20,
    likely: 13,
    uncertain: 4,
    none: -20,
  };
  const poolScore = hasPool(stay) ? 12 : 0;
  const spaScore = stay.spa.sauna || stay.spa.treatments ? 7 : 0;
  const childrenPoolScore = stay.pool.children ? 5 : 0;
  const distancePenalty = Math.round(stay.carMinutes / 10);
  const weatherBoost = liveStatus?.weatherBoost ? 10 : 0;
  const availabilityBoost = liveStatus?.price.status === "available" ? 8 : 0;
  const reviewPenalty =
    liveStatus?.reviews.riskLevel === "high"
      ? 12
      : liveStatus?.reviews.riskLevel === "medium"
        ? 6
        : 0;

  return (
    stay.heatScore * 12 +
    stay.family.babyScore * 8 +
    acScore[stay.airConditioning.status] +
    poolScore +
    spaScore +
    childrenPoolScore -
    distancePenalty +
    weatherBoost +
    availabilityBoost -
    reviewPenalty
  );
}

function priceSortValue(status?: HeatStayLiveStatus) {
  if (!status) return Number.MAX_SAFE_INTEGER;
  if (typeof status.price.nightlyPriceValue === "number") {
    return status.price.nightlyPriceValue;
  }
  if (status.price.status === "available") return 9999;
  return Number.MAX_SAFE_INTEGER;
}

function reviewRiskSortValue(status?: HeatStayLiveStatus) {
  const order: Record<HeatReviewRiskLevel, number> = {
    low: 0,
    unknown: 1,
    medium: 2,
    high: 3,
  };
  return status ? order[status.reviews.riskLevel] : order.unknown;
}

function heatWeatherLevelLabel(level: HeatEscapeLiveData["weather"]["trigger"]["level"]) {
  return {
    none: "无高温",
    watch: "观察",
    hot: "高温",
    extreme: "强高温",
  }[level];
}

function priceStatusLabel(status: HeatStayLiveStatus["price"]["status"]) {
  return {
    available: "有价格",
    "sold-out": "无房",
    unknown: "待确认",
    unconfigured: "未配置",
    error: "失败",
  }[status];
}

function reviewRiskLabel(level: HeatReviewRiskLevel) {
  return {
    low: "低风险",
    medium: "中风险",
    high: "高风险",
    unknown: "未知",
  }[level];
}

function collectHeatEvidence(stay: HeatEscapeStay) {
  const links = [
    ...stay.airConditioning.evidence,
    ...stay.pool.evidence,
    ...stay.spa.evidence,
  ];
  const seenUrls = new Set<string>();
  return links.filter((link) => {
    if (seenUrls.has(link.url)) return false;
    seenUrls.add(link.url);
    return true;
  });
}

function iconForKidCategory(category: KidActivityCategory) {
  if (category === "cafe") return Coffee;
  if (category === "music") return Music2;
  if (category === "swim") return Waves;
  if (category === "museum") return Landmark;
  if (category === "theatre") return Drama;
  if (category === "calendar") return CalendarDays;
  return Baby;
}

function countKidCategory(category: KidActivityCategory) {
  return kidsActivities.items.filter((activity) => activity.category === category).length;
}

function countKidFit(kind: "baby" | "heat" | "rain") {
  return kidsActivities.items.filter((activity) => isGoodKidFit(activity.suitability[kind])).length;
}

function isGoodKidFit(level: KidActivityFitLevel) {
  return level === "excellent" || level === "good";
}

function kidFitLabel(level: KidActivityFitLevel) {
  return {
    excellent: "优先",
    good: "适合",
    limited: "有限",
    future: "稍大",
    check: "待筛",
  }[level];
}

function kidFacilityLabel(status: KidFacilityStatus) {
  return {
    yes: "明确",
    partial: "部分",
    unknown: "待查",
    no: "没有",
  }[status];
}

function isPastDate(value: string) {
  const date = new Date(`${value}T23:59:59+02:00`);
  return !Number.isNaN(date.getTime()) && date.getTime() < Date.now();
}

function hasMapLocation(activity: KidActivity): activity is KidActivity & {
  lat: number;
  lng: number;
} {
  return typeof activity.lat === "number" && typeof activity.lng === "number";
}

function projectBerlinPoint(activity: KidActivity & { lat: number; lng: number }) {
  const bounds = {
    west: 13.3,
    east: 13.63,
    south: 52.44,
    north: 52.58,
  };

  const x = ((activity.lng - bounds.west) / (bounds.east - bounds.west)) * 100;
  const y = ((bounds.north - activity.lat) / (bounds.north - bounds.south)) * 100;

  return {
    x: clamp(x, 4, 96),
    y: clamp(y, 5, 95),
  };
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function scrollToKidActivity(id: string) {
  if (typeof document === "undefined") return;
  document.getElementById(`kid-${id}`)?.scrollIntoView({
    behavior: "smooth",
    block: "start",
  });
}

function buildGoogleMapsUrl(activity: KidActivity) {
  const query = hasConcreteAddress(activity)
    ? `${activity.name} ${activity.address}`
    : `${activity.name} Berlin`;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

function buildGoogleMapsEmbedUrl(activity: KidActivity) {
  const query = hasConcreteAddress(activity)
    ? `${activity.name} ${activity.address}`
    : `${activity.name} Berlin`;
  const params = new URLSearchParams({
    key: googleMapsEmbedApiKey ?? "",
    q: query,
    zoom: "13",
  });
  return `https://www.google.com/maps/embed/v1/place?${params.toString()}`;
}

function buildGoogleDirectionsUrl(activity: KidActivity) {
  const destination = hasMapLocation(activity)
    ? `${activity.lat},${activity.lng}`
    : `${activity.name} ${activity.address}`;
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
    destination,
  )}&travelmode=transit`;
}

function hasConcreteAddress(activity: KidActivity) {
  return !["多处", "全城", "活动聚合"].some((term) => activity.address.includes(term));
}

function buildAutomationSummary(data: RadarData): AutomationSummary {
  const activeSourceIds = new Set(
    sourceCatalog
      .filter((source) => source.status === "active" && source.enabled)
      .map((source) => source.id),
  );
  const activeRuns = data.sources.filter((run) => activeSourceIds.has(run.id));
  const errorRuns = activeRuns.filter((run) => run.status === "error");
  const cacheFallbackRuns = activeRuns.filter(isCacheFallbackRun);
  const problemRuns = Array.from(
    new Map([...errorRuns, ...cacheFallbackRuns].map((run) => [run.id, run])).values(),
  );
  const generatedAtMs = new Date(data.generatedAt).getTime();
  const staleHours = Number.isNaN(generatedAtMs)
    ? 0
    : Math.max(0, (Date.now() - generatedAtMs) / (1000 * 60 * 60));
  const status: AutomationStatus =
    errorRuns.length > 0 || staleHours > 48
      ? "error"
      : cacheFallbackRuns.length > 0 || staleHours > 30
        ? "warning"
        : "ok";

  return {
    status,
    generatedAt: data.generatedAt,
    timezone: data.timezone,
    activeTotal: activeSourceIds.size,
    okCount: activeRuns.filter((run) => run.status === "ok").length,
    errorCount: errorRuns.length,
    skippedCount: data.sources.filter((run) => run.status === "skipped").length,
    cacheFallbackCount: cacheFallbackRuns.length,
    issueCount: errorRuns.length + cacheFallbackRuns.length,
    newToday:
      data.stats.newToday ??
      countFreshItems(data.items, data.generatedAt, data.timezone, "today"),
    newThisWeek:
      data.stats.newThisWeek ??
      countFreshItems(data.items, data.generatedAt, data.timezone, "week"),
    staleHours,
    problemRuns,
  };
}

function isCacheFallbackRun(run: SourceRun) {
  return Boolean(run.usedCache || /cached|cache|缓存|回退/i.test(run.message ?? ""));
}

function getSourceState(run: SourceRun | undefined, source: SourceDefinition) {
  if (!run || run.status === "skipped" || source.status !== "active") {
    return { label: source.status === "active" ? "已跳过" : "候选/未启用", tone: "skipped" };
  }
  if (run.status === "error") return { label: "抓取失败", tone: "error" };
  if (isCacheFallbackRun(run)) return { label: "缓存回退", tone: "warning" };
  return { label: "运行正常", tone: "ok" };
}

function getInitialTab(): Tab {
  if (typeof window === "undefined") return "radar";
  return hashToTab(window.location.hash);
}

function hashToTab(hash: string): Tab {
  const normalized = hash.replace(/^#\/?/, "");
  if (
    normalized === "picks" ||
    normalized === "heat" ||
    normalized === "events" ||
    normalized === "favorites" ||
    normalized === "kids" ||
    normalized === "sources" ||
    normalized === "plan"
  ) {
    return normalized;
  }
  return "radar";
}

export default App;
