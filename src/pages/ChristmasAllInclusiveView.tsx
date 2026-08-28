import {
  Baby,
  BadgeEuro,
  CalendarDays,
  CheckCircle2,
  CircleAlert,
  ExternalLink,
  Hotel,
  Plane,
  Search,
  ShieldCheck,
  ThermometerSun,
  Utensils,
  Waves
} from "lucide-react";
import { useMemo, useState } from "react";

import { Metric, SelectField } from "../components/Controls";
import christmasDataJson from "../data/christmas-all-inclusive-2026.json";

type DestinationId = "red-sea" | "canary" | "mallorca";
type FitLevel = "top" | "strong" | "check" | "backup";

interface SourceLink {
  label: string;
  url: string;
  noteZh: string;
}

interface DestinationRanking {
  id: DestinationId;
  nameZh: string;
  fitLevel: FitLevel;
  fitScore: number;
  climateZh: string;
  flightZh: string;
  allInclusiveZh: string;
  familyFitZh: string;
  risksZh: string[];
  sourceLinks: SourceLink[];
}

interface CandidateHotel {
  id: string;
  destinationId: DestinationId;
  destinationZh: string;
  name: string;
  nameZh: string;
  fitLevel: FitLevel;
  fitScore: number;
  bestForZh: string;
  roomStrategyZh: string;
  childFitZh: string;
  mealPlanZh: string;
  poolSpaZh: string;
  flightTransferZh: string;
  priceSignalZh: string;
  evidenceStatus: string;
  prosZh: string[];
  risksZh: string[];
  sourceLinks: SourceLink[];
  bookingLinks: SourceLink[];
  checkedAt: string;
}

interface DealSignal {
  id: string;
  destinationId: DestinationId;
  titleZh: string;
  provider: string;
  dateWindowZh: string;
  boardZh: string;
  departureZh: string;
  priceHintZh: string;
  evidenceZh: string;
  fitLevel: FitLevel;
  source: SourceLink;
}

interface SearchPortal {
  name: string;
  url: string;
  bestUseZh: string;
  defaultFiltersZh: string;
}

interface ChristmasAllInclusiveData {
  updatedAt: string;
  partyZh: string;
  travelWindowZh: string;
  stayLengthZh: string;
  verdictZh: string;
  assumptionsZh: string[];
  quickTakeawaysZh: string[];
  destinationRanking: DestinationRanking[];
  candidateHotels: CandidateHotel[];
  dealSignals: DealSignal[];
  searchPortals: SearchPortal[];
  decisionChecklistZh: string[];
}

const christmasData = christmasDataJson as ChristmasAllInclusiveData;

const fitLabel: Record<FitLevel, string> = {
  top: "首选",
  strong: "强候选",
  check: "需二查",
  backup: "备选"
};

const destinationShortLabel: Record<DestinationId, string> = {
  "red-sea": "红海",
  canary: "加纳利",
  mallorca: "马略卡"
};

const destinationOptions: Array<[string, string]> = [
  ["all", "全部目的地"],
  ["red-sea", "红海 / Hurghada"],
  ["canary", "加纳利群岛"],
  ["mallorca", "马略卡"]
];

function toneClass(fitLevel: FitLevel): string {
  if (fitLevel === "top") return "is-top";
  if (fitLevel === "strong") return "is-strong";
  if (fitLevel === "check") return "is-value";
  return "is-backup";
}

function SourceLinks({ links }: { links: SourceLink[] }) {
  if (!links.length) return null;

  return (
    <div className="summer-link-block">
      {links.map((link) => (
        <a key={`${link.label}-${link.url}`} href={link.url} target="_blank" rel="noreferrer">
          <ExternalLink size={15} />
          <span>{link.label}</span>
        </a>
      ))}
    </div>
  );
}

function BulletList({ items, icon = "check" }: { items: string[]; icon?: "check" | "alert" }) {
  return (
    <ul className="summer-clean-list">
      {items.map((item) => (
        <li key={item}>
          {icon === "check" ? <CheckCircle2 size={16} /> : <CircleAlert size={16} />}
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

function DestinationCard({ destination }: { destination: DestinationRanking }) {
  return (
    <article className={`summer-destination-card ${toneClass(destination.fitLevel)}`}>
      <div className="summer-card-top">
        <div>
          <p className="summer-eyebrow">{destinationShortLabel[destination.id]}</p>
          <h3>{destination.nameZh}</h3>
        </div>
        <span className="summer-score">{destination.fitScore}</span>
      </div>
      <div className="summer-list-grid">
        <p>
          <ThermometerSun size={16} />
          <span>{destination.climateZh}</span>
        </p>
        <p>
          <Plane size={16} />
          <span>{destination.flightZh}</span>
        </p>
        <p>
          <Utensils size={16} />
          <span>{destination.allInclusiveZh}</span>
        </p>
        <p>
          <Baby size={16} />
          <span>{destination.familyFitZh}</span>
        </p>
      </div>
      <div className="summer-warning-block">
        <strong>主要风险</strong>
        <BulletList items={destination.risksZh} icon="alert" />
      </div>
      <SourceLinks links={destination.sourceLinks} />
    </article>
  );
}

function CandidateCard({ candidate }: { candidate: CandidateHotel }) {
  return (
    <article className={`summer-roadtrip-card ${toneClass(candidate.fitLevel)}`}>
      <div className="summer-card-top">
        <div>
          <p className="summer-eyebrow">{candidate.destinationZh}</p>
          <h3>{candidate.nameZh}</h3>
        </div>
        <span className="summer-fit-chip">{fitLabel[candidate.fitLevel]}</span>
      </div>
      <p className="summer-card-lede">{candidate.bestForZh}</p>
      <div className="summer-fact-grid">
        <p>
          <Hotel size={16} />
          <span>{candidate.roomStrategyZh}</span>
        </p>
        <p>
          <Baby size={16} />
          <span>{candidate.childFitZh}</span>
        </p>
        <p>
          <Utensils size={16} />
          <span>{candidate.mealPlanZh}</span>
        </p>
        <p>
          <Waves size={16} />
          <span>{candidate.poolSpaZh}</span>
        </p>
        <p>
          <Plane size={16} />
          <span>{candidate.flightTransferZh}</span>
        </p>
        <p>
          <BadgeEuro size={16} />
          <span>{candidate.priceSignalZh}</span>
        </p>
      </div>
      <div className="summer-two-column">
        <div>
          <h4>优点</h4>
          <BulletList items={candidate.prosZh} />
        </div>
        <div>
          <h4>下单前确认</h4>
          <BulletList items={candidate.risksZh} icon="alert" />
        </div>
      </div>
      <div className="summer-booking-links">
        <SourceLinks links={candidate.sourceLinks} />
        <SourceLinks links={candidate.bookingLinks} />
      </div>
    </article>
  );
}

function DealSignalCard({ signal }: { signal: DealSignal }) {
  return (
    <article className={`summer-portal-card ${toneClass(signal.fitLevel)}`}>
      <div className="summer-card-top">
        <div>
          <p className="summer-eyebrow">{signal.provider}</p>
          <h3>{signal.titleZh}</h3>
        </div>
        <span className="summer-fit-chip">{fitLabel[signal.fitLevel]}</span>
      </div>
      <div className="summer-fact-grid is-compact">
        <p>
          <CalendarDays size={16} />
          <span>{signal.dateWindowZh}</span>
        </p>
        <p>
          <Plane size={16} />
          <span>{signal.departureZh}</span>
        </p>
        <p>
          <Utensils size={16} />
          <span>{signal.boardZh}</span>
        </p>
        <p>
          <BadgeEuro size={16} />
          <span>{signal.priceHintZh}</span>
        </p>
      </div>
      <p>{signal.evidenceZh}</p>
      <SourceLinks links={[signal.source]} />
    </article>
  );
}

function SearchPortalCard({ portal }: { portal: SearchPortal }) {
  return (
    <article className="summer-portal-card">
      <div className="summer-card-top">
        <div>
          <p className="summer-eyebrow">检索入口</p>
          <h3>{portal.name}</h3>
        </div>
        <Search size={18} />
      </div>
      <p>{portal.bestUseZh}</p>
      <div className="summer-warning-block">
        <strong>建议默认筛选</strong>
        <p>{portal.defaultFiltersZh}</p>
      </div>
      <SourceLinks links={[{ label: portal.name, url: portal.url, noteZh: portal.bestUseZh }]} />
    </article>
  );
}

export function ChristmasAllInclusiveView() {
  const [destinationFilter, setDestinationFilter] = useState<DestinationId | "all">("all");

  const filteredCandidates = useMemo(() => {
    return christmasData.candidateHotels
      .filter((candidate) => destinationFilter === "all" || candidate.destinationId === destinationFilter)
      .sort((a, b) => b.fitScore - a.fitScore);
  }, [destinationFilter]);

  const filteredDealSignals = useMemo(() => {
    return christmasData.dealSignals.filter(
      (signal) => destinationFilter === "all" || signal.destinationId === destinationFilter
    );
  }, [destinationFilter]);

  const topCandidateCount = christmasData.candidateHotels.filter((candidate) => candidate.fitLevel === "top").length;

  return (
    <main className="summer-page">
      <section className="summer-hero">
        <div>
          <p className="summer-eyebrow">新任务 · 圣诞全包旅行</p>
          <h1>2026年圣诞全包度假候选池</h1>
          <p>{christmasData.verdictZh}</p>
          <div className="summer-verdict">
            <ShieldCheck size={18} />
            <span>
              当前结论：先查红海和加纳利；马略卡只作为短飞备选。所有报价在下单前都要按家庭人数和婴儿年龄复核。
            </span>
          </div>
        </div>
        <div className="summer-metrics">
          <Metric label="出行窗口" value={christmasData.travelWindowZh} icon={<CalendarDays />} />
          <Metric label="家庭配置" value={christmasData.partyZh} icon={<Baby />} />
          <Metric label="候选酒店" value={`${christmasData.candidateHotels.length}个`} icon={<Hotel />} />
          <Metric label="首选候选" value={`${topCandidateCount}个`} icon={<ShieldCheck />} />
        </div>
      </section>

      <section className="summer-section">
        <div className="summer-section-heading">
          <div>
            <p className="summer-eyebrow">第一轮判断</p>
            <h2>适合度排序</h2>
          </div>
        </div>
        <div className="summer-takeaway-grid">
          {christmasData.quickTakeawaysZh.map((takeaway) => (
            <div key={takeaway} className="summer-takeaway-card">
              <CheckCircle2 size={18} />
              <p>{takeaway}</p>
            </div>
          ))}
        </div>
        <div className="summer-destination-grid">
          {christmasData.destinationRanking.map((destination) => (
            <DestinationCard key={destination.id} destination={destination} />
          ))}
        </div>
      </section>

      <section className="summer-section">
        <div className="summer-section-heading">
          <div>
            <p className="summer-eyebrow">酒店池</p>
            <h2>优先核价的酒店/度假村</h2>
          </div>
          <SelectField
            icon={<Search size={16} />}
            value={destinationFilter}
            onChange={(value) => setDestinationFilter(value as DestinationId | "all")}
            options={destinationOptions}
          />
        </div>
        <div className="summer-roadtrip-grid">
          {filteredCandidates.map((candidate) => (
            <CandidateCard key={candidate.id} candidate={candidate} />
          ))}
        </div>
      </section>

      <section className="summer-section">
        <div className="summer-section-heading">
          <div>
            <p className="summer-eyebrow">价格线索</p>
            <h2>已看到的公开报价信号</h2>
          </div>
        </div>
        <div className="summer-portal-grid">
          {filteredDealSignals.map((signal) => (
            <DealSignalCard key={signal.id} signal={signal} />
          ))}
        </div>
      </section>

      <section className="summer-section">
        <div className="summer-section-heading">
          <div>
            <p className="summer-eyebrow">下一步</p>
            <h2>检索入口和下单检查</h2>
          </div>
        </div>
        <div className="summer-portal-grid">
          {christmasData.searchPortals.map((portal) => (
            <SearchPortalCard key={portal.name} portal={portal} />
          ))}
        </div>
        <div className="summer-action-panel">
          <div>
            <p className="summer-eyebrow">下单前清单</p>
            <h3>需要逐项确认</h3>
          </div>
          <BulletList items={christmasData.decisionChecklistZh} />
        </div>
        <p className="summer-source-note">
          更新日期：{christmasData.updatedAt}。价格和库存是动态信息，本页用于启动任务和缩小候选范围。
        </p>
      </section>
    </main>
  );
}
