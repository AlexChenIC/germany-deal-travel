import {
  Baby,
  BadgeEuro,
  Car,
  CheckCircle2,
  CircleAlert,
  Compass,
  ExternalLink,
  Hotel,
  ListChecks,
  MapPinned,
  Plane,
  Search,
  Sparkles,
  ThermometerSun,
  Utensils,
  Waves,
} from "lucide-react";
import type { ReactNode } from "react";
import { Metric } from "../components/Controls";
import summerDataJson from "../data/summer-all-inclusive-recommendations.json";
import type {
  SummerAllInclusiveData,
  SummerBudgetFit,
  SummerDealSignal,
  SummerDestinationFit,
  SummerDestinationRecommendation,
  SummerRoadTripFit,
  SummerRoadTripMealPlan,
  SummerRoadTripStay,
  SummerSearchPortal,
  SummerSourceLink,
} from "../types";

const summerData = summerDataJson as SummerAllInclusiveData;

const fitLabels: Record<SummerDestinationFit, string> = {
  best: "优先查",
  strong: "强备选",
  "deal-only": "等好价",
  backup: "备选",
};

const budgetLabels: Record<SummerBudgetFit, string> = {
  target: "预算可冲",
  stretch: "可能超预算",
  unlikely: "大概率超预算",
};

const roadTripFitLabels: Record<SummerRoadTripFit, string> = {
  top: "自驾优先",
  strong: "强备选",
  value: "性价比",
  backup: "远程备选",
};

const mealPlanLabels: Record<SummerRoadTripMealPlan, string> = {
  "true-ai": "真全包",
  "kids-ai": "亲子全包",
  "half-board-plus": "准全包",
  "full-board-plus": "餐饮加强",
};

export function SummerAllInclusiveView() {
  const targetBudgetCount =
    summerData.destinations.filter((destination) => destination.budgetFit === "target").length +
    summerData.roadTripStays.filter((stay) => stay.budgetFit === "target").length;

  return (
    <section className="summer-page">
      <div className="summer-hero">
        <div>
          <p className="eyebrow">Summer all-inclusive shortlist</p>
          <h2>7/8 月从柏林出发的全包度假推荐</h2>
          <p>
            面向 {summerData.partyZh}，围绕 {summerData.budgetZh}
            来排序目的地、优惠源和下一步搜索入口。
          </p>
        </div>
        <div className="summer-verdict">
          <Sparkles size={18} aria-hidden="true" />
          <strong>当前判断</strong>
          <p>{summerData.verdictZh}</p>
          <span>{summerData.travelWindowZh}</span>
        </div>
      </div>

      <section className="summer-metrics" aria-label="summer all-inclusive summary">
        <Metric label="飞行目的地" value={summerData.destinations.length} icon={<Compass />} />
        <Metric label="自驾候选" value={summerData.roadTripStays.length} icon={<Car />} />
        <Metric label="预算可冲" value={targetBudgetCount} icon={<BadgeEuro />} />
        <Metric label="优惠源线索" value={summerData.dealSignals.length} icon={<Search />} />
      </section>

      <section className="summer-section">
        <div className="summer-section-heading">
          <CheckCircle2 size={18} aria-hidden="true" />
          <h3>先看结论</h3>
        </div>
        <div className="summer-takeaway-grid">
          {summerData.quickTakeawaysZh.map((takeaway) => (
            <span key={takeaway}>{takeaway}</span>
          ))}
        </div>
      </section>

      <section className="summer-section" id="roadtrip-all-inclusive">
        <div className="results-header">
          <div>
            <h2>柏林自驾可达的全包/准全包</h2>
            <p className="summer-section-note">{summerData.roadTripIntroZh}</p>
          </div>
          <span>{summerData.roadTripStays.length} 个候选</span>
        </div>
        <div className="summer-roadtrip-grid">
          {summerData.roadTripStays.map((stay) => (
            <RoadTripStayCard key={stay.id} stay={stay} />
          ))}
        </div>
      </section>

      <section className="summer-section">
        <div className="results-header">
          <h2>当前值得盯的优惠线索</h2>
          <span>{summerData.dealSignals.length} 个</span>
        </div>
        <div className="summer-signal-grid">
          {summerData.dealSignals.map((signal) => (
            <DealSignalCard key={signal.id} signal={signal} />
          ))}
        </div>
      </section>

      <section className="summer-section">
        <div className="results-header">
          <h2>推荐目的地排序</h2>
          <span>按预算命中率、全包成熟度、宝宝友好度排序</span>
        </div>
        <div className="summer-destination-grid">
          {summerData.destinations.map((destination) => (
            <DestinationCard key={destination.id} destination={destination} />
          ))}
        </div>
      </section>

      <section className="summer-section">
        <div className="results-header">
          <h2>直接打开搜索入口</h2>
          <span>{summerData.searchPortals.length} 个</span>
        </div>
        <div className="summer-portal-grid">
          {summerData.searchPortals.map((portal) => (
            <SearchPortalCard key={portal.url} portal={portal} />
          ))}
        </div>
      </section>

      <section className="summer-action-panel">
        <div>
          <div className="summer-section-heading">
            <ListChecks size={18} aria-hidden="true" />
            <h3>我建议你现在这样查</h3>
          </div>
          <ol>
            {summerData.actionPlanZh.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
        </div>
        <div>
          <div className="summer-section-heading">
            <CircleAlert size={18} aria-hidden="true" />
            <h3>来源使用原则</h3>
          </div>
          <ul>
            {summerData.sourceNotesZh.map((note) => (
              <li key={note}>{note}</li>
            ))}
          </ul>
        </div>
      </section>
    </section>
  );
}

function RoadTripStayCard({ stay }: { stay: SummerRoadTripStay }) {
  return (
    <article className={`summer-roadtrip-card is-${stay.fitLevel}`}>
      <div className="summer-card-top">
        <div>
          <span className={`summer-fit-chip is-${stay.fitLevel}`}>
            {roadTripFitLabels[stay.fitLevel]}
          </span>
          <h3>{stay.nameZh}</h3>
          <p>
            {stay.name} · {stay.regionZh}
          </p>
        </div>
        <div className={`summer-score is-${stay.budgetFit}`}>
          <strong>{stay.fitScore}</strong>
          <span>{budgetLabels[stay.budgetFit]}</span>
        </div>
      </div>

      <div className="summer-drive-row">
        <span>
          <Car size={15} aria-hidden="true" />
          {stay.driveTimeZh}
        </span>
        <span>
          <MapPinned size={15} aria-hidden="true" />
          {stay.country === "germany" ? "德国" : "捷克"}
        </span>
        <span className={`summer-meal-chip is-${stay.mealPlanLevel}`}>
          <Utensils size={15} aria-hidden="true" />
          {mealPlanLabels[stay.mealPlanLevel]}
        </span>
      </div>

      <p className="summer-roadtrip-best">{stay.bestForZh}</p>

      <div className="summer-fact-grid">
        <Fact icon={<Utensils size={15} />} label={stay.mealPlanZh} />
        <Fact icon={<BadgeEuro size={15} />} label={stay.priceExpectationZh} />
        <Fact icon={<Baby size={15} />} label={stay.babyFitZh} />
        <Fact icon={<Waves size={15} />} label={stay.poolSpaZh} />
      </div>

      <div className="summer-list-grid">
        <ListBlock title="为什么值得查" items={stay.whyZh} positive />
        <ListBlock title="下单前风险" items={stay.risksZh} />
      </div>

      <div className="summer-link-block">
        <strong>核查来源</strong>
        <div>
          {stay.sourceLinks.map((source) => (
            <SourceLink key={source.url} source={source} compact />
          ))}
        </div>
      </div>

      <div className="summer-booking-links">
        {stay.bookingLinks.map((source, index) => (
          <SourceLink key={source.url} source={source} primary={index === 0} />
        ))}
      </div>
    </article>
  );
}

function DealSignalCard({ signal }: { signal: SummerDealSignal }) {
  return (
    <article className="summer-signal-card">
      <div>
        <span>{signal.sourceName}</span>
        <h3>{signal.titleZh}</h3>
      </div>
      <div className="summer-signal-price">
        <BadgeEuro size={18} aria-hidden="true" />
        <strong>{signal.priceLabelZh}</strong>
      </div>
      <p>{signal.familyFitZh}</p>
      <small>{signal.dateWindowZh}</small>
      <em>{signal.cautionZh}</em>
      <SourceLink source={{ label: "打开线索", url: signal.url, noteZh: "" }} primary />
      <div className="summer-evidence-row">
        {signal.evidence.map((source) => (
          <SourceLink key={source.url} source={source} compact />
        ))}
      </div>
    </article>
  );
}

function DestinationCard({
  destination,
}: {
  destination: SummerDestinationRecommendation;
}) {
  return (
    <article className={`summer-destination-card is-${destination.fitLevel}`}>
      <div className="summer-card-top">
        <div>
          <span className={`summer-fit-chip is-${destination.fitLevel}`}>
            {fitLabels[destination.fitLevel]}
          </span>
          <h3>
            #{destination.rank} {destination.destinationZh}
          </h3>
          <p>{destination.regionsZh}</p>
        </div>
        <div className={`summer-score is-${destination.budgetFit}`}>
          <strong>{destination.fitScore}</strong>
          <span>{budgetLabels[destination.budgetFit]}</span>
        </div>
      </div>

      <div className="summer-fact-grid">
        <Fact icon={<BadgeEuro size={15} />} label={destination.priceExpectationZh} />
        <Fact icon={<Plane size={15} />} label={destination.flightZh} />
        <Fact icon={<ThermometerSun size={15} />} label={destination.heatZh} />
        <Fact icon={<Baby size={15} />} label={destination.babyFitZh} />
        <Fact icon={<Waves size={15} />} label={destination.allInclusiveFitZh} />
      </div>

      <div className="summer-list-grid">
        <ListBlock title="为什么适合" items={destination.whyZh} positive />
        <ListBlock title="主要风险" items={destination.risksZh} />
      </div>

      <div className="summer-keywords">
        <strong>优先搜索词</strong>
        <div>
          {destination.searchTermsZh.map((term) => (
            <span key={term}>{term}</span>
          ))}
        </div>
      </div>

      <div className="summer-filter-strip">
        {destination.priorityFiltersZh.map((filter) => (
          <span key={filter}>{filter}</span>
        ))}
      </div>

      <div className="summer-link-block">
        <strong>核查来源</strong>
        <div>
          {destination.evidence.map((source) => (
            <SourceLink key={source.url} source={source} compact />
          ))}
        </div>
      </div>

      <div className="summer-booking-links">
        {destination.bookingLinks.map((source, index) => (
          <SourceLink key={source.url} source={source} primary={index === 0} />
        ))}
      </div>
    </article>
  );
}

function SearchPortalCard({ portal }: { portal: SummerSearchPortal }) {
  return (
    <article className="summer-portal-card">
      <div className="summer-portal-top">
        <Hotel size={18} aria-hidden="true" />
        <div>
          <span>{portal.site}</span>
          <h3>{portal.label}</h3>
        </div>
      </div>
      <p>{portal.intentZh}</p>
      <small>{portal.bestForZh}</small>
      <div className="summer-manual-list">
        <strong>手动设置</strong>
        <ul>
          {portal.setManuallyZh.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </div>
      <em>{portal.cautionZh}</em>
      <SourceLink source={{ label: "打开搜索", url: portal.url, noteZh: "" }} primary />
    </article>
  );
}

function Fact({ icon, label }: { icon: ReactNode; label: string }) {
  return (
    <span>
      {icon}
      {label}
    </span>
  );
}

function ListBlock({
  title,
  items,
  positive = false,
}: {
  title: string;
  items: string[];
  positive?: boolean;
}) {
  return (
    <div className={positive ? "summer-list-block is-positive" : "summer-list-block"}>
      <strong>{title}</strong>
      <ul>
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

function SourceLink({
  source,
  compact = false,
  primary = false,
}: {
  source: SummerSourceLink;
  compact?: boolean;
  primary?: boolean;
}) {
  const isInternal = source.url.startsWith("#");
  const className = primary
    ? "primary-link"
    : compact
      ? "summer-source-link is-compact"
      : "summer-source-link";

  return (
    <a
      className={className}
      href={source.url}
      rel={isInternal ? undefined : "noreferrer"}
      target={isInternal ? undefined : "_blank"}
      title={source.noteZh || source.label}
    >
      {source.label}
      <ExternalLink size={14} aria-hidden="true" />
    </a>
  );
}
