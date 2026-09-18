import { Archive, CalendarDays, Compass, Heart, ListFilter } from "lucide-react";

export const pageGroups = [
  { label: "常用", pages: [ ["discounts", "重点折扣"], ["christmas", "2026 圣诞度假"], ["favorites", "我的收藏"] ] },
  { label: "发现与工具", pages: [ ["picks", "为我推荐"], ["radar", "推荐雷达"], ["events", "柏林活动"], ["kids", "儿童活动"], ["heat", "周边短住"], ["rv", "房车指南"], ["sources", "信息源与运行状态"], ["plan", "路线规划"] ] },
  { label: "历史专题 · 日期与价格需重查", pages: [ ["summer", "2026 暑期全包"], ["canary", "2026 夏季加纳利"], ["baltic", "北部海边旧方案"], ["alps", "三国山地旧方案"], ["budapest-return", "布达佩斯回国旧方案"] ] },
] as const;

export type PageId = typeof pageGroups[number]["pages"][number][0];
export function isArchivedPage(id: PageId) { return pageGroups[2].pages.some(([key]) => key === id); }

export function SiteNavigation({ active, onSelect }: { active: PageId; onSelect: (page: PageId) => void }) {
  const shortcuts = [
    { id: "discounts", label: "折扣", Icon: Compass },
    { id: "christmas", label: "圣诞度假", Icon: CalendarDays },
    { id: "favorites", label: "收藏", Icon: Heart },
  ] as const;
  return <>
    <nav className="site-navigation" aria-label="网站导航">
      <div className="nav-shortcuts">{shortcuts.map(({ id, label, Icon }) =>
        <a key={id} href={id === "discounts" ? "#discounts" : `#${id}`} aria-current={active === id ? "page" : undefined}
          onClick={(event) => { event.preventDefault(); onSelect(id); }}><Icon size={17} />{label}</a>)}</div>
      <label className="page-select"><ListFilter size={17} /><span className="sr-only">全部页面</span>
        <select aria-label="全部页面" value={active} onChange={(event) => onSelect(event.target.value as PageId)}>
          {pageGroups.map((group) => <optgroup key={group.label} label={group.label}>
            {group.pages.map(([id, title]) => <option key={id} value={id}>{title}</option>)}
          </optgroup>)}
        </select>
      </label>
    </nav>
    {isArchivedPage(active) && <aside className="archive-notice"><Archive size={19} /><div>
      <strong>历史行程参考</strong><p>原日期、人数和报价已过期。酒店资料可参考，余房、营业季节和预订条件需重新查询。</p>
    </div><a href="#christmas" onClick={(event) => { event.preventDefault(); onSelect("christmas"); }}>查看圣诞计划</a></aside>}
  </>;
}
