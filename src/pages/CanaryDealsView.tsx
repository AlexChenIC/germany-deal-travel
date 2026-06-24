import {
  Baby,
  BadgeEuro,
  BedDouble,
  CheckCircle2,
  CircleAlert,
  Compass,
  ExternalLink,
  Filter,
  Hotel,
  ListChecks,
  MapPin,
  Plane,
  Search,
  ShieldCheck,
  Sparkles,
  TicketPercent,
  Waves,
} from "lucide-react";
import { useMemo, useState } from "react";
import { Metric, SelectField } from "../components/Controls";
import canaryDataJson from "../data/canary-all-inclusive-options.json";
import type {
  CanaryAllInclusiveData,
  CanaryEvidenceStatus,
  CanaryFitLevel,
  CanaryIslandId,
  CanarySearchJump,
  CanaryResortOption,
  CanarySourceLink,
} from "../types";

const canaryData = canaryDataJson as CanaryAllInclusiveData;

type CanarySortMode = "fit" | "price" | "transfer";

const islandLabels: Record<CanaryIslandId, string> = {
  "gran-canaria": "大加那利",
  tenerife: "特内里费",
  fuerteventura: "富埃特文图拉",
  lanzarote: "兰萨罗特",
};

export function CanaryDealsView() {
  const [island, setIsland] = useState<CanaryIslandId | "all">("all");
  const [hardFitOnly, setHardFitOnly] = useState(true);
  const [sortMode, setSortMode] = useState<CanarySortMode>("fit");

  const filteredOptions = useMemo(() => {
    return canaryData.items
      .filter((option) => island === "all" || option.island === island)
      .filter((option) => !hardFitOnly || option.fitLevel !== "backup")
      .sort((a, b) => {
        if (sortMode === "price") return a.priceRank - b.priceRank;
        if (sortMode === "transfer") return a.transferMinutes - b.transferMinutes;
        return b.fitScore - a.fitScore;
      });
  }, [hardFitOnly, island, sortMode]);

  const topFitCount = canaryData.items.filter(
    (item) => item.fitLevel === "top" || item.fitLevel === "strong",
  ).length;
  const completeEvidenceCount = canaryData.items.filter((item) =>
    Object.values(item.facilities).every((facility) => facility.status === "confirmed"),
  ).length;
  const directIslandCount = canaryData.flightRoutes.filter(
    (route) => route.directStatus === "confirmed",
  ).length;

  return (
    <section className="canary-page">
      <div className="canary-hero">
        <div>
          <p className="eyebrow">Canary all-inclusive shortlist</p>
          <h2>加纳利群岛全包专题</h2>
          <p>
            面向 {canaryData.partyZh}，筛 2026 年 7/8 月 7 晚左右、柏林直飞、
            全包、宝宝友好、儿童泳池和桑拿/SPA 的可比价候选。
          </p>
        </div>
        <div className="canary-notes">
          {canaryData.assumptionsZh.slice(0, 5).map((assumption) => (
            <span key={assumption}>{assumption}</span>
          ))}
        </div>
      </div>

      <section className="canary-metrics" aria-label="canary shortlist summary">
        <Metric label="酒店候选" value={canaryData.items.length} icon={<Hotel />} />
        <Metric label="高匹配" value={topFitCount} icon={<ShieldCheck />} />
        <Metric label="全证据命中" value={completeEvidenceCount} icon={<CheckCircle2 />} />
        <Metric label="直飞岛屿" value={directIslandCount} icon={<Plane />} />
      </section>

      <section className="canary-takeaways">
        <div className="canary-section-heading">
          <Sparkles size={18} aria-hidden="true" />
          <h3>先看结论</h3>
        </div>
        <div className="canary-takeaway-grid">
          {canaryData.quickTakeawaysZh.map((takeaway) => (
            <span key={takeaway}>{takeaway}</span>
          ))}
        </div>
      </section>

      <section className="canary-section">
        <div className="canary-section-heading">
          <Compass size={18} aria-hidden="true" />
          <h3>家庭出行与查酒店建议</h3>
        </div>
        <div className="canary-advice-grid">
          {canaryData.familyAdviceZh.map((block) => (
            <article className="canary-advice-card" key={block.titleZh}>
              <h4>{block.titleZh}</h4>
              <ul>
                {block.pointsZh.map((point) => (
                  <li key={point}>{point}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>

      <section className="canary-section">
        <div className="results-header">
          <h2>柏林直飞岛屿</h2>
          <span>{canaryData.travelWindowZh}</span>
        </div>
        <div className="canary-route-grid">
          {canaryData.flightRoutes.map((route) => (
            <article className={`canary-route-card is-${route.directStatus}`} key={route.id}>
              <div className="canary-route-top">
                <Plane size={20} aria-hidden="true" />
                <div>
                  <h3>{route.islandZh}</h3>
                  <span>{route.airportCode} · {route.airportName}</span>
                </div>
              </div>
              <div className="canary-chip-row">
                <span className={`canary-status-chip is-${route.directStatus}`}>
                  {route.directStatusZh}
                </span>
                <span>{route.flightTimeZh}</span>
              </div>
              <p>{route.julyAugustNoteZh}</p>
              <div className="canary-link-cluster">
                {route.sources.slice(0, 2).map((source) => (
                  <EvidenceLink key={source.url} source={source} compact />
                ))}
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="canary-toolbar" aria-label="canary filters">
        <SelectField
          icon={<MapPin size={16} />}
          value={island}
          onChange={(value) => setIsland(value as CanaryIslandId | "all")}
          options={[
            ["all", "全部岛屿"],
            ...Object.entries(islandLabels),
          ]}
        />
        <SelectField
          icon={<Filter size={16} />}
          value={sortMode}
          onChange={(value) => setSortMode(value as CanarySortMode)}
          options={[
            ["fit", "按匹配度"],
            ["price", "按价位线索"],
            ["transfer", "按接送时间"],
          ]}
        />
        <button
          className={hardFitOnly ? "toggle is-on" : "toggle"}
          onClick={() => setHardFitOnly((value) => !value)}
          type="button"
        >
          <ShieldCheck size={17} aria-hidden="true" />
          隐藏缺口项
        </button>
      </section>

      <section className="results-header">
        <h2>酒店候选</h2>
        <span>{filteredOptions.length} 条</span>
      </section>

      <section className="canary-card-grid">
        {filteredOptions.map((option, index) => (
          <CanaryOptionCard key={option.id} option={option} rank={index + 1} />
        ))}
      </section>

      <section className="canary-section">
        <div className="results-header">
          <h2>我会优先点开的高质量预订链接</h2>
          <span>{canaryData.curatedBookingLinks.length} 个</span>
        </div>
        <div className="canary-curated-grid">
          {canaryData.curatedBookingLinks.map((link) => (
            <article className="canary-curated-card" key={link.url}>
              <div>
                <span>{link.site}</span>
                <h3>{link.label}</h3>
                {link.hotelNameZh && <strong>{link.hotelNameZh}</strong>}
              </div>
              <p>{link.reasonZh}</p>
              <small>{link.fitZh}</small>
              <em>{link.cautionZh}</em>
              <a className="text-link" href={link.url} target="_blank" rel="noreferrer">
                打开预订页
                <ExternalLink size={14} aria-hidden="true" />
              </a>
            </article>
          ))}
        </div>
      </section>

      {filteredOptions.length === 0 && (
        <div className="empty-state">
          <Search size={28} aria-hidden="true" />
          <p>当前筛选没有结果</p>
        </div>
      )}

      <section className="canary-section">
        <div className="results-header">
          <h2>直接跳去看全量酒店选择</h2>
          <span>{canaryData.searchJumpLinks.length} 个</span>
        </div>
        <div className="canary-jump-grid">
          {canaryData.searchJumpLinks.map((jump) => (
            <SearchJumpCard key={jump.url} jump={jump} />
          ))}
        </div>
      </section>

      <section className="canary-checklist">
        <div className="canary-section-heading">
          <ListChecks size={18} aria-hidden="true" />
          <h3>下单前 6 项核对</h3>
        </div>
        <ol>
          <li>搜索条件设为 BER、Direktflug、7 Nächte、All Inclusive、3 Erwachsene、Baby 0 Jahre。</li>
          <li>报价详情里确认 Flug、Hotel、Transfer、Aufgabegepäck 是否都包含。</li>
          <li>房型必须能容纳 3 成人 + 婴儿床；不行就改 2 间相邻/连通房。</li>
          <li>邮件确认 Babybett、Hochstuhl、Wasserkocher、Mikrowelle/Bottle warmer。</li>
          <li>确认桑拿/SPA 是否开放、是否 16+、是否另收费。</li>
          <li>看最近 60 天评价里的空调、餐饮排队、泳池拥挤和儿童设施维修情况。</li>
        </ol>
      </section>
    </section>
  );
}

function SearchJumpCard({ jump }: { jump: CanarySearchJump }) {
  return (
    <article className="canary-jump-card">
      <div className="canary-jump-top">
        <TicketPercent size={18} aria-hidden="true" />
        <div>
          <span>{jump.site}</span>
          <h3>{jump.label}</h3>
        </div>
      </div>
      <p>{jump.intentZh}</p>
      <div className="canary-jump-columns">
        <div>
          <strong>链接已尽量带好</strong>
          <ul>
            {jump.prefilledZh.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
        <div>
          <strong>跳出后手动确认</strong>
          <ul>
            {jump.setManuallyZh.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      </div>
      <a className="primary-link" href={jump.url} target="_blank" rel="noreferrer">
        去看全量选择
        <ExternalLink size={16} aria-hidden="true" />
      </a>
    </article>
  );
}

function CanaryOptionCard({
  option,
  rank,
}: {
  option: CanaryResortOption;
  rank: number;
}) {
  return (
    <article className={`canary-card is-${option.fitLevel}`}>
      <div className="canary-card-top">
        <div>
          <div className="card-meta">
            <span>{option.islandZh}</span>
            <span>{option.resortArea}</span>
          </div>
          <h3>{option.nameZh}</h3>
          <p className="original-title">{option.name}</p>
        </div>
        <div className="canary-rank">
          <strong>{rank}</strong>
          <span>{fitLevelLabel(option.fitLevel)}</span>
        </div>
      </div>

      <p className="canary-card-summary">{option.bestForZh}</p>

      <div className="canary-fact-strip">
        <span>
          <Plane size={14} aria-hidden="true" />
          {option.airportCode} · {option.transferMinutes} 分钟接送
        </span>
        <span>
          <BadgeEuro size={14} aria-hidden="true" />
          {option.priceBandZh}
        </span>
        <span>
          <ShieldCheck size={14} aria-hidden="true" />
          匹配分 {option.fitScore}
        </span>
      </div>

      <div className="canary-facility-grid">
        <FacilitySignal icon={<BadgeEuro size={17} />} signal={option.facilities.allInclusive} />
        <FacilitySignal icon={<Baby size={17} />} signal={option.facilities.babyReady} />
        <FacilitySignal icon={<Waves size={17} />} signal={option.facilities.kidsPool} />
        <FacilitySignal icon={<Sparkles size={17} />} signal={option.facilities.saunaSpa} />
      </div>

      <div className="canary-detail-grid">
        <div className="canary-detail-block">
          <div className="canary-section-heading compact">
            <BedDouble size={17} aria-hidden="true" />
            <strong>房型策略</strong>
          </div>
          <p>{option.roomPlanZh}</p>
        </div>
        <div className="canary-detail-block">
          <div className="canary-section-heading compact">
            <Baby size={17} aria-hidden="true" />
            <strong>11 个月宝宝</strong>
          </div>
          <p>{option.babyFitZh}</p>
        </div>
      </div>

      <div className="canary-detail-block">
        <div className="canary-section-heading compact">
          <BadgeEuro size={17} aria-hidden="true" />
          <strong>7/8 月价格线索</strong>
        </div>
        <div className="canary-price-list">
          {option.priceHints.map((hint) => (
            <div key={`${hint.sourceName}-${hint.labelZh}`}>
              <strong>{hint.monthZh}</strong>
              <span>{hint.labelZh}</span>
              <a href={hint.sourceUrl} target="_blank" rel="noreferrer">
                {hint.sourceName}
                <ExternalLink size={13} aria-hidden="true" />
              </a>
              <small>{hint.noteZh}</small>
            </div>
          ))}
        </div>
      </div>

      <div className="heat-list-grid">
        <CanaryTextList title="适合点" tone="pro" items={option.prosZh} />
        <CanaryTextList title="风险/二查" tone="risk" items={option.risksZh} />
      </div>

      <div className="canary-evidence-block">
        <strong>资料源</strong>
        <div>
          {option.sourceLinks.slice(0, 4).map((source) => (
            <EvidenceLink key={source.url} source={source} compact />
          ))}
        </div>
      </div>

      <div className="link-row canary-card-links">
        {option.bookingLinks.slice(0, 3).map((link, index) => (
          <a
            className={index === 0 ? "primary-link" : "text-link map-link"}
            href={link.url}
            key={link.url}
            target="_blank"
            rel="noreferrer"
            title={link.noteZh}
          >
            {link.label}
            <ExternalLink size={index === 0 ? 16 : 14} aria-hidden="true" />
          </a>
        ))}
      </div>
      <span className="heat-checked">核验日期：{option.checkedAt}</span>
    </article>
  );
}

function FacilitySignal({
  signal,
  icon,
}: {
  signal: { status: CanaryEvidenceStatus; labelZh: string; detailZh: string };
  icon: React.ReactElement;
}) {
  const statusIcon =
    signal.status === "confirmed" ? (
      <CheckCircle2 size={15} aria-hidden="true" />
    ) : signal.status === "missing" ? (
      <CircleAlert size={15} aria-hidden="true" />
    ) : (
      <Search size={15} aria-hidden="true" />
    );

  return (
    <div className={`canary-facility is-${signal.status}`}>
      <div className="canary-facility-head">
        {icon}
        <strong>{signal.labelZh}</strong>
        {statusIcon}
      </div>
      <p>{signal.detailZh}</p>
    </div>
  );
}

function CanaryTextList({
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

function EvidenceLink({
  source,
  compact,
}: {
  source: CanarySourceLink;
  compact?: boolean;
}) {
  return (
    <a
      className={compact ? "canary-evidence-link is-compact" : "canary-evidence-link"}
      href={source.url}
      target="_blank"
      rel="noreferrer"
      title={source.noteZh}
    >
      {source.label}
      <ExternalLink size={13} aria-hidden="true" />
    </a>
  );
}

function fitLevelLabel(level: CanaryFitLevel) {
  if (level === "top") return "首选";
  if (level === "strong") return "强候选";
  if (level === "check") return "需二查";
  return "备选";
}
