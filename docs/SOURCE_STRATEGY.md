# 信息源策略

## 已接入的一期源

| 来源 | 方法 | 覆盖内容 | 一期价值 |
| --- | --- | --- | --- |
| Travel-Dealz | `https://travel-dealz.de/feed/` RSS | 机票、酒店、邮轮、里程、套餐 | 德国旅行折扣质量高，更新稳定 |
| Urlaubspiraten | `https://www.urlaubspiraten.de/feed` RSS | 机酒、全包、酒店、家庭、邮轮 | 德国出发和家庭度假信息密度高 |
| Urlaubstracker | `https://www.urlaubstracker.de/feed/` RSS | 酒店、低价度假、Spa、短途 | 适合德国/欧洲周边和酒店套餐 |
| mydealz Reisen | `https://www.mydealz.de/rss/gruppe/reisen` RSS | 社区旅行折扣、优惠码、邮轮 | 捕捉社区发现和临时折扣 |
| Berlin.de Events | `https://www.berlin.de/en/events/rubric.rss` RSS | 柏林节庆、活动、文化 | 官方活动源，稳定 |
| Berlin.de Highlights | `https://www.berlin.de/en/events/index.rss` RSS | 周末/月度活动合集 | 快速找柏林近期亮点 |
| visitBerlin Event Calendar | HTML 结构化解析 | 活动日期、地点、票务入口 | 活动粒度细，适合市内计划 |

## 候选源

| 来源 | 状态 | 后续接入方式 |
| --- | --- | --- |
| Urlaubsguru | RSS 从当前环境返回 Basic Auth | 邮件订阅、授权接口或手动收藏入口 |
| Travelzoo Deutschland | 未确认稳定公开 feed | Newsletter parsing 或浏览器适配器 |
| Groupon Berlin | 本地折扣活动价值高 | 浏览器适配器，需反脆弱监控 |
| Eventbrite Berlin | 活动和免费票源丰富 | 官方 API token 或搜索页解析 |
| Fever Berlin | 沉浸式展览、家庭活动 | 浏览器适配器或手动收藏 |
| Center Parcs Angebote | 家庭度假村非常匹配 | 二期做日期/价格定向抓取 |

## 扩展原则

1. 优先 RSS、官方 API、公开结构化数据。
2. 对 HTML 抓取保留错误监控，页面结构变化时不影响其他源。
3. 对需要登录、授权或浏览器渲染的源，单独做 adapter，不放进核心 RSS 管道。
4. 每个源都记录 `focus`、`access`、`quality`、`notes`，方便长期维护。
5. 不保存账号、Cookie 或家庭隐私信息。
