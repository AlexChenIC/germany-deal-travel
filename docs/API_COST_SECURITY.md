# API Cost and Security Checklist

本项目目前使用三类外部 API/服务：

- GitHub Actions secrets 中的 `SERPAPI_API_KEY`：用于每日更新时查询 Google Hotels 价格/可订线索。
- GitHub Actions secrets 中的 `GOOGLE_PLACES_API_KEY`：用于每日更新时查询 Google Places 评分、评论样本和风险信号。
- 可选的 `VITE_GOOGLE_MAPS_EMBED_API_KEY`：用于前端儿童活动页内嵌 Google Maps。

## 当前推荐配置

### Google Cloud Billing

- 已创建 `€10 Monthly budget alert`。
- 注意：Google Cloud Budget 是提醒，不是硬性消费上限。
- 建议保留 50%、90%、100%、150% 阈值。
- 在 Free trial 阶段，不主动点击 `Upgrade`，除非明确需要完整付费账号。

### Google Places API key

- 只放在 GitHub repository secret：`GOOGLE_PLACES_API_KEY`。
- 不要放在 `.env.local` 的 `VITE_` 前端变量里。
- 建议在 Google Cloud Console 中限制可调用 API：只允许 Places API。
- 建议在 Google Maps Platform 的 Quotas 里调低每日/每分钟调用量。

### SerpApi key

- 只放在 GitHub repository secret：`SERPAPI_API_KEY`。
- 当前每日自动检查约 8 个酒店候选；手动多次运行会更快消耗免费额度。
- 若后续扩充酒店数量，需要同时降低运行频率、做缓存或改为按需检查。

### Google Maps Embed key

- 如果使用 `VITE_GOOGLE_MAPS_EMBED_API_KEY`，这个 key 会进入前端构建产物，浏览器可见。
- 建议单独创建一个 Embed 专用 key，不要和 Places 后端 key 混用。
- 建议设置 HTTP referrer 限制：
  - `https://alexchenic.github.io/*`
  - 本地开发需要时可临时加 `http://localhost:*/*`

## 运行量估算

当前每日自动化的大致调用量：

- Open-Meteo：1 次/天，无 key。
- SerpApi Google Hotels：约 8 次/天。
- Google Places：每个酒店约 1-2 次，约 8-16 次/天。

这适合个人低频使用，但不适合高频刷新或大规模酒店池。后续如果候选酒店超过 30 个，应引入更严格缓存和按需检查。

## 后续强化

- 在页面里展示 API 来源成功/失败和缓存回退状态。
- 为 SerpApi 增加月度调用量估算提醒。
- 为酒店价格查询增加日期窗口缓存，避免重复查询同一时间段。
- 如果需要硬停机保护，优先使用 API quota，而不是只依赖 budget alert。
