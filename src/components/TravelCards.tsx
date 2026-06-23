import {
  CalendarDays,
  Compass,
  ExternalLink,
  EyeOff,
  Heart,
  Hotel,
  Plane,
  Ship,
} from "lucide-react";
import { scopeLabels } from "../config";
import { formatDate, getFreshnessKind } from "../lib/date";
import type { DealCategory, TravelItem } from "../types";

export function SpotlightCard({
  generatedAt,
  item,
  isFavorite,
  timezone,
  onToggleFavorite,
  onExclude,
}: {
  generatedAt: string;
  item: TravelItem;
  isFavorite: boolean;
  timezone: string;
  onToggleFavorite: (id: string) => void;
  onExclude: (id: string) => void;
}) {
  return (
    <article className="spotlight-card">
      {item.imageUrl && (
        <img src={item.imageUrl} alt="" loading="lazy" referrerPolicy="no-referrer" />
      )}
      <div className="spotlight-body">
        <div className="card-meta">
          <span>{item.sourceName}</span>
          <div className="meta-end">
            <FreshnessBadge generatedAt={generatedAt} item={item} timezone={timezone} />
            <span>{scopeLabels[item.scope]}</span>
          </div>
        </div>
        <h2>{displayTitle(item)}</h2>
        <p className="original-title">{item.title}</p>
        <p>{item.summary}</p>
        <CardFacts item={item} />
        <ItemActions
          isFavorite={isFavorite}
          onToggleFavorite={() => onToggleFavorite(item.id)}
          onExclude={() => onExclude(item.id)}
        />
        <a className="primary-link" href={item.url} target="_blank" rel="noreferrer">
          打开源站
          <ExternalLink size={16} aria-hidden="true" />
        </a>
      </div>
    </article>
  );
}

export function TravelCard({
  generatedAt,
  item,
  isFavorite,
  timezone,
  onToggleFavorite,
  onExclude,
}: {
  generatedAt: string;
  item: TravelItem;
  isFavorite: boolean;
  timezone: string;
  onToggleFavorite: (id: string) => void;
  onExclude: (id: string) => void;
}) {
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
          <div className="meta-end">
            <FreshnessBadge generatedAt={generatedAt} item={item} timezone={timezone} />
            <span>{formatDate(item.publishedAt)}</span>
          </div>
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
        <ItemActions
          isFavorite={isFavorite}
          onToggleFavorite={() => onToggleFavorite(item.id)}
          onExclude={() => onExclude(item.id)}
        />
        <a className="text-link" href={item.url} target="_blank" rel="noreferrer">
          查看详情
          <ExternalLink size={15} aria-hidden="true" />
        </a>
      </div>
    </article>
  );
}

export function ItemActions({
  isFavorite,
  onToggleFavorite,
  onExclude,
}: {
  isFavorite: boolean;
  onToggleFavorite: () => void;
  onExclude: () => void;
}) {
  return (
    <div className="card-actions">
      <button
        className={isFavorite ? "icon-action is-favorite" : "icon-action"}
        onClick={onToggleFavorite}
        title={isFavorite ? "取消收藏" : "收藏"}
        type="button"
      >
        <Heart
          size={16}
          fill={isFavorite ? "currentColor" : "none"}
          aria-hidden="true"
        />
        {isFavorite ? "已收藏" : "收藏"}
      </button>
      <button
        className="icon-action"
        onClick={onExclude}
        title="排除，不再显示在雷达列表"
        type="button"
      >
        <EyeOff size={16} aria-hidden="true" />
        排除
      </button>
    </div>
  );
}

export function CardFacts({ item }: { item: TravelItem }) {
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

export function FreshnessBadge({
  generatedAt,
  item,
  timezone,
}: {
  generatedAt: string;
  item: TravelItem;
  timezone: string;
}) {
  const freshness = getFreshnessKind(item.publishedAt, generatedAt, timezone);
  if (!freshness) return null;

  return (
    <span className={`freshness-badge is-${freshness}`}>
      {freshness === "today" ? "今日新增" : "本周新增"}
    </span>
  );
}

export function displayTitle(item: TravelItem) {
  return item.titleZh || item.title;
}

export function iconForCategory(category: DealCategory) {
  if (category === "cruise") return Ship;
  if (category === "flight" || category === "package") return Plane;
  if (category === "event") return CalendarDays;
  if (category === "hotel-resort" || category === "all-inclusive") return Hotel;
  return Compass;
}
