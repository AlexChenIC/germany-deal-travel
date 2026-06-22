# 柏林家庭出行雷达

这个项目用于聚合柏林市内活动、柏林周边短途、德国/欧洲旅行折扣、阳光度假目的地、全包酒店套餐和邮轮信息。它面向在柏林生活的家庭，默认考虑宝宝/幼儿和长辈同行的实际需求。

## 本地运行

```bash
npm install
npm run update-data
npm run dev
```

## 构建

```bash
npm run check
```

## 数据源

一期接入公开 RSS 和可读 HTML：

- Travel-Dealz
- Urlaubspiraten
- Urlaubstracker
- mydealz Reisen
- Berlin.de Events
- Berlin.de Highlights
- visitBerlin Event Calendar

候选源和接入策略见 [docs/SOURCE_STRATEGY.md](docs/SOURCE_STRATEGY.md)。

## 部署

`.github/workflows/pages.yml` 会在 push、手动触发和每日定时任务中更新数据、构建静态站点并部署到 GitHub Pages。
