import {
  Baby,
  BadgeEuro,
  BedDouble,
  Car,
  CheckCircle2,
  CircleAlert,
  Compass,
  ExternalLink,
  Hotel,
  MapPinned,
  Route,
  ShieldCheck,
  Sparkles,
  Utensils,
  Waves,
} from "lucide-react";
import type { ReactNode } from "react";
import { Metric } from "../components/Controls";
import alpineDataJson from "../data/alpine-border-family-plan.json";
import type {
  AlpineAreaAlternative,
  AlpineBorderPlanData,
  AlpineDayPlan,
  AlpineDriveLeg,
  AlpineHotelFitLevel,
  AlpineHotelOption,
  AlpineSourceLink,
} from "../types";

const alpineData = alpineDataJson as AlpineBorderPlanData;

const fitLabels: Record<AlpineHotelFitLevel, string> = {
  best: "默认推荐",
  strong: "强备选",
  backup: "备选",
};

const directionLabels: Record<AlpineDriveLeg["direction"], string> = {
  outbound: "去程",
  return: "返程",
  local: "当地",
};

export function AlpineBorderPlanView() {
  const topHotel = alpineData.hotelOptions.find((hotel) => hotel.fitLevel === "best");
  const outboundLegs = alpineData.drivePlan.filter((leg) => leg.direction === "outbound").length;
  const returnLegs = alpineData.drivePlan.filter((leg) => leg.direction === "return").length;

  return (
    <section className="alpine-page">
      <div className="alpine-hero">
        <div>
          <p className="eyebrow">Vorarlberg family mountain plan</p>
          <h2>三国边境山区度假方案</h2>
          <p>{alpineData.partyZh}</p>
        </div>
        <div className="alpine-verdict">
          <Sparkles size={18} aria-hidden="true" />
          <strong>我的建议</strong>
          <p>{alpineData.verdictZh}</p>
          {topHotel && <span>首选：{topHotel.nameZh}</span>}
        </div>
      </div>

      <section className="alpine-metrics" aria-label="alpine plan summary">
        <Metric label="目标酒店" value={alpineData.hotelOptions.length} icon={<Hotel />} />
        <Metric label="首选评分" value={topHotel?.fitScore ?? "-"} icon={<CheckCircle2 />} />
        <Metric label="去程驾驶日" value={outboundLegs} icon={<Car />} />
        <Metric label="返程驾驶日" value={returnLegs} icon={<Route />} />
        <Metric label="当地玩法日" value={alpineData.dayPlans.length} icon={<MapPinned />} />
        <Metric label="区域备选" value={alpineData.areaAlternatives.length} icon={<Compass />} />
      </section>

      <section className="alpine-section">
        <div className="alpine-section-heading">
          <ShieldCheck size={18} aria-hidden="true" />
          <h3>先看结论</h3>
        </div>
        <div className="alpine-takeaway-grid">
          {alpineData.quickTakeawaysZh.map((takeaway) => (
            <span key={takeaway}>{takeaway}</span>
          ))}
        </div>
      </section>

      <section className="alpine-section">
        <div className="results-header">
          <h2>两个目标酒店怎么选</h2>
          <span>{alpineData.travelWindowZh}</span>
        </div>
        <div className="alpine-hotel-grid">
          {alpineData.hotelOptions.map((hotel) => (
            <HotelCard key={hotel.id} hotel={hotel} />
          ))}
        </div>
      </section>

      <section className="alpine-section">
        <div className="results-header">
          <h2>区域备选快速筛选</h2>
          <span>只保留和你们需求有关的判断</span>
        </div>
        <div className="alpine-alt-grid">
          {alpineData.areaAlternatives.map((alternative) => (
            <AlternativeCard key={alternative.id} alternative={alternative} />
          ))}
        </div>
      </section>

      <section className="alpine-section">
        <div className="results-header">
          <h2>自驾拆分方案</h2>
          <span>{alpineData.driveRuleZh}</span>
        </div>
        <div className="alpine-drive-grid">
          {alpineData.drivePlan.map((leg) => (
            <DriveLegCard key={leg.id} leg={leg} />
          ))}
        </div>
      </section>

      <section className="alpine-section">
        <div className="results-header">
          <h2>当地 7 天玩法</h2>
          <span>一天一个主活动，下午留给午睡和恢复</span>
        </div>
        <div className="alpine-day-grid">
          {alpineData.dayPlans.map((day) => (
            <DayPlanCard key={day.id} day={day} />
          ))}
        </div>
      </section>

      <section className="alpine-action-panel">
        <ChecklistBlock
          icon={<BedDouble size={18} aria-hidden="true" />}
          title="预订前必须确认"
          items={alpineData.bookingChecklistZh}
        />
        <ChecklistBlock
          icon={<Baby size={18} aria-hidden="true" />}
          title="带宝宝打包"
          items={alpineData.packingNotesZh}
        />
      </section>

      <section className="alpine-action-panel is-muted">
        <ChecklistBlock
          icon={<BadgeEuro size={18} aria-hidden="true" />}
          title="预算口径"
          items={alpineData.costNotesZh}
        />
        <ChecklistBlock
          icon={<CircleAlert size={18} aria-hidden="true" />}
          title="信息使用提醒"
          items={alpineData.sourceNotesZh}
        />
      </section>
    </section>
  );
}

function HotelCard({ hotel }: { hotel: AlpineHotelOption }) {
  return (
    <article className={`alpine-hotel-card is-${hotel.fitLevel}`}>
      <img src={hotel.imageUrl} alt="" loading="lazy" />
      <div className="alpine-card-body">
        <div className="alpine-card-top">
          <span className={`alpine-fit-chip is-${hotel.fitLevel}`}>
            {hotel.rank}. {fitLabels[hotel.fitLevel]}
          </span>
          <strong>{hotel.fitScore}/100</strong>
        </div>
        <h3>{hotel.nameZh}</h3>
        <p className="alpine-location">{hotel.locationZh}</p>
        <p>{hotel.decisionZh}</p>

        <div className="alpine-fact-grid">
          <Fact icon={<BedDouble />} label="房型" value={hotel.roomFitZh} />
          <Fact icon={<Utensils />} label="餐食" value={hotel.mealPlanZh} />
          <Fact icon={<Waves />} label="泳池/SPA" value={hotel.wellnessZh} />
          <Fact icon={<Baby />} label="宝宝友好" value={hotel.babyFitZh} />
        </div>

        <div className="alpine-signal-box">
          <strong>折扣信号</strong>
          <p>{hotel.discountSignalZh}</p>
        </div>
        <div className="alpine-signal-box is-soft">
          <strong>区域卡</strong>
          <p>{hotel.guestCardZh}</p>
        </div>

        <div className="alpine-list-pair">
          <ListBlock title="优点" items={hotel.prosZh} positive />
          <ListBlock title="风险" items={hotel.risksZh} />
        </div>

        <ListBlock title="下单前查" items={hotel.bookingChecksZh} />

        <div className="alpine-link-row">
          {hotel.evidence.map((source) => (
            <SourceLink key={source.url} source={source} compact />
          ))}
        </div>
        <div className="alpine-link-row">
          {hotel.bookingLinks.map((source) => (
            <SourceLink key={source.url} source={source} primary />
          ))}
        </div>
      </div>
    </article>
  );
}

function AlternativeCard({ alternative }: { alternative: AlpineAreaAlternative }) {
  return (
    <article className="alpine-alt-card">
      <span>{alternative.locationZh}</span>
      <h3>{alternative.nameZh}</h3>
      <p>{alternative.priceSignalZh}</p>
      <strong>{alternative.fitZh}</strong>
      <em>{alternative.cautionZh}</em>
      <div className="alpine-link-row">
        {alternative.sourceLinks.map((source) => (
          <SourceLink key={source.url} source={source} compact />
        ))}
      </div>
    </article>
  );
}

function DriveLegCard({ leg }: { leg: AlpineDriveLeg }) {
  return (
    <article className={`alpine-drive-card is-${leg.direction}`}>
      <div className="alpine-card-top">
        <span className={`alpine-fit-chip is-${leg.direction}`}>
          {directionLabels[leg.direction]}
        </span>
        <strong>{leg.dayZh}</strong>
      </div>
      <h3>
        {leg.fromZh}
        {" -> "}
        {leg.toZh}
      </h3>
      <div className="alpine-drive-meta">
        <span>
          <Car size={15} aria-hidden="true" />
          {leg.driveTimeZh}
        </span>
        <span>{leg.distanceKm} km</span>
      </div>
      <p>{leg.routeZh}</p>
      <div className="alpine-stop-list">
        {leg.stopIdeasZh.map((stop) => (
          <span key={stop}>{stop}</span>
        ))}
      </div>
      <div className="alpine-note-box">
        <Baby size={16} aria-hidden="true" />
        <p>{leg.babyNotesZh}</p>
      </div>
      <div className="alpine-note-box is-overnight">
        <Hotel size={16} aria-hidden="true" />
        <p>{leg.overnightZh}</p>
      </div>
      <div className="alpine-link-row">
        {leg.sourceLinks.map((source) => (
          <SourceLink key={source.url} source={source} compact />
        ))}
      </div>
    </article>
  );
}

function DayPlanCard({ day }: { day: AlpineDayPlan }) {
  return (
    <article className="alpine-day-card">
      <div className="alpine-card-top">
        <span>{day.dayZh}</span>
        <strong>{day.paceZh}</strong>
      </div>
      <h3>{day.titleZh}</h3>
      <p className="alpine-location">{day.baseZh}</p>
      <ol>
        {day.planZh.map((step) => (
          <li key={step}>{step}</li>
        ))}
      </ol>
      <div className="alpine-note-box">
        <Baby size={16} aria-hidden="true" />
        <p>{day.babyNotesZh}</p>
      </div>
      <div className="alpine-note-box is-weather">
        <CircleAlert size={16} aria-hidden="true" />
        <p>{day.badWeatherZh}</p>
      </div>
      <div className="alpine-link-row">
        {day.sourceLinks.map((source) => (
          <SourceLink key={source.url} source={source} compact />
        ))}
      </div>
    </article>
  );
}

function Fact({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="alpine-fact">
      <span>
        {icon}
        {label}
      </span>
      <p>{value}</p>
    </div>
  );
}

function ChecklistBlock({
  icon,
  title,
  items,
}: {
  icon: ReactNode;
  title: string;
  items: string[];
}) {
  return (
    <div>
      <div className="alpine-section-heading">
        {icon}
        <h3>{title}</h3>
      </div>
      <ul>
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
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
    <div className={positive ? "alpine-list-block is-positive" : "alpine-list-block"}>
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
  source: AlpineSourceLink;
  compact?: boolean;
  primary?: boolean;
}) {
  const className = primary
    ? "primary-link"
    : compact
      ? "alpine-source-link is-compact"
      : "alpine-source-link";

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
