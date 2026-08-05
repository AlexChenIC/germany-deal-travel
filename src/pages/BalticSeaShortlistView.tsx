import {
  Baby,
  BadgeEuro,
  Car,
  CheckCircle2,
  CircleAlert,
  ExternalLink,
  Hotel,
  ListChecks,
  MapPinned,
  Search,
  Sparkles,
  ThermometerSun,
  Utensils,
  Waves,
} from "lucide-react";
import type { ReactNode } from "react";
import { Metric } from "../components/Controls";
import balticDataJson from "../data/baltic-sea-shortlist.json";

type BalticFitLevel = "top" | "strong" | "value" | "watch" | "backup";
type BalticMealPlanLevel =
  | "true-ai"
  | "ai-light"
  | "ai-possible"
  | "ai-min4"
  | "not-ai";

interface BalticSourceLink {
  label: string;
  url: string;
  noteZh: string;
}

interface BalticCandidate {
  id: string;
  name: string;
  nameZh: string;
  destinationZh: string;
  countryZh: string;
  fitLevel: BalticFitLevel;
  fitScore: number;
  mealPlanLevel: BalticMealPlanLevel;
  mealPlanZh: string;
  driveTimeZh: string;
  travelWindowFitZh: string;
  priceZh: string;
  coolingZh: string;
  babyFitZh: string;
  poolSpaZh: string;
  currentStatusZh: string;
  recommendationZh: string;
  reasonsZh: string[];
  risksZh: string[];
  tagsZh: string[];
  sourceLinks: BalticSourceLink[];
  bookingLinks: BalticSourceLink[];
}

interface BalticDestinationNote {
  nameZh: string;
  summaryZh: string;
  bestForZh: string;
}

interface BalticWeatherCard {
  placeZh: string;
  forecastZh: string;
  heatFitZh: string;
}

interface BalticBookingLink {
  site: string;
  label: string;
  intentZh: string;
  url: string;
  cautionZh: string;
}

interface BalticSeaShortlistData {
  updatedAt: string;
  timezone: string;
  partyZh: string;
  travelWindowZh: string;
  verdictZh: string;
  weatherSummaryZh: string;
  quickTakeawaysZh: string[];
  weatherCards: BalticWeatherCard[];
  destinationNotes: BalticDestinationNote[];
  candidates: BalticCandidate[];
  regularBookingLinks: BalticBookingLink[];
  actionPlanZh: string[];
}

const balticData = balticDataJson as BalticSeaShortlistData;

const fitLabels: Record<BalticFitLevel, string> = {
  top: "首选",
  strong: "强备选",
  value: "性价比",
  watch: "只监控",
  backup: "普通备选",
};

const mealLabels: Record<BalticMealPlanLevel, string> = {
  "true-ai": "真全包",
  "ai-light": "轻全包",
  "ai-possible": "可查全包",
  "ai-min4": "4 晚起全包",
  "not-ai": "非全包",
};

export function BalticSeaShortlistView() {
  const trueAllInclusiveCount = balticData.candidates.filter(
    (candidate) => candidate.mealPlanLevel === "true-ai",
  ).length;
  const shortStayFitCount = balticData.candidates.filter((candidate) =>
    /2-3|2 晚|3 晚|2 晚起|至少 2 晚/.test(candidate.travelWindowFitZh),
  ).length;
  const babyStrongCount = balticData.candidates.filter((candidate) =>
    /儿童|宝宝|婴儿|家庭/.test(candidate.babyFitZh),
  ).length;

  return (
    <section className="summer-page baltic-page">
      <div className="summer-hero">
        <div>
          <p className="eyebrow">Baltic heat escape shortlist</p>
          <h2>吕根岛 / 波兰北部海边全包短住</h2>
          <p>
            面向 {balticData.partyZh}，按 {balticData.travelWindowZh}
            来筛选 3-4 小时自驾范围内的海边避暑酒店。
          </p>
        </div>
        <div className="summer-verdict">
          <Sparkles size={18} aria-hidden="true" />
          <strong>当前结论</strong>
          <p>{balticData.verdictZh}</p>
          <span>更新时间：{formatDateTime(balticData.updatedAt)}</span>
        </div>
      </div>

      <section className="summer-metrics" aria-label="baltic sea shortlist summary">
        <Metric label="候选酒店" value={balticData.candidates.length} icon={<Hotel />} />
        <Metric label="真全包" value={trueAllInclusiveCount} icon={<Utensils />} />
        <Metric label="短住匹配" value={shortStayFitCount} icon={<Car />} />
        <Metric label="亲子信号" value={babyStrongCount} icon={<Baby />} />
      </section>

      <section className="summer-section">
        <div className="summer-section-heading">
          <ThermometerSun size={18} aria-hidden="true" />
          <h3>下周末避暑判断</h3>
        </div>
        <p className="summer-section-note">{balticData.weatherSummaryZh}</p>
        <div className="summer-signal-grid">
          {balticData.weatherCards.map((weather) => (
            <article className="summer-signal-card" key={weather.placeZh}>
              <div>
                <span>Forecast snapshot</span>
                <h3>{weather.placeZh}</h3>
              </div>
              <div className="summer-signal-price">
                <ThermometerSun size={18} aria-hidden="true" />
                <strong>{weather.forecastZh}</strong>
              </div>
              <p>{weather.heatFitZh}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="summer-section">
        <div className="summer-section-heading">
          <CheckCircle2 size={18} aria-hidden="true" />
          <h3>先看结论</h3>
        </div>
        <div className="summer-takeaway-grid">
          {balticData.quickTakeawaysZh.map((takeaway) => (
            <span key={takeaway}>{takeaway}</span>
          ))}
        </div>
      </section>

      <section className="summer-section">
        <div className="results-header">
          <div>
            <h2>目的地区分</h2>
            <p className="summer-section-note">
              Rügen 和波兰海边不是同一种玩法：一个更稳、更德国境内；另一个全包和价格线索更强。
            </p>
          </div>
          <span>{balticData.destinationNotes.length} 个区域</span>
        </div>
        <div className="summer-signal-grid">
          {balticData.destinationNotes.map((destination) => (
            <article className="summer-signal-card" key={destination.nameZh}>
              <div>
                <span>Destination</span>
                <h3>{destination.nameZh}</h3>
              </div>
              <p>{destination.summaryZh}</p>
              <em>{destination.bestForZh}</em>
            </article>
          ))}
        </div>
      </section>

      <section className="summer-section">
        <div className="results-header">
          <div>
            <h2>酒店 shortlist</h2>
            <p className="summer-section-note">
              排序按“本周末短住 + 全包真实度 + 宝宝避暑 + 自驾距离”综合判断。
            </p>
          </div>
          <span>{balticData.candidates.length} 个候选</span>
        </div>
        <div className="summer-roadtrip-grid">
          {balticData.candidates.map((candidate) => (
            <BalticCandidateCard candidate={candidate} key={candidate.id} />
          ))}
        </div>
      </section>

      <section className="summer-section">
        <div className="results-header">
          <div>
            <h2>常规预订入口</h2>
            <p className="summer-section-note">
              没有合适全包库存时，用这些入口查普通酒店、半膳和可取消房价。
            </p>
          </div>
          <span>{balticData.regularBookingLinks.length} 个入口</span>
        </div>
        <div className="summer-portal-grid">
          {balticData.regularBookingLinks.map((link) => (
            <article className="summer-portal-card" key={link.url}>
              <div className="summer-portal-top">
                <Search size={18} aria-hidden="true" />
                <div>
                  <span>{link.site}</span>
                  <h3>{link.label}</h3>
                </div>
              </div>
              <p>{link.intentZh}</p>
              <em>{link.cautionZh}</em>
              <SourceLink source={{ label: "打开查询", url: link.url, noteZh: link.cautionZh }} primary />
            </article>
          ))}
        </div>
      </section>

      <section className="summer-action-panel">
        <div>
          <div className="summer-section-heading">
            <ListChecks size={18} aria-hidden="true" />
            <h3>我建议现在这样查</h3>
          </div>
          <ol>
            {balticData.actionPlanZh.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
        </div>
        <div>
          <div className="summer-section-heading">
            <CircleAlert size={18} aria-hidden="true" />
            <h3>付款前必须确认</h3>
          </div>
          <ul>
            <li>3 位成年人 + 1 位宝宝是否能住同一房型。</li>
            <li>房间是否有可靠空调，且不是只有公共区域制冷。</li>
            <li>停车费、Kurabgabe / Kurtaxe 和取消期限。</li>
            <li>All Inclusive 的实际时段、饮料范围和儿童设施开放时间。</li>
          </ul>
        </div>
      </section>
    </section>
  );
}

function BalticCandidateCard({ candidate }: { candidate: BalticCandidate }) {
  const cardClass = `summer-roadtrip-card is-${normalizeCardLevel(candidate.fitLevel)}`;
  const mealClass = `summer-meal-chip is-${normalizeMealLevel(candidate.mealPlanLevel)}`;

  return (
    <article className={cardClass}>
      <div className="summer-card-top">
        <div>
          <span className={`summer-fit-chip is-${normalizeCardLevel(candidate.fitLevel)}`}>
            {fitLabels[candidate.fitLevel]}
          </span>
          <h3>{candidate.nameZh}</h3>
          <p>
            {candidate.name} · {candidate.destinationZh}
          </p>
        </div>
        <div className={candidate.fitLevel === "backup" ? "summer-score is-stretch" : "summer-score"}>
          <strong>{candidate.fitScore}</strong>
          <span>{candidate.countryZh}</span>
        </div>
      </div>

      <div className="summer-drive-row">
        <span>
          <Car size={15} aria-hidden="true" />
          {candidate.driveTimeZh}
        </span>
        <span className={mealClass}>
          <Utensils size={15} aria-hidden="true" />
          {mealLabels[candidate.mealPlanLevel]}
        </span>
        <span>
          <MapPinned size={15} aria-hidden="true" />
          {candidate.travelWindowFitZh}
        </span>
      </div>

      <p className="summer-roadtrip-best">{candidate.recommendationZh}</p>

      <div className="summer-fact-grid">
        <Fact icon={<BadgeEuro size={15} />} label={candidate.priceZh} />
        <Fact icon={<Utensils size={15} />} label={candidate.mealPlanZh} />
        <Fact icon={<ThermometerSun size={15} />} label={candidate.coolingZh} />
        <Fact icon={<Baby size={15} />} label={candidate.babyFitZh} />
        <Fact icon={<Waves size={15} />} label={candidate.poolSpaZh} />
        <Fact icon={<CheckCircle2 size={15} />} label={candidate.currentStatusZh} />
      </div>

      <div className="summer-keywords">
        <strong>关键词</strong>
        <div>
          {candidate.tagsZh.map((tag) => (
            <span key={tag}>{tag}</span>
          ))}
        </div>
      </div>

      <div className="summer-list-grid">
        <ListBlock title="为什么适合" items={candidate.reasonsZh} positive />
        <ListBlock title="风险/下单前核实" items={candidate.risksZh} />
      </div>

      <div className="summer-link-block">
        <strong>核查来源</strong>
        <div>
          {candidate.sourceLinks.map((source) => (
            <SourceLink compact key={source.url} source={source} />
          ))}
        </div>
      </div>

      <div className="summer-booking-links">
        {candidate.bookingLinks.map((source, index) => (
          <SourceLink key={source.url} primary={index === 0} source={source} />
        ))}
      </div>
    </article>
  );
}

function normalizeCardLevel(level: BalticFitLevel) {
  if (level === "watch" || level === "backup") return "backup";
  return level;
}

function normalizeMealLevel(level: BalticMealPlanLevel) {
  if (level === "true-ai" || level === "ai-light") return "true-ai";
  if (level === "not-ai") return "half-board-plus";
  return "full-board-plus";
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
  source: BalticSourceLink;
  compact?: boolean;
  primary?: boolean;
}) {
  const className = primary
    ? "primary-link"
    : compact
      ? "summer-source-link is-compact"
      : "summer-source-link";

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

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}
