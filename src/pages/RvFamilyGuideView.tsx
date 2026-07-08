import {
  Baby,
  BadgeEuro,
  Car,
  CheckCircle2,
  CircleAlert,
  Compass,
  ExternalLink,
  ListChecks,
  MapPinned,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { Metric } from "../components/Controls";
import rvDataJson from "../data/rv-family-guide.json";
import type {
  RvBudgetScenario,
  RvDifficulty,
  RvFamilyGuideData,
  RvGuideCard,
  RvRentalPortal,
  RvRouteRecommendation,
  RvSourceLink,
  RvSuitabilityLevel,
} from "../types";

const rvData = rvDataJson as RvFamilyGuideData;

const priorityLabels: Record<RvGuideCard["priority"], string> = {
  must: "必须确认",
  recommended: "建议做",
  optional: "可选",
};

const difficultyLabels: Record<RvDifficulty, string> = {
  easy: "容易",
  medium: "中等",
  hard: "偏难",
};

const suitabilityLabels: Record<RvSuitabilityLevel, string> = {
  recommended: "优先推荐",
  "trial-first": "适合试水",
  caution: "谨慎尝试",
};

export function RvFamilyGuideView() {
  const recommendedRoutes = rvData.routes.filter(
    (route) => route.suitability === "recommended",
  ).length;
  const mustGuideCount = rvData.guideCards.filter((card) => card.priority === "must").length;

  return (
    <section className="rv-page">
      <div className="rv-hero">
        <div>
          <p className="eyebrow">Family motorhome starter guide</p>
          <h2>房车出行指南</h2>
          <p>{rvData.partyZh}</p>
        </div>
        <div className="rv-verdict">
          <Sparkles size={18} aria-hidden="true" />
          <strong>当前判断</strong>
          <p>{rvData.verdictZh}</p>
          <span>{rvData.recommendedFirstStepZh}</span>
        </div>
      </div>

      <section className="rv-metrics" aria-label="rv guide summary">
        <Metric label="基础指南" value={rvData.guideCards.length} icon={<ShieldCheck />} />
        <Metric label="必须确认" value={mustGuideCount} icon={<CircleAlert />} />
        <Metric label="租车入口" value={rvData.rentalPortals.length} icon={<Car />} />
        <Metric label="路线方案" value={rvData.routes.length} icon={<MapPinned />} />
        <Metric label="优先路线" value={recommendedRoutes} icon={<CheckCircle2 />} />
        <Metric label="预算模型" value={rvData.budgetScenarios.length} icon={<BadgeEuro />} />
      </section>

      <section className="rv-section">
        <div className="rv-section-heading">
          <Sparkles size={18} aria-hidden="true" />
          <h3>先看结论</h3>
        </div>
        <div className="rv-takeaway-grid">
          {rvData.quickTakeawaysZh.map((takeaway) => (
            <span key={takeaway}>{takeaway}</span>
          ))}
        </div>
      </section>

      <section className="rv-section">
        <div className="results-header">
          <h2>基础指南</h2>
          <span>从可行性到安全核查</span>
        </div>
        <div className="rv-guide-grid">
          {rvData.guideCards.map((card) => (
            <GuideCard key={card.id} card={card} />
          ))}
        </div>
      </section>

      <section className="rv-section">
        <div className="results-header">
          <h2>如何租房车</h2>
          <span>{rvData.rentalPortals.length} 个入口</span>
        </div>
        <div className="rv-portal-grid">
          {rvData.rentalPortals.map((portal) => (
            <RentalPortalCard key={portal.id} portal={portal} />
          ))}
        </div>
      </section>

      <section className="rv-section">
        <div className="results-header">
          <h2>7/8 月从柏林出发的路线</h2>
          <span>按第一次房车旅行友好度排序</span>
        </div>
        <div className="rv-route-grid">
          {rvData.routes.map((route) => (
            <RouteCard key={route.id} route={route} />
          ))}
        </div>
      </section>

      <section className="rv-section">
        <div className="results-header">
          <h2>预算规划</h2>
          <span>全家总价粗估</span>
        </div>
        <div className="rv-budget-grid">
          {rvData.budgetScenarios.map((scenario) => (
            <BudgetCard key={scenario.id} scenario={scenario} />
          ))}
        </div>
      </section>

      <section className="rv-action-panel">
        <div>
          <div className="rv-section-heading">
            <ListChecks size={18} aria-hidden="true" />
            <h3>出发前打包与核查</h3>
          </div>
          <ul>
            {rvData.packingChecklistZh.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
        <div>
          <div className="rv-section-heading">
            <Compass size={18} aria-hidden="true" />
            <h3>使用这些信息时</h3>
          </div>
          <ul>
            {rvData.sourceNotesZh.map((note) => (
              <li key={note}>{note}</li>
            ))}
          </ul>
        </div>
      </section>
    </section>
  );
}

function GuideCard({ card }: { card: RvGuideCard }) {
  return (
    <article className={`rv-guide-card is-${card.priority}`}>
      <div className="rv-card-topline">
        <span className={`rv-priority-chip is-${card.priority}`}>
          {priorityLabels[card.priority]}
        </span>
      </div>
      <h3>{card.titleZh}</h3>
      <p>{card.summaryZh}</p>
      <ul>
        {card.pointsZh.map((point) => (
          <li key={point}>{point}</li>
        ))}
      </ul>
      <div className="rv-link-row">
        {card.sources.map((source) => (
          <SourceLink key={source.url} source={source} compact />
        ))}
      </div>
    </article>
  );
}

function RentalPortalCard({ portal }: { portal: RvRentalPortal }) {
  return (
    <article className="rv-portal-card">
      <div className="rv-portal-top">
        <Car size={18} aria-hidden="true" />
        <div>
          <span>{portal.typeZh}</span>
          <h3>{portal.name}</h3>
        </div>
      </div>
      <p>{portal.fitZh}</p>
      <strong>{portal.bestForZh}</strong>
      <em>{portal.cautionZh}</em>
      <div className="rv-check-block">
        <span>下单前查</span>
        <ul>
          {portal.mustCheckZh.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </div>
      <div className="rv-link-row">
        {portal.evidence.map((source) => (
          <SourceLink key={source.url} source={source} compact />
        ))}
      </div>
      <SourceLink source={{ label: "打开入口", url: portal.url, noteZh: portal.name }} primary />
    </article>
  );
}

function RouteCard({ route }: { route: RvRouteRecommendation }) {
  return (
    <article className={`rv-route-card is-${route.suitability}`}>
      <div className="rv-route-top">
        <div>
          <span className={`rv-priority-chip is-${route.suitability}`}>
            {suitabilityLabels[route.suitability]}
          </span>
          <h3>{route.titleZh}</h3>
          <p>{route.regionZh}</p>
        </div>
        <div className="rv-route-score">
          <strong>{route.nightsZh}</strong>
          <span>{difficultyLabels[route.difficulty]}</span>
        </div>
      </div>
      <div className="rv-chip-row">
        <span>
          <Car size={15} aria-hidden="true" />
          约 {route.distanceKm} km
        </span>
        <span>
          <Baby size={15} aria-hidden="true" />
          {route.babyFitZh}
        </span>
      </div>
      <p className="rv-route-summer">{route.summerFitZh}</p>
      <div className="rv-stop-list">
        {route.routeStopsZh.map((stop) => (
          <span key={stop}>{stop}</span>
        ))}
      </div>
      <div className="rv-detail-grid">
        <ListBlock title="为什么适合" items={route.whyZh} positive />
        <ListBlock title="主要风险" items={route.risksZh} />
        <ListBlock title="预订提示" items={route.bookingHintsZh} />
      </div>
      <div className="rv-link-row">
        {route.sources.map((source) => (
          <SourceLink key={source.url} source={source} compact />
        ))}
      </div>
    </article>
  );
}

function BudgetCard({ scenario }: { scenario: RvBudgetScenario }) {
  const lines = [
    ["租车", scenario.rentalZh],
    ["营地", scenario.campsiteZh],
    ["燃油", scenario.fuelZh],
    ["餐食", scenario.foodZh],
    ["杂项", scenario.extrasZh],
  ];

  return (
    <article className="rv-budget-card">
      <div>
        <span>{scenario.routeTypeZh}</span>
        <h3>{scenario.titleZh}</h3>
      </div>
      <div className="rv-budget-total">
        <BadgeEuro size={18} aria-hidden="true" />
        <strong>{scenario.totalZh}</strong>
      </div>
      <div className="rv-budget-lines">
        {lines.map(([label, value]) => (
          <div key={label}>
            <strong>{label}</strong>
            <p>{value}</p>
          </div>
        ))}
      </div>
      <em>{scenario.verdictZh}</em>
    </article>
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
    <div className={positive ? "rv-list-block is-positive" : "rv-list-block"}>
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
  source: RvSourceLink;
  compact?: boolean;
  primary?: boolean;
}) {
  const className = primary ? "primary-link" : compact ? "rv-source-link is-compact" : "rv-source-link";

  return (
    <a
      className={className}
      href={source.url}
      rel="noreferrer"
      target="_blank"
      title={source.noteZh || source.label}
    >
      {source.label}
      <ExternalLink size={14} aria-hidden="true" />
    </a>
  );
}
