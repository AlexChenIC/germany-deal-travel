import {
  Baby,
  BadgeEuro,
  CheckCircle2,
  ExternalLink,
  Filter,
  Hotel,
  Search,
  ShieldCheck,
  Sparkles,
  Tags,
  TicketPercent,
} from "lucide-react";
import { useMemo, useState } from "react";
import { Metric, SelectField } from "../components/Controls";
import {
  CardFacts,
  displayTitle,
  FreshnessBadge,
  ItemActions,
} from "../components/TravelCards";
import { categoryLabels, scopeLabels } from "../config";
import discountWatchJson from "../data/discount-source-watch.json";
import {
  buildDiscountFocusItems,
  type DiscountFocusMode,
} from "../lib/discountFocus";
import type {
  DiscountSourceCategory,
  DiscountSourcePriority,
  DiscountWatchData,
  TravelItem,
} from "../types";

const discountWatch = discountWatchJson as DiscountWatchData;

const categoryNames: Record<DiscountSourceCategory, string> = {
  "package-sale": "机酒/全包促销",
  "hotel-club": "酒店会员价",
  "curated-top20": "精选榜单",
  "short-stay": "短住/温泉",
  community: "社区/编辑爆料",
  "retail-package": "零售旅行套餐",
  "local-activity": "本地活动折扣",
};

const priorityNames: Record<DiscountSourcePriority, string> = {
  primary: "重点盯",
  secondary: "辅助核对",
  watch: "观察源",
};

export function DiscountFocusView({
  items,
  excludedIds,
  favoriteIds,
  generatedAt,
  timezone,
  onToggleFavorite,
  onExclude,
}: {
  items: TravelItem[];
  excludedIds: ReadonlySet<string>;
  favoriteIds: Set<string>;
  generatedAt: string;
  timezone: string;
  onToggleFavorite: (id: string) => void;
  onExclude: (id: string) => void;
}) {
  const [mode, setMode] = useState<DiscountFocusMode>("all");
  const discountItems = useMemo(
    () => buildDiscountFocusItems(items, { excludedIds, mode, limit: 14 }),
    [excludedIds, items, mode],
  );
  const excellentCount = discountItems.filter(
    (deal) => (deal.discountPercent ?? 0) >= 50,
  ).length;
  const strongCount = discountItems.filter(
    (deal) => (deal.discountPercent ?? 0) >= 40,
  ).length;
  const primarySourceCount = discountWatch.sources.filter(
    (source) => source.priority === "primary",
  ).length;
  const familySourceCount = discountWatch.sources.filter((source) =>
    source.useForZh.some((use) => /全包|短住|亲子|家庭|Spa|温泉|酒店/i.test(use)),
  ).length;

  return (
    <section className="discount-page">
      <div className="discount-hero">
        <div>
          <p className="eyebrow">Deal-first redesign</p>
          <h2>重点折扣</h2>
          <p>{discountWatch.designVerdictZh}</p>
        </div>
        <div className="discount-principles">
          {discountWatch.principlesZh.map((principle) => (
            <span key={principle}>
              <CheckCircle2 size={15} aria-hidden="true" />
              {principle}
            </span>
          ))}
        </div>
      </div>

      <section className="discount-metrics" aria-label="discount focus summary">
        <Metric label="重点源" value={primarySourceCount} icon={<ShieldCheck />} />
        <Metric label="家庭适配源" value={familySourceCount} icon={<Baby />} />
        <Metric label="当前精选" value={discountItems.length} icon={<TicketPercent />} />
        <Metric label="40%+ 信号" value={strongCount} icon={<BadgeEuro />} />
        <Metric label="50%+ 信号" value={excellentCount} icon={<Sparkles />} />
      </section>

      <section className="discount-section">
        <div className="recommendation-header">
          <div>
            <p className="eyebrow">High-signal sources</p>
            <h3>值得重点盯的折扣网站</h3>
            <p>
              这里不追求“全部网站都展示”，而是按你们家庭需求保留最可能出现大幅折扣、全包、
              泳池/SPA 或亲子短住的来源。
            </p>
          </div>
          <span>{discountWatch.sources.length} 个来源</span>
        </div>
        <div className="discount-source-grid">
          {discountWatch.sources.map((source) => (
            <article
              className={`discount-source-card is-${source.priority}`}
              key={source.id}
            >
              <div className="discount-source-top">
                <span>{priorityNames[source.priority]}</span>
                <small>{categoryNames[source.category]}</small>
              </div>
              <h3>{source.name}</h3>
              <strong>{source.headlineZh}</strong>
              <p>{source.discountSignalZh}</p>
              <div className="discount-source-rule">
                <Tags size={15} aria-hidden="true" />
                {source.thresholdZh}
              </div>
              <div className="tag-row">
                {source.useForZh.slice(0, 4).map((use) => (
                  <span key={use}>{use}</span>
                ))}
              </div>
              <p className="discount-family-fit">{source.familyFitZh}</p>
              <div className="discount-caveats">
                {source.caveatsZh.slice(0, 2).map((caution) => (
                  <span key={caution}>{caution}</span>
                ))}
              </div>
              <a className="text-link" href={source.url} target="_blank" rel="noreferrer">
                打开来源
                <ExternalLink size={14} aria-hidden="true" />
              </a>
            </article>
          ))}
        </div>
      </section>

      <section className="discount-section">
        <div className="discount-toolbar">
          <div className="recommendation-header">
            <div>
              <p className="eyebrow">Current radar shortlist</p>
              <h3>当前雷达里的重点大折扣</h3>
            </div>
            <span>{discountItems.length} 条</span>
          </div>
          <SelectField
            icon={<Filter size={16} />}
            value={mode}
            onChange={(value) => setMode(value as DiscountFocusMode)}
            options={[
              ["all", "全部高信号"],
              ["family", "家庭/宝宝优先"],
              ["package", "全包/机酒/邮轮"],
              ["nearby", "柏林周边/德国短住"],
            ]}
          />
        </div>

        <div className="discount-rule-panel">
          <div>
            <Search size={18} aria-hidden="true" />
            <strong>筛选规则</strong>
          </div>
          <p>
            优先进入：40%+ 明确折扣、官方/编辑折扣站、全包/机酒套餐、带泳池/SPA/温泉、
            家庭友好或柏林/德国出发。自动降权：信用卡、礼品卡、机场购物、成人限定和与宝宝不友好的内容。
          </p>
        </div>

        {discountItems.length > 0 ? (
          <div className="discount-deal-grid">
            {discountItems.map((deal) => (
              <DiscountDealCard
                deal={deal}
                favoriteIds={favoriteIds}
                generatedAt={generatedAt}
                key={deal.item.id}
                onExclude={onExclude}
                onToggleFavorite={onToggleFavorite}
                timezone={timezone}
              />
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <Search size={28} aria-hidden="true" />
            <p>当前没有足够强的折扣信号；普通信息仍可在“推荐雷达”里查看。</p>
          </div>
        )}
      </section>
    </section>
  );
}

function DiscountDealCard({
  deal,
  favoriteIds,
  generatedAt,
  timezone,
  onToggleFavorite,
  onExclude,
}: {
  deal: ReturnType<typeof buildDiscountFocusItems>[number];
  favoriteIds: Set<string>;
  generatedAt: string;
  timezone: string;
  onToggleFavorite: (id: string) => void;
  onExclude: (id: string) => void;
}) {
  const item = deal.item;

  return (
    <article className={`discount-deal-card is-${deal.strength}`}>
      <div className="discount-deal-top">
        <div>
          <span>{item.sourceName}</span>
          <FreshnessBadge generatedAt={generatedAt} item={item} timezone={timezone} />
        </div>
        <strong>{deal.primarySignalZh}</strong>
      </div>
      <h3>{displayTitle(item)}</h3>
      <p className="original-title">{item.title}</p>
      <p>{item.summary}</p>
      <div className="discount-signal-row">
        {deal.discountPercent && <span>{deal.discountPercent}% 折扣信号</span>}
        <span>{categoryLabels[item.category]}</span>
        <span>{scopeLabels[item.scope]}</span>
        <span>评分 {deal.score}</span>
      </div>
      <div className="reason-list">
        {deal.reasonsZh.map((reason) => (
          <span key={reason}>{reason}</span>
        ))}
      </div>
      {deal.cautionZh && <p className="discount-caution">{deal.cautionZh}</p>}
      <CardFacts item={item} />
      <ItemActions
        isFavorite={favoriteIds.has(item.id)}
        onExclude={() => onExclude(item.id)}
        onToggleFavorite={() => onToggleFavorite(item.id)}
      />
      <a className="primary-link" href={item.url} target="_blank" rel="noreferrer">
        打开源站核对
        <ExternalLink size={15} aria-hidden="true" />
      </a>
    </article>
  );
}
