# 避暑短住数据说明

`src/data/heat-escape-stays.json` 是“避暑短住”页面的第一版人工核验候选库，服务高温周末在柏林或柏林周边 1-2 小时范围内找酒店短住的场景。

## 筛选原则

- 优先房间空调证据明确或较可信的酒店。
- 优先有室内/室外泳池、温泉、湖边或 SPA 的酒店。
- 优先适合 3 位成年人和 1 位约 11 个月宝宝的低折腾方案。
- 保留宝宝适配风险、儿童入池规则、空调证据不足、价格偏高等不确定性。
- 不把静态候选库当作实时库存或实时价格。

## 空调证据等级

- `confirmed`：酒店官方房型/住宿页面明确列出空调。
- `likely`：可信第三方酒店页面或酒店目录明确列出客房空调，但仍需要预订前确认具体房型。
- `uncertain`：有设施线索但不足以支撑 35°C+ 高温周末决策。
- `none`：不适合高温周末作为主推荐。

## 第一批候选

- Tropical Islands Resort：官方 Premium room 和 AMAZONIA house 页面列出空调；大型水上度假区，宝宝友好但高峰期人多。
- Van der Valk Hotel Berlin Brandenburg：官方列出泳池、桑拿、家庭房；第三方列出空调客房。
- Sunday/Schwielowsee 湖畔度假村：湖边、泳池和 SPA 线索强；空调主要来自第三方房型页。
- Seminaris SeeHotel Potsdam：近柏林，官方列出泳池和桑拿；空调来自第三方设施页。
- Resort Mark Brandenburg + Fontane Therme：温泉和湖边桑拿强，适合长辈；宝宝友好度需要逐项确认。
- Hotel Doellnsee-Schorfheide：自然湖畔、室内泳池和桑拿；更适合自驾。
- Aspria Berlin Ku'damm：柏林市内低折腾 staycation；儿童泳池/桑拿使用有 family time 限制。
- Hotel Palace Berlin：城市高端 fallback，有官方 spa/pool 线索；不是亲子 resort。

## 主要核验来源

- Tropical Islands: https://www.tropical-islands.de/en/unterkunft/zimmer-dome/premium-doppelzimmer
- Tropical Islands AMAZONIA: https://www.tropical-islands.de/en/unterkunft/sunrise-homes/amazonia-house-standard-4-pers
- Van der Valk Berlin Brandenburg: https://berlin.vandervalk.de/en
- Van der Valk room features: https://www.travelocity.com/Berlin-Hotels-Van-Der-Valk-Hotel-Berlin-Brandenburg.h922217.Hotel-Information
- Sunday/Precise Resort Schwielowsee: https://www.expedia.com/Berlin-Hotels-Precise-Resort-Schwielowsee.h1162510.Hotel-Information
- Seminaris SeeHotel Potsdam wellness: https://www.seminaris.de/en/hotels/potsdam-seehotel-seminaris/gym-wellness/
- Resort Mark Brandenburg: https://www.resort-mark-brandenburg.de/en/
- Hotel Doellnsee-Schorfheide HRS: https://www.hrs.com/en/hotel/391076
- Aspria Berlin Ku'damm: https://www.aspria.com/en/berlin-kudamm/hotel
- Hotel Palace Berlin spa: https://palace.de/en/hotel/spa-fitness

## 下一步

- 增加 Booking/Hotels.com/酒店官网的价格和可订性检查适配器。
- 增加近期评论风险字段，重点捕捉“房间闷热”“空调差”“儿童不方便”“泳池限制”。
- 增加预算筛选和“可免费取消/含早餐/可加婴儿床”筛选。
- 接入天气预报，当柏林预测超过 32-35°C 时自动把该页作为首页重点推荐。
