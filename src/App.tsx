import {
  Baby,
  CalendarDays,
  CheckCircle2,
  CircleAlert,
  Compass,
  ExternalLink,
  Filter,
  Hotel,
  MapPin,
  Plane,
  RefreshCcw,
  Search,
  Ship,
  Sparkles,
  Tags,
} from "lucide-react";
import { useMemo, useState } from "react";
import radarJson from "./data/radar-data.json";
import sourceCatalogJson from "./data/source-catalog.json";
import type {
  DealCategory,
  RadarData,
  SourceDefinition,
  TravelItem,
  TravelScope,
} from "./types";

const radar = radarJson as RadarData;
const sourceCatalog = sourceCatalogJson as SourceDefinition[];

const categoryLabels: Record<DealCategory, string> = {
  event: "活动",
  "hotel-resort": "酒店/度假村",
  package: "机酒套餐",
  flight: "机票",
  cruise: "邮轮",
  "all-inclusive": "全包",
  "day-trip": "一日游",
  planning: "灵感",
};

const scopeLabels: Record<TravelScope, string> = {
  "berlin-city": "柏林市内",
  "berlin-nearby": "柏林周边",
  germany: "德国",
  europe: "欧洲",
  "sun-resort": "阳光度假",
  "long-haul": "长线",
};

type Tab = "radar" | "events" | "sources" | "plan";
type SortMode = "priority" | "newest" | "price";

function App() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<DealCategory | "all">("all");
  const [scope, setScope] = useState<TravelScope | "all">("all");
  const [sourceId, setSourceId] = useState("all");
  const [familyOnly, setFamilyOnly] = useState(true);
  const [fromBerlinOnly, setFromBerlinOnly] = useState(false);
  const [sortMode, setSortMode] = useState<SortMode>("priority");
  const [activeTab, setActiveTab] = useState<Tab>("radar");

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
        (!fromBerlinOnly || item.fromBerlin)
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
  }, [category, familyOnly, fromBerlinOnly, query, scope, sortMode, sourceId]);

  const spotlight = filteredItems.slice(0, 4);
  const listItems =
    activeTab === "events"
      ? filteredItems.filter((item) => item.category === "event")
      : filteredItems;

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
          label="源站异常"
          value={radar.stats.sourceErrors}
          icon={<CircleAlert />}
        />
      </section>

      <nav className="tabs" aria-label="views">
        <TabButton active={activeTab === "radar"} onClick={() => setActiveTab("radar")}>
          推荐雷达
        </TabButton>
        <TabButton active={activeTab === "events"} onClick={() => setActiveTab("events")}>
          柏林活动
        </TabButton>
        <TabButton
          active={activeTab === "sources"}
          onClick={() => setActiveTab("sources")}
        >
          信息源
        </TabButton>
        <TabButton active={activeTab === "plan"} onClick={() => setActiveTab("plan")}>
          路线规划
        </TabButton>
      </nav>

      {activeTab === "sources" ? (
        <SourcesView runs={radar.sources} />
      ) : activeTab === "plan" ? (
        <PlanView />
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
                <SpotlightCard key={item.id} item={item} />
              ))}
            </section>
          )}

          <section className="results-header">
            <h2>{activeTab === "events" ? "柏林活动" : "全部匹配"}</h2>
            <span>{listItems.length} 条</span>
          </section>

          <section className="card-grid">
            {listItems.map((item) => (
              <TravelCard key={item.id} item={item} />
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

function Metric({
  label,
  value,
  icon,
}: {
  label: string;
  value: number;
  icon: React.ReactElement;
}) {
  return (
    <div className="metric">
      {icon}
      <div>
        <strong>{value}</strong>
        <span>{label}</span>
      </div>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button className={active ? "tab is-active" : "tab"} onClick={onClick} type="button">
      {children}
    </button>
  );
}

function SelectField({
  icon,
  value,
  options,
  onChange,
}: {
  icon: React.ReactElement;
  value: string;
  options: Array<[string, string]>;
  onChange: (value: string) => void;
}) {
  return (
    <label className="select-field">
      {icon}
      <select value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map(([optionValue, label]) => (
          <option key={optionValue} value={optionValue}>
            {label}
          </option>
        ))}
      </select>
    </label>
  );
}

function SpotlightCard({ item }: { item: TravelItem }) {
  return (
    <article className="spotlight-card">
      {item.imageUrl && (
        <img src={item.imageUrl} alt="" loading="lazy" referrerPolicy="no-referrer" />
      )}
      <div className="spotlight-body">
        <div className="card-meta">
          <span>{item.sourceName}</span>
          <span>{scopeLabels[item.scope]}</span>
        </div>
        <h2>{displayTitle(item)}</h2>
        <p className="original-title">{item.title}</p>
        <p>{item.summary}</p>
        <CardFacts item={item} />
        <a className="primary-link" href={item.url} target="_blank" rel="noreferrer">
          打开源站
          <ExternalLink size={16} aria-hidden="true" />
        </a>
      </div>
    </article>
  );
}

function TravelCard({ item }: { item: TravelItem }) {
  const Icon = iconForCategory(item.category);
  return (
    <article className="travel-card">
      {item.imageUrl ? (
        <img
          className="card-image"
          src={item.imageUrl}
          alt=""
          loading="lazy"
          referrerPolicy="no-referrer"
        />
      ) : (
        <div className="image-fallback">
          <Icon size={30} aria-hidden="true" />
        </div>
      )}
      <div className="travel-card-body">
        <div className="card-meta">
          <span>{item.sourceName}</span>
          <span>{formatDate(item.publishedAt)}</span>
        </div>
        <h3>{displayTitle(item)}</h3>
        <p className="original-title">{item.title}</p>
        <p>{item.summary}</p>
        <div className="tag-row">
          {item.tags.slice(0, 5).map((tag) => (
            <span key={tag}>{tag}</span>
          ))}
        </div>
        <CardFacts item={item} />
        <a className="text-link" href={item.url} target="_blank" rel="noreferrer">
          查看详情
          <ExternalLink size={15} aria-hidden="true" />
        </a>
      </div>
    </article>
  );
}

function CardFacts({ item }: { item: TravelItem }) {
  return (
    <div className="fact-row">
      {item.priceLabel && <span>{item.priceLabel}</span>}
      {item.durationDays && <span>{item.durationDays} 天/晚</span>}
      {item.departureHint && <span>{item.departureHint}</span>}
      {item.locationHint && <span>{item.locationHint}</span>}
      <span>家庭分 {item.familyScore}</span>
    </div>
  );
}

function displayTitle(item: TravelItem) {
  return item.titleZh || item.title;
}

function SourcesView({ runs }: { runs: RadarData["sources"] }) {
  const runsById = new Map(runs.map((run) => [run.id, run]));
  return (
    <section className="source-list">
      {sourceCatalog.map((source) => {
        const run = runsById.get(source.id);
        return (
          <article className="source-row" key={source.id}>
            <div className="source-status">
              {run?.status === "ok" ? (
                <CheckCircle2 size={22} />
              ) : source.status === "candidate" ? (
                <Sparkles size={22} />
              ) : (
                <CircleAlert size={22} />
              )}
            </div>
            <div className="source-main">
              <div className="source-title">
                <h3>{source.name}</h3>
                <span>{source.status === "active" ? "已接入" : "候选"}</span>
              </div>
              <p>{source.notes}</p>
              <div className="source-tags">
                {source.focus.map((focus) => (
                  <span key={focus}>{focus}</span>
                ))}
              </div>
            </div>
            <div className="source-side">
              <strong>{run?.itemCount ?? 0}</strong>
              <span>{run?.message ?? source.access}</span>
              <a href={source.homepage} target="_blank" rel="noreferrer">
                源站
                <ExternalLink size={14} />
              </a>
            </div>
          </article>
        );
      })}
    </section>
  );
}

function PlanView() {
  const planRows = [
    ["城市半日", "柏林市内活动、展览、food festival、亲子馆", "宝宝作息优先，控制换乘"],
    ["周末短途", "Potsdam、Brandenburg、Spreewald、Ostsee、Therme", "车程/火车 1-3 小时"],
    ["3-5 天轻度假", "德国/波兰/丹麦/奥地利酒店与度假村", "厨房、婴儿床、泳池优先"],
    ["7 天全包", "Turkey、Egypt、Greece、Spain 等阳光目的地", "直飞、接送、全包、儿童设施"],
    ["邮轮", "MSC、Mein Schiff、AIDA、地中海/北欧", "确认婴儿政策和岸上节奏"],
  ];

  return (
    <section className="plan-board">
      {planRows.map(([title, focus, note]) => (
        <article className="plan-row" key={title}>
          <h3>{title}</h3>
          <p>{focus}</p>
          <span>{note}</span>
        </article>
      ))}
    </section>
  );
}

function iconForCategory(category: DealCategory) {
  if (category === "cruise") return Ship;
  if (category === "flight" || category === "package") return Plane;
  if (category === "event") return CalendarDays;
  if (category === "hotel-resort" || category === "all-inclusive") return Hotel;
  return Compass;
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(value));
}

function formatDate(value?: string) {
  if (!value) return "待确认";
  return new Intl.DateTimeFormat("zh-CN", {
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(value));
}

function normalizeSearchText(value: string) {
  return value
    .toLowerCase()
    .replace(/ß/g, "ss")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");
}

function expandQuery(value: string) {
  const normalized = normalizeSearchText(value.trim());
  if (!normalized) return [];

  const aliases: Record<string, string[]> = {
    turkey: ["turkey", "turkei", "tuerkei", "side", "antalya"],
    egypt: ["egypt", "agypten", "aegypten", "hurghada"],
    cruise: ["cruise", "kreuzfahrt", "msc", "aida", "mein schiff"],
    baby: ["baby", "babybett", "gitterbett", "kinder"],
    family: ["family", "familie", "kinder", "kids"],
    "all inclusive": ["all inclusive", "all-inclusive", "vollpension"],
  };

  const terms = new Set([normalized]);
  for (const [key, values] of Object.entries(aliases)) {
    if (normalized.includes(key)) {
      values.forEach((alias) => terms.add(normalizeSearchText(alias)));
    }
  }
  return Array.from(terms);
}

export default App;
