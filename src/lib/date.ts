import type { TravelItem } from "../types";

export type FreshnessKind = "today" | "week";

export function formatFullDateTime(value: string, timeZone: string) {
  return new Intl.DateTimeFormat("zh-CN", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZoneName: "short",
  }).format(new Date(value));
}

export function formatRelativeDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "更新时间待确认";
  const diffMs = Date.now() - date.getTime();
  if (diffMs < 60 * 1000) return "刚刚更新";
  const minutes = Math.floor(diffMs / (1000 * 60));
  if (minutes < 60) return `${minutes} 分钟前更新`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} 小时前更新`;
  return `${Math.floor(hours / 24)} 天前更新`;
}

export function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(value));
}

export function formatDate(value?: string) {
  if (!value) return "待确认";
  return new Intl.DateTimeFormat("zh-CN", {
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(value));
}

export function formatMonthDay(value: string) {
  return new Intl.DateTimeFormat("zh-CN", {
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(`${value}T12:00:00Z`));
}

export function dateKeyInTimezone(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

export function getFreshnessKind(
  publishedAt: string | undefined,
  generatedAt: string,
  timeZone: string,
): FreshnessKind | undefined {
  if (!publishedAt) return undefined;
  const publishedDate = new Date(publishedAt);
  const generatedDate = new Date(generatedAt);
  if (
    Number.isNaN(publishedDate.getTime()) ||
    Number.isNaN(generatedDate.getTime()) ||
    publishedDate.getTime() > generatedDate.getTime() + 5 * 60 * 1000
  ) {
    return undefined;
  }

  if (dateKeyInTimezone(publishedDate, timeZone) === dateKeyInTimezone(generatedDate, timeZone)) {
    return "today";
  }

  const ageMs = generatedDate.getTime() - publishedDate.getTime();
  return ageMs <= 7 * 24 * 60 * 60 * 1000 ? "week" : undefined;
}

export function countFreshItems(
  items: TravelItem[],
  generatedAt: string,
  timeZone: string,
  window: FreshnessKind,
) {
  return items.filter((item) => {
    const freshness = getFreshnessKind(item.publishedAt, generatedAt, timeZone);
    return window === "today" ? freshness === "today" : Boolean(freshness);
  }).length;
}
