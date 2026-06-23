# 柏林家庭出行雷达

这个项目用于聚合柏林市内活动、柏林周边短途、德国/欧洲旅行折扣、阳光度假目的地、全包酒店套餐和邮轮信息。它面向在柏林生活的家庭，默认考虑宝宝/幼儿和长辈同行的实际需求。

列表卡片优先展示中文标题，并保留源站原文标题，方便快速浏览和回到源站核对。

## 当前功能

- 推荐雷达：汇总旅行折扣、柏林活动、酒店/度假村、机酒套餐、邮轮和全包行程。
- 我的收藏：在浏览器本地保存收藏项目，并可把不感兴趣的项目加入排除列表。
- 儿童活动：柏林市区儿童咖啡馆、亲子音乐会、开放活动、儿童博物馆、剧场和游泳课资料库，带近似地图点位。
- 信息源：展示已接入和候选的旅行/活动资料源。
- 路线规划：按城市半日、周末短途、3-5 天、7 天全包和邮轮整理规划方向。

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
