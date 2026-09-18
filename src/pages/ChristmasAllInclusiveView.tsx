import { Baby, CalendarDays, Check, Copy, ExternalLink, MapPin, Plane, Users, Utensils, Waves } from "lucide-react";
import { useMemo, useState, type ReactNode } from "react";
import data from "../data/christmas-all-inclusive-2026.json";
import { bookingSearchUrl, exactHotelSearchUrl, hotelMapUrl } from "../lib/travelSearch";

type Hotel = typeof data.hotels[number];
const partyLabels = { "3": "2位成人＋爱丽丝（1岁）", "4": "3位成人＋爱丽丝（1岁）" };
const hotelImages: Record<string, { url: string; alt: string }> = {
  orquidea: { url: "https://www.tui-blue.com/media/hotels/Orquidea/UEbersicht/1920x1080/tui-blue-orquidea-overview.jpg", alt: "TUI BLUE Orquidea酒店与泳池全景，来源：酒店官网" },
  gardens: { url: "https://pro-static.h10hotels.com/gallery/T4D3/01_HLGHotel1.jpg", alt: "H10 Suites Lanzarote Gardens酒店及泳池，来源：酒店官网" },
};

function OutLink({ href, children }: { href: string; children: ReactNode }) {
  return <a href={href} target="_blank" rel="noreferrer">{children}<ExternalLink size={14} aria-hidden="true" /></a>;
}

export function ChristmasAllInclusiveView() {
  const [party, setParty] = useState<"3" | "4">("3");
  const [dateId, setDateId] = useState(data.dateOptions[0].id);
  const [destination, setDestination] = useState("all");
  const [copied, setCopied] = useState("");
  const dates = data.dateOptions.find((option) => option.id === dateId)!;
  const adults = party === "3" ? 2 : 3;
  const nights = Math.round((Date.parse(dates.checkOut) - Date.parse(dates.checkIn)) / 86400000);
  const hotels = useMemo(() => data.hotels
    .filter((hotel) => destination === "all" || hotel.destination === destination)
    .sort((a, b) => party === "3" ? a.rank3 - b.rank3 : a.rank4 - b.rank4), [party, destination]);

  const requestText = (hotel: Hotel) => `Hello, please quote ${hotel.name}, ${hotel.location}, for ${adults} adults and one child aged 1 year (approximately 18 months), ${dates.checkIn} to ${dates.checkOut} (${nights} nights), All Inclusive. Departure airport: Berlin Brandenburg (BER), preferably daytime nonstop return flights with checked luggage and airport transfers with an appropriate child seat. Please confirm the total price for everyone, legal room occupancy including the infant, cot availability, separate sleeping areas, heated toddler pool and winter temperature, Christmas/New Year supplements and cancellation terms.${adults === 3 ? " Please compare a two-bedroom suite with two rooms (2 adults + infant, and 1 adult)." : " Please quote a family suite with a separate sleeping area."}`;
  async function copyRequest(hotel: Hotel) {
    try { await navigator.clipboard.writeText(requestText(hotel)); setCopied(hotel.id); }
    catch { setCopied("failed"); }
  }

  return <div className="christmas-page">
    <header className="trip-heading">
      <p className="eyebrow">柏林出发 · 欧洲家庭假期</p>
      <h2>2026 圣诞度假</h2>
      <p>{data.verdict}</p>
      <div className="trip-meta"><span><CalendarDays size={16} />12月20日起 · 7–10天（6–9晚）</span><span><Baby size={16} />爱丽丝约1岁半</span><span>资料核实：{data.updatedAt}</span></div>
    </header>

    <section className="trip-filters" aria-label="圣诞旅行条件">
      <fieldset className="party-switch"><legend>出行人员</legend>
        {(["3", "4"] as const).map((value) => <label key={value} className={party === value ? "selected" : ""}>
          <input type="radio" name="christmas-party" value={value} checked={party === value} onChange={() => { setParty(value); setCopied(""); }} />
          <Users size={16} /><span>{value === "3" ? "三人 · 我们一家" : "四人 · 加上岳母"}</span>
        </label>)}
      </fieldset>
      <label className="trip-field">出行日期<select value={dateId} onChange={(event) => { setDateId(event.target.value); setCopied(""); }}>
        {data.dateOptions.map((option) => <option key={option.id} value={option.id}>{option.label}</option>)}
      </select></label>
      <label className="trip-field">目的地<select value={destination} onChange={(event) => setDestination(event.target.value)}>
        <option value="all">全部目的地</option>{data.destinations.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
      </select></label>
    </section>
    <div className="trip-selection" aria-live="polite"><strong>{partyLabels[party]} · {nights + 1}天{nights}晚 · BER出发 · 全包</strong><p>{dates.note}</p></div>
    <aside className="evidence-notice"><strong>报价与库存待确认</strong><p>{data.quoteStatus}</p></aside>

    <section className="trip-section" aria-labelledby="destination-title">
      <h3 id="destination-title">先决定去哪儿</h3>
      <p>{data.scopeNote}</p>
      <div className="destination-comparison">{data.destinations.map((item) => <article key={item.id}>
        <span className="trip-badge">{item.rank}</span><h4>{item.name}</h4><p>{item.reason}</p><p>{item.flight}</p><p className="muted">{item.caution}</p><OutLink href={item.source}>参考来源</OutLink>
      </article>)}</div>
      <details className="trip-details"><summary>本轮不优先的方向</summary><ul>{data.notRecommended.map((item) => <li key={item}>{item}</li>)}</ul></details>
    </section>

    <section className="trip-section" aria-labelledby="hotel-title">
      <div className="trip-section-title"><h3 id="hotel-title">{party === "3" ? "三人方案：宝宝设施优先" : "四人方案：卧室与长辈舒适度优先"}</h3><span>{hotels.length}家候选 · 人工适配排序</span></div>
      <div className="trip-hotels">{hotels.map((hotel) => <article className="trip-hotel" key={hotel.id}>
        {hotelImages[hotel.id] && <figure className="hotel-photo"><img loading="lazy" src={hotelImages[hotel.id].url} alt={hotelImages[hotel.id].alt} onError={(event) => { event.currentTarget.hidden = true; }} /><figcaption>酒店官网示意图，非入住日期实景</figcaption></figure>}
        <div className="hotel-title"><span className="hotel-rank">{party === "3" ? hotel.rank3 : hotel.rank4}</span><div><h4>{hotel.name}</h4><p><MapPin size={14} />{hotel.location}</p></div></div>
        <p className="hotel-verdict">{hotel.verdict}</p>
        <dl className="hotel-facts">
          <div><dt><Users size={16} />当前房型建议</dt><dd>{party === "3" ? hotel.room3 : hotel.room4}</dd></div>
          <div><dt><Utensils size={16} />餐食</dt><dd>{hotel.meals}</dd></div>
          <div><dt><Waves size={16} />泳池</dt><dd>{hotel.pool}</dd></div>
          <div><dt><Baby size={16} />低龄服务</dt><dd>{hotel.baby}</dd></div>
        </dl>
        <p className="hotel-price-status">{hotel.priceStatus}</p>
        <div className="hotel-links">
          <OutLink href={hotel.official}>酒店官网核价</OutLink>
          <OutLink href={bookingSearchUrl(hotel.name, hotel.location, dates, { adults, childAge: 1 })}>Booking搜索 · {adults}成人＋1岁</OutLink>
          <OutLink href={hotelMapUrl(hotel.name, hotel.location)}>核对位置</OutLink>
          <button type="button" onClick={() => copyRequest(hotel)} title="复制英文询价条件">{copied === hotel.id ? <Check size={15} /> : <Copy size={15} />}{copied === hotel.id ? "已复制" : "复制询价"}</button>
        </div>
        <p className="link-note">Booking链接附带日期、人数与酒店全名，但源站可能重置条件；打开后重新核对日期、人数、地址与全包餐标。官网需重新选择条件，两间房需分别配置入住人。</p>
        <details className="trip-details"><summary>注意事项、证据与精确比价</summary>
          <ul>{hotel.cautions.map((item) => <li key={item}>{item}</li>)}</ul>
          <div className="hotel-links">{hotel.references.map((source) => <OutLink key={source.url} href={source.url}>{source.label}</OutLink>)}
            <OutLink href={exactHotelSearchUrl(hotel.name, hotel.location, "tui.com")}>TUI酒店名检索</OutLink>
            <OutLink href={exactHotelSearchUrl(hotel.name, hotel.location, "urlaub.check24.de")}>CHECK24酒店名检索</OutLink>
          </div>
          <p className="link-note">以上两项是限定站点的网页搜索，不携带日期人数，也不代表可订库存。</p>
          <label className="trip-field">当前方案询价文本<textarea readOnly value={requestText(hotel)} rows={4} /></label>
        </details>
      </article>)}</div>
      {copied === "failed" && <p role="status">剪贴板不可用；询价文本在酒店详情内可查看。</p>}
    </section>

    <section className="trip-section" aria-labelledby="promotion-title"><h3 id="promotion-title">当前促销与预订参考</h3>
      <p>比较最终全家价格，不比较广告折扣百分比。以下活动不是所选日期的库存承诺。</p>
      <div className="promotion-list">{data.promotions.map((promo) => {
        const expired = promo.expires && new Date().toLocaleDateString("en-CA", { timeZone: "Europe/Berlin" }) > promo.expires;
        return <article key={promo.provider}><div><span className="trip-badge">{promo.provider}</span><h4>{promo.title}</h4></div>
          <p className="promotion-status">{expired ? "活动已过期，仅供历史参考" : promo.status}{promo.expires ? ` · 截止${promo.expires}` : ""}</p>
          <p>{promo.detail}</p><p>{promo.action}</p><OutLink href={promo.url}>查看来源与条件</OutLink>
        </article>;
      })}</div>
    </section>

    <section className="trip-section"><h3>全家总价核对</h3>
      <p>目前两套方案均未取得可付款报价。下面可录入自己看到的报价；不同人数、日期分别计算，空白项目不当作免费。</p>
      <QuoteWorksheet key={`${party}-${dateId}`} partyLabel={partyLabels[party]} nights={nights} />
    </section>
    <section className="trip-section"><h3>一周到十天，住一家酒店</h3><ol className="trip-itinerary">{data.itinerary.map((item) => <li key={item.day}><strong>{item.day}</strong><p>{item.plan}</p></li>)}</ol></section>
    <section className="trip-section"><h3>预订前确认</h3><ul className="trip-checks">{data.bookingChecks.map((item) => <li key={item}>{item}</li>)}</ul><p className="muted"><Plane size={15} /> 日期是核价窗口，不是已确认航班班期。先确定白天往返航班，再锁酒店。</p></section>
  </div>;
}

function QuoteWorksheet({ partyLabel, nights }: { partyLabel: string; nights: number }) {
  const [values, setValues] = useState<Record<string, string>>({});
  const fields = [["base", "全家机票＋全包酒店（€）"], ["bags", "行李＋婴儿票差额（€）"], ["transfer", "全家往返接送（€）"], ["extras", "税费＋晚宴等附加费（€）"]];
  const entries = fields.map(([key]) => values[key]);
  const complete = entries.every((value) => value !== undefined && value !== "" && Number.isFinite(Number(value)) && Number(value) >= 0);
  const total = complete ? entries.reduce((sum, value) => sum + Number(value), 0) : undefined;
  return <div className="quote-worksheet"><div className="quote-fields">{fields.map(([key, label]) => <label className="trip-field" key={key}>{label}
    <input type="number" min="0" step="0.01" inputMode="decimal" placeholder="待核实" value={values[key] ?? ""} onChange={(event) => setValues({ ...values, [key]: event.target.value })} />
  </label>)}</div><p className="quote-total" aria-live="polite">{partyLabel}：{total === undefined ? "费用未填齐" : `合计€${total.toFixed(2)} · 每晚全家€${(total / nights).toFixed(2)}`}</p><p className="link-note">已含项目填0，未确认保留空白。切换人数或日期会清空本次试算；这里不保存报价、不提交预订。</p></div>;
}
