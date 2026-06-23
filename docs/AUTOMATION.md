# Daily Automation

这个项目的公开站点通过 GitHub Actions 自动更新数据、构建并部署到 GitHub Pages。

## 触发方式

- Push 到 `main`：自动更新数据并部署。
- 手动触发：在 GitHub Actions 页面运行 `Update data and deploy Pages` workflow。
- 每日定时：`05:10 UTC`。

柏林本地时间换算：
- 夏令时 CEST：每天约 `07:10`。
- 冬令时 CET：每天约 `06:10`。

这个时间适合早晨查看，不需要先调整。后续如果想改成更晚的家庭查看时段，可以把 `.github/workflows/pages.yml` 中的 cron 改为新的 UTC 时间。

## 页面状态含义

首页顶部的“每日自动检索”面板会展示：

- 最近更新时间：来自 `radar.generatedAt`。
- 已接入源：已启用来源中本次成功返回的数量。
- 失败来源：已启用来源中本次抓取失败且没有缓存可用的数量。
- 跳过/候选：尚未启用、暂时不适合自动抓取或等待后续接入的来源数量。
- 缓存回退：抓取失败但成功使用上一次缓存数据的来源数量。
- 今日新增：以柏林时区判断，发布日期与本次生成日期同一天的条目。
- 近 7 天新增：发布日期在本次生成时间前 7 天内的条目。

卡片上的“今日新增”和“本周新增”只在有可靠 `publishedAt` 时间时显示。如果源站给的是未来活动日期，页面不会把它误判成新增内容。

## 避暑短住状态

`npm run update-data` 现在也会运行 `scripts/update-heat-status.ts`，生成：

- `src/data/heat-live-status.json`
- `public/heat-live-status.json`

默认无需 key 即可使用 Open-Meteo 拉取柏林未来 16 天天气，并在预测达到 32°C+ / 35°C+ 时触发避暑推荐加权。

可选 GitHub Secrets：

- `SERPAPI_API_KEY`：查询 Google Hotels 价格/可订性线索。
- `GOOGLE_PLACES_API_KEY`：查询 Google Places 最新排序评论样本并提取风险信号。

如果没有配置这些 key，页面会显示“未配置”并提供 Google Hotels / Google Maps 检查入口。

## 手动检查

本地可用：

```bash
npm run build
```

完整更新数据并构建可用：

```bash
npm run check
```

`npm run check` 会重新抓取公开数据源，因此会更新 `src/data/radar-data.json` 和 `public/radar-data.json`。日常开发 UI 时，优先用 `npm run build` 验证，避免无意提交数据快照变化。
