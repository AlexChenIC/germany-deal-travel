import {
  Baby,
  BadgeEuro,
  Bus,
  CalendarDays,
  Car,
  CheckCircle2,
  CircleAlert,
  Clock3,
  ExternalLink,
  Hotel,
  ListChecks,
  MapPinned,
  Plane,
  ShieldCheck,
  Sparkles,
  Train,
  Utensils,
  Waves,
} from "lucide-react";
import type { ReactNode } from "react";
import { Metric } from "../components/Controls";
import budapestReturnDataJson from "../data/budapest-ningbo-return-plan.json";

interface SourceLinkData {
  label: string;
  url: string;
  noteZh: string;
}

interface RecommendedItinerary {
  id: string;
  nameZh: string;
  fitScore: number;
  datesZh: string;
  whoShouldPickZh: string;
  dayPlanZh: string[];
  hotelPairingZh: string;
  risksZh: string[];
}

interface TransportOption {
  id: string;
  modeZh: string;
  rank: number;
  headlineZh: string;
  durationZh: string;
  priceZh: string;
  babyFitZh: string;
  prosZh: string[];
  consZh: string[];
  recommendationZh: string;
  sourceLinks: SourceLinkData[];
}

interface BudapestHotelOption {
  id: string;
  name: string;
  nameZh: string;
  rank: number;
  fitScore: number;
  boardLevel: string;
  boardZh: string;
  locationFitZh: string;
  babyFitZh: string;
  poolSpaZh: string;
  cityTourFitZh: string;
  recommendationZh: string;
  prosZh: string[];
  risksZh: string[];
  sourceLinks: SourceLinkData[];
  bookingLinks: SourceLinkData[];
}

interface BookingLink {
  site: string;
  label: string;
  url: string;
  intentZh: string;
}

interface DateCandidate {
  id: string;
  dateZh: string;
  weekdayZh: string;
  arrivalZh: string;
  score: number;
  verdictZh: string;
  vaccineBufferZh: string;
  schoolFitZh: string;
  ningboClimateZh: string;
  recommendationZh: string;
  risksZh: string[];
}

interface BudapestReturnData {
  updatedAt: string;
  timezone: string;
  partyZh: string;
  targetWindowZh: string;
  verdictZh: string;
  quickTakeawaysZh: string[];
  dateOptimization: {
    recommendationZh: string;
    healthAssumptionZh: string;
    schoolConstraintZh: string;
    climateSummaryZh: string;
    dateCandidates: DateCandidate[];
    sourceLinks: SourceLinkData[];
  };
  flightPlan: {
    routeZh: string;
    operatorZh: string;
    aircraftZh: string;
    scheduleZh: string;
    terminalZh: string;
    riskZh: string;
    sourceLinks: SourceLinkData[];
  };
  recommendedItineraries: RecommendedItinerary[];
  transportOptions: TransportOption[];
  hotelOptions: BudapestHotelOption[];
  airportConnection: {
    recommendedZh: string;
    publicTransportZh: string;
    taxiZh: string;
    airportTimingZh: string;
    sourceLinks: SourceLinkData[];
  };
  cityPacingZh: string[];
  bookingChecklistZh: string[];
  bookingLinks: BookingLink[];
}

const budapestReturnData = budapestReturnDataJson as BudapestReturnData;

const transportIcons: Record<string, ReactNode> = {
  "ber-bud-flight": <Plane size={15} />,
  "ber-bud-train": <Train size={15} />,
  "ber-bud-coach": <Bus size={15} />,
  "ber-bud-car": <Car size={15} />,
};

export function BudapestNingboReturnView() {
  const halfBoardHotels = budapestReturnData.hotelOptions.filter((hotel) =>
    /half|full|board/i.test(hotel.boardLevel),
  ).length;
  const topItinerary = budapestReturnData.recommendedItineraries[0];
  const recommendedTransport = budapestReturnData.transportOptions[0];
  const topDate = budapestReturnData.dateOptimization.dateCandidates[2];

  return (
    <section className="summer-page budapest-return-page">
      <div className="summer-hero">
        <div>
          <p className="eyebrow">Budapest to Ningbo return plan</p>
          <h2>柏林 - 布达佩斯 - 宁波回国线</h2>
          <p>
            面向 {budapestReturnData.partyZh}，按 {budapestReturnData.targetWindowZh}
            规划交通、半膳/全膳酒店和 BUD 直飞宁波衔接。
          </p>
        </div>
        <div className="summer-verdict">
          <Sparkles size={18} aria-hidden="true" />
          <strong>当前建议</strong>
          <p>{budapestReturnData.verdictZh}</p>
          <span>更新时间：{formatDateTime(budapestReturnData.updatedAt)}</span>
        </div>
      </div>

      <section className="summer-metrics" aria-label="budapest return plan summary">
        <Metric label="主计划日期" value="09/17" icon={<CalendarDays />} />
        <Metric label="直飞频率" value="周一/四" icon={<Plane />} />
        <Metric label="宁波均温" value="27-28°C" icon={<CircleAlert />} />
        <Metric label="酒店候选" value={budapestReturnData.hotelOptions.length} icon={<Hotel />} />
        <Metric label="含早晚餐" value={halfBoardHotels} icon={<Utensils />} />
      </section>

      <section className="summer-section">
        <div className="summer-section-heading">
          <CheckCircle2 size={18} aria-hidden="true" />
          <h3>先看结论</h3>
        </div>
        <div className="summer-takeaway-grid">
          {budapestReturnData.quickTakeawaysZh.map((takeaway) => (
            <span key={takeaway}>{takeaway}</span>
          ))}
        </div>
      </section>

      <section className="summer-section">
        <div className="results-header">
          <div>
            <h2>9 月回国日期选择</h2>
            <p className="summer-section-note">
              按健康缓冲、学校注册和宁波 9 月气候，把几个周一/周四直飞日放在一起比较。
            </p>
          </div>
          <span>{topDate.dateZh} {topDate.weekdayZh}</span>
        </div>
        <article className="summer-action-panel">
          <div>
            <div className="summer-section-heading">
              <Sparkles size={18} aria-hidden="true" />
              <h3>{budapestReturnData.dateOptimization.recommendationZh}</h3>
            </div>
            <div className="summer-list-block is-positive">
              <ul>
                <li>{budapestReturnData.dateOptimization.healthAssumptionZh}</li>
                <li>{budapestReturnData.dateOptimization.schoolConstraintZh}</li>
                <li>{budapestReturnData.dateOptimization.climateSummaryZh}</li>
              </ul>
            </div>
          </div>
          <div>
            <div className="summer-section-heading">
              <ShieldCheck size={18} aria-hidden="true" />
              <h3>气候来源</h3>
            </div>
            <div className="summer-booking-links">
              {budapestReturnData.dateOptimization.sourceLinks.map((source) => (
                <SourceLink key={source.url} source={source} />
              ))}
            </div>
          </div>
        </article>
        <div className="summer-signal-grid">
          {budapestReturnData.dateOptimization.dateCandidates.map((candidate) => (
            <DateCandidateCard candidate={candidate} key={candidate.id} />
          ))}
        </div>
      </section>

      <section className="summer-section">
        <div className="results-header">
          <div>
            <h2>回国航班锚点</h2>
            <p className="summer-section-note">
              先锁定 Budapest 到 Ningbo 的直飞日，再反推柏林出发日和酒店晚数。
            </p>
          </div>
          <span>FM898 / MU8624</span>
        </div>
        <article className="summer-action-panel">
          <div>
            <div className="summer-section-heading">
              <Plane size={18} aria-hidden="true" />
              <h3>{budapestReturnData.flightPlan.routeZh}</h3>
            </div>
            <div className="summer-fact-grid">
              <Fact icon={<Plane size={15} />} label={budapestReturnData.flightPlan.operatorZh} />
              <Fact icon={<Clock3 size={15} />} label={budapestReturnData.flightPlan.aircraftZh} />
              <Fact icon={<CalendarDays size={15} />} label={budapestReturnData.flightPlan.scheduleZh} />
              <Fact icon={<MapPinned size={15} />} label={budapestReturnData.flightPlan.terminalZh} />
            </div>
            <p className="summer-roadtrip-best">{budapestReturnData.flightPlan.riskZh}</p>
          </div>
          <div>
            <div className="summer-section-heading">
              <ShieldCheck size={18} aria-hidden="true" />
              <h3>核查来源</h3>
            </div>
            <div className="summer-booking-links">
              {budapestReturnData.flightPlan.sourceLinks.map((source) => (
                <SourceLink key={source.url} source={source} />
              ))}
            </div>
          </div>
        </article>
      </section>

      <section className="summer-section">
        <div className="results-header">
          <div>
            <h2>推荐日程</h2>
            <p className="summer-section-note">
              首选 9 月 17 日周四飞回；9 月 14 日是保守备选，9 月 21 日是气候优先备选。
            </p>
          </div>
          <span>{topItinerary.nameZh}</span>
        </div>
        <div className="summer-roadtrip-grid">
          {budapestReturnData.recommendedItineraries.map((itinerary) => (
            <ItineraryCard itinerary={itinerary} key={itinerary.id} />
          ))}
        </div>
      </section>

      <section className="summer-section">
        <div className="results-header">
          <div>
            <h2>柏林到布达佩斯交通</h2>
            <p className="summer-section-note">
              排序按带宝宝可控性、总耗时、行李复杂度和后续长途回国风险综合判断。
            </p>
          </div>
          <span>推荐：{recommendedTransport.modeZh}</span>
        </div>
        <div className="summer-roadtrip-grid">
          {budapestReturnData.transportOptions.map((option) => (
            <TransportCard option={option} key={option.id} />
          ))}
        </div>
      </section>

      <section className="summer-section">
        <div className="results-header">
          <div>
            <h2>布达佩斯酒店 shortlist</h2>
            <p className="summer-section-note">
              布达佩斯市内真全包稀缺，所以这里优先展示 Full Board / Half Board 和亲子度假属性。
            </p>
          </div>
          <span>{budapestReturnData.hotelOptions.length} 个候选</span>
        </div>
        <div className="summer-roadtrip-grid">
          {budapestReturnData.hotelOptions.map((hotel) => (
            <HotelCard hotel={hotel} key={hotel.id} />
          ))}
        </div>
      </section>

      <section className="summer-section">
        <div className="results-header">
          <div>
            <h2>机场衔接</h2>
            <p className="summer-section-note">
              FM898 晚间起飞，核心目标是避免临门一脚出问题。
            </p>
          </div>
          <span>BUD T2A</span>
        </div>
        <article className="summer-action-panel">
          <div>
            <div className="summer-section-heading">
              <Car size={18} aria-hidden="true" />
              <h3>建议动作</h3>
            </div>
            <div className="summer-list-block is-positive">
              <ul>
                <li>{budapestReturnData.airportConnection.recommendedZh}</li>
                <li>{budapestReturnData.airportConnection.airportTimingZh}</li>
                <li>{budapestReturnData.airportConnection.taxiZh}</li>
                <li>{budapestReturnData.airportConnection.publicTransportZh}</li>
              </ul>
            </div>
          </div>
          <div>
            <div className="summer-section-heading">
              <ShieldCheck size={18} aria-hidden="true" />
              <h3>机场/交通来源</h3>
            </div>
            <div className="summer-booking-links">
              {budapestReturnData.airportConnection.sourceLinks.map((source) => (
                <SourceLink key={source.url} source={source} />
              ))}
            </div>
          </div>
        </article>
      </section>

      <section className="summer-action-panel">
        <div>
          <div className="summer-section-heading">
            <Baby size={18} aria-hidden="true" />
            <h3>布达佩斯轻玩法</h3>
          </div>
          <ol>
            {budapestReturnData.cityPacingZh.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ol>
        </div>
        <div>
          <div className="summer-section-heading">
            <ListChecks size={18} aria-hidden="true" />
            <h3>预订检查顺序</h3>
          </div>
          <ul>
            {budapestReturnData.bookingChecklistZh.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      </section>

      <section className="summer-section">
        <div className="results-header">
          <div>
            <h2>直接查询入口</h2>
            <p className="summer-section-note">
              这些链接用于最后核票、核价和核实宝宝/半膳条款。
            </p>
          </div>
          <span>{budapestReturnData.bookingLinks.length} 个入口</span>
        </div>
        <div className="summer-portal-grid">
          {budapestReturnData.bookingLinks.map((link) => (
            <article className="summer-portal-card" key={link.url}>
              <div className="summer-portal-top">
                <ExternalLink size={18} aria-hidden="true" />
                <div>
                  <span>{link.site}</span>
                  <h3>{link.label}</h3>
                </div>
              </div>
              <p>{link.intentZh}</p>
              <a className="primary-link" href={link.url} rel="noreferrer" target="_blank">
                打开查询
                <ExternalLink size={14} aria-hidden="true" />
              </a>
            </article>
          ))}
        </div>
      </section>
    </section>
  );
}

function ItineraryCard({ itinerary }: { itinerary: RecommendedItinerary }) {
  return (
    <article className={itinerary.fitScore >= 90 ? "summer-roadtrip-card is-top" : "summer-roadtrip-card is-strong"}>
      <div className="summer-card-top">
        <div>
          <span className="summer-fit-chip is-top">方案</span>
          <h3>{itinerary.nameZh}</h3>
          <p>{itinerary.datesZh}</p>
        </div>
        <div className="summer-score">
          <strong>{itinerary.fitScore}</strong>
          <span>匹配</span>
        </div>
      </div>
      <p className="summer-roadtrip-best">{itinerary.whoShouldPickZh}</p>
      <div className="summer-list-grid">
        <ListBlock title="日程安排" items={itinerary.dayPlanZh} positive />
        <ListBlock title="风险" items={itinerary.risksZh} />
      </div>
      <div className="summer-keywords">
        <strong>酒店搭配</strong>
        <p>{itinerary.hotelPairingZh}</p>
      </div>
    </article>
  );
}

function DateCandidateCard({ candidate }: { candidate: DateCandidate }) {
  const cardClass = candidate.score >= 90
    ? "summer-signal-card is-date-top"
    : candidate.score >= 80
      ? "summer-signal-card is-date-strong"
      : "summer-signal-card is-date-backup";

  return (
    <article className={cardClass}>
      <div>
        <span>{candidate.weekdayZh}</span>
        <h3>{candidate.dateZh}</h3>
        <p>{candidate.arrivalZh}</p>
      </div>
      <div className={candidate.score >= 90 ? "summer-score" : "summer-score is-stretch"}>
        <strong>{candidate.score}</strong>
        <span>{candidate.verdictZh}</span>
      </div>
      <div className="summer-list-block is-positive">
        <strong>核心判断</strong>
        <ul>
          <li>{candidate.vaccineBufferZh}</li>
          <li>{candidate.schoolFitZh}</li>
          <li>{candidate.ningboClimateZh}</li>
        </ul>
      </div>
      <p>{candidate.recommendationZh}</p>
      <div className="summer-list-block">
        <strong>风险</strong>
        <ul>
          {candidate.risksZh.map((risk) => (
            <li key={risk}>{risk}</li>
          ))}
        </ul>
      </div>
    </article>
  );
}

function TransportCard({ option }: { option: TransportOption }) {
  const cardClass = option.rank === 1 ? "summer-roadtrip-card is-top" : option.rank === 2 ? "summer-roadtrip-card is-strong" : "summer-roadtrip-card is-backup";
  return (
    <article className={cardClass}>
      <div className="summer-card-top">
        <div>
          <span className={option.rank === 1 ? "summer-fit-chip is-top" : "summer-fit-chip is-backup"}>
            #{option.rank} {option.modeZh}
          </span>
          <h3>{option.headlineZh}</h3>
        </div>
        <div className={option.rank === 1 ? "summer-score" : "summer-score is-stretch"}>
          <strong>{option.rank === 1 ? "首选" : "备选"}</strong>
          <span>交通</span>
        </div>
      </div>
      <div className="summer-drive-row">
        <span>
          {transportIcons[option.id] ?? <MapPinned size={15} />}
          {option.durationZh}
        </span>
        <span>
          <BadgeEuro size={15} aria-hidden="true" />
          {option.priceZh}
        </span>
      </div>
      <p className="summer-roadtrip-best">{option.babyFitZh}</p>
      <div className="summer-list-grid">
        <ListBlock title="优点" items={option.prosZh} positive />
        <ListBlock title="缺点" items={option.consZh} />
      </div>
      <div className="summer-keywords">
        <strong>判断</strong>
        <p>{option.recommendationZh}</p>
      </div>
      <div className="summer-booking-links">
        {option.sourceLinks.map((source) => (
          <SourceLink compact key={source.url} source={source} />
        ))}
      </div>
    </article>
  );
}

function HotelCard({ hotel }: { hotel: BudapestHotelOption }) {
  const cardClass = hotel.rank === 1 ? "summer-roadtrip-card is-top" : hotel.rank === 2 ? "summer-roadtrip-card is-strong" : "summer-roadtrip-card is-backup";
  return (
    <article className={cardClass}>
      <div className="summer-card-top">
        <div>
          <span className={hotel.rank <= 2 ? "summer-fit-chip is-top" : "summer-fit-chip is-backup"}>
            #{hotel.rank} 酒店
          </span>
          <h3>{hotel.nameZh}</h3>
          <p>{hotel.name}</p>
        </div>
        <div className={hotel.rank <= 2 ? "summer-score" : "summer-score is-stretch"}>
          <strong>{hotel.fitScore}</strong>
          <span>家庭匹配</span>
        </div>
      </div>
      <p className="summer-roadtrip-best">{hotel.recommendationZh}</p>
      <div className="summer-fact-grid">
        <Fact icon={<Utensils size={15} />} label={hotel.boardZh} />
        <Fact icon={<MapPinned size={15} />} label={hotel.locationFitZh} />
        <Fact icon={<Baby size={15} />} label={hotel.babyFitZh} />
        <Fact icon={<Waves size={15} />} label={hotel.poolSpaZh} />
        <Fact icon={<Plane size={15} />} label={hotel.cityTourFitZh} />
        <Fact icon={<Hotel size={15} />} label={hotel.boardLevel} />
      </div>
      <div className="summer-list-grid">
        <ListBlock title="适合点" items={hotel.prosZh} positive />
        <ListBlock title="下单前核实" items={hotel.risksZh} />
      </div>
      <div className="summer-link-block">
        <strong>证据来源</strong>
        <div>
          {hotel.sourceLinks.map((source) => (
            <SourceLink compact key={source.url} source={source} />
          ))}
        </div>
      </div>
      <div className="summer-booking-links">
        {hotel.bookingLinks.map((source, index) => (
          <SourceLink key={source.url} primary={index === 0} source={source} />
        ))}
      </div>
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
  source: SourceLinkData;
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
