import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import type {
  CanaryAllInclusiveData,
  DiscountWatchData,
  HeatEscapeLiveData,
  HeatEscapeStayData,
  KidActivityData,
  RadarData,
} from "../src/types";

const rootDir = process.cwd();

async function readJson<T>(relativePath: string): Promise<T> {
  const rawValue = await readFile(path.join(rootDir, relativePath), "utf8");
  return JSON.parse(rawValue) as T;
}

test("radar data keeps ids, links, and Chinese titles usable", async () => {
  const data = await readJson<RadarData>("src/data/radar-data.json");
  assert.ok(data.generatedAt, "radar data needs a generation timestamp");
  assert.equal(data.stats.total, data.items.length, "stats.total should match item count");
  assertUniqueIds(
    "radar items",
    data.items.map((item) => item.id),
  );

  for (const item of data.items) {
    assert.ok(item.title.trim(), `${item.id} needs an original title`);
    assert.ok(item.titleZh.trim(), `${item.id} needs a Chinese title`);
    assert.match(item.url, /^https?:\/\//, `${item.id} needs a source URL`);
    assert.ok(item.sourceId, `${item.id} needs sourceId`);
    assert.ok(item.sourceName, `${item.id} needs sourceName`);
    assert.ok(item.familyScore >= 0 && item.familyScore <= 100, `${item.id} family score`);
    assert.ok(item.priorityScore >= 0, `${item.id} priority score`);
  }
});

test("canary all-inclusive shortlist keeps sources and evidence usable", async () => {
  const data = await readJson<CanaryAllInclusiveData>(
    "src/data/canary-all-inclusive-options.json",
  );
  assert.ok(data.updatedAt, "canary data needs an update timestamp");
  assert.ok(data.items.length >= 5, "canary shortlist should have several options");
  assertUniqueIds(
    "canary resort options",
    data.items.map((item) => item.id),
  );

  for (const route of data.flightRoutes) {
    assert.ok(route.airportCode, `${route.id} needs airportCode`);
    assert.ok(route.sources.length > 0, `${route.id} needs route sources`);
    route.sources.forEach((source) => assertSourceLink(`${route.id} route`, source));
  }

  assert.ok(data.familyAdviceZh.length >= 3, "canary page needs family advice blocks");
  for (const block of data.familyAdviceZh) {
    assert.ok(block.titleZh.trim(), "family advice block needs a title");
    assert.ok(block.pointsZh.length >= 2, `${block.titleZh} needs concrete points`);
  }

  assert.ok(
    data.curatedBookingLinks.length >= 4,
    "canary page needs curated high-quality booking links",
  );
  for (const link of data.curatedBookingLinks) {
    assert.match(link.url, /^https?:\/\//, `${link.label} curated URL`);
    assert.ok(link.reasonZh, `${link.label} needs a reason`);
    assert.ok(link.fitZh, `${link.label} needs a fit note`);
    assert.ok(link.cautionZh, `${link.label} needs a caution note`);
  }

  assert.ok(data.searchJumpLinks.length >= 4, "canary page needs search jump links");
  for (const jump of data.searchJumpLinks) {
    assert.match(jump.url, /^https?:\/\//, `${jump.label} jump URL`);
    assert.ok(jump.prefilledZh.length > 0, `${jump.label} needs prefilled notes`);
    assert.ok(jump.setManuallyZh.length > 0, `${jump.label} needs manual filter notes`);
  }

  for (const item of data.items) {
    assert.ok(item.nameZh.trim(), `${item.id} needs a Chinese name`);
    assert.ok(item.fitScore >= 0 && item.fitScore <= 100, `${item.id} fit score`);
    assert.ok(item.transferMinutes > 0, `${item.id} transfer minutes`);
    assert.ok(item.priceHints.length > 0, `${item.id} needs price hints`);
    assert.ok(item.sourceLinks.length >= 2, `${item.id} needs source links`);
    assert.ok(item.bookingLinks.length > 0, `${item.id} needs booking links`);
    Object.values(item.facilities).forEach((facility) => {
      assert.ok(facility.labelZh, `${item.id} facility label`);
      assert.ok(facility.detailZh, `${item.id} facility detail`);
    });
    item.priceHints.forEach((hint) => {
      assert.match(hint.sourceUrl, /^https?:\/\//, `${item.id} price hint URL`);
      assert.ok(hint.noteZh, `${item.id} price hint note`);
    });
    item.sourceLinks.forEach((source) => assertSourceLink(`${item.id} source`, source));
    item.bookingLinks.forEach((source) => assertSourceLink(`${item.id} booking`, source));
  }
});

test("discount watch sources stay focused and actionable", async () => {
  const data = await readJson<DiscountWatchData>("src/data/discount-source-watch.json");
  assert.ok(data.updatedAt, "discount watch data needs an update timestamp");
  assert.ok(data.designVerdictZh.length > 30, "discount watch needs a design verdict");
  assert.ok(data.principlesZh.length >= 3, "discount watch needs design principles");
  assert.ok(data.sources.length >= 8, "discount watch needs enough curated sources");
  assert.ok(
    data.sources.filter((source) => source.priority === "primary").length >= 4,
    "discount watch needs several primary sources",
  );
  assertUniqueIds(
    "discount watch sources",
    data.sources.map((source) => source.id),
  );

  for (const source of data.sources) {
    assert.ok(source.name.trim(), `${source.id} needs a source name`);
    assert.match(source.url, /^https?:\/\//, `${source.id} needs URL`);
    assert.ok(source.headlineZh.trim(), `${source.id} needs Chinese headline`);
    assert.ok(source.discountSignalZh.trim(), `${source.id} needs discount signal`);
    assert.ok(source.thresholdZh.trim(), `${source.id} needs threshold rule`);
    assert.ok(source.familyFitZh.trim(), `${source.id} needs family fit`);
    assert.ok(source.useForZh.length > 0, `${source.id} needs use cases`);
    assert.ok(source.caveatsZh.length > 0, `${source.id} needs caveats`);
    assert.ok(source.evidence.length > 0, `${source.id} needs evidence links`);
    source.evidence.forEach((evidence) => assertSourceLink(`${source.id} evidence`, evidence));
  }
});

test("kids activities keep suitability data and valid Berlin map points", async () => {
  const data = await readJson<KidActivityData>("src/data/kids-activities.json");
  assert.ok(data.items.length > 0, "kids activity catalog should not be empty");
  assertUniqueIds(
    "kids activities",
    data.items.map((activity) => activity.id),
  );

  let mappedCount = 0;
  for (const activity of data.items) {
    assert.ok(activity.nameZh.trim(), `${activity.id} needs a Chinese name`);
    assert.ok(activity.summaryZh.trim(), `${activity.id} needs a Chinese summary`);
    assert.ok(activity.suitability, `${activity.id} needs suitability metadata`);
    assert.ok(
      activity.suitability.verificationDate,
      `${activity.id} needs verificationDate`,
    );
    assert.ok(activity.suitability.refreshAfter, `${activity.id} needs refreshAfter`);
    assert.ok(Array.isArray(activity.suitability.notesZh), `${activity.id} notes`);

    const hasLat = typeof activity.lat === "number";
    const hasLng = typeof activity.lng === "number";
    assert.equal(hasLat, hasLng, `${activity.id} should provide lat and lng together`);
    if (hasLat && hasLng) {
      mappedCount += 1;
      assert.ok(activity.lat! > 52 && activity.lat! < 53, `${activity.id} latitude`);
      assert.ok(activity.lng! > 13 && activity.lng! < 14, `${activity.id} longitude`);
    }
  }
  assert.ok(mappedCount >= 10, "kids map should have enough concrete points");
});

test("heat live status covers every heat escape stay", async () => {
  const stays = await readJson<HeatEscapeStayData>("src/data/heat-escape-stays.json");
  const live = await readJson<HeatEscapeLiveData>("src/data/heat-live-status.json");
  const stayIds = stays.items.map((stay) => stay.id).sort();
  const liveIds = live.items.map((status) => status.id).sort();

  assert.deepEqual(liveIds, stayIds, "live status should cover all heat stays");
  assert.ok(live.weather.days.length > 0, "weather forecast should contain days");
  assert.ok(live.weather.trigger.messageZh, "weather trigger needs Chinese message");
  assert.ok(live.sourceStatus.price.messageZh, "price source status needs Chinese message");
  assert.ok(live.sourceStatus.reviews.messageZh, "review source status needs Chinese message");

  for (const item of live.items) {
    assert.ok(item.updatedAt, `${item.id} needs updatedAt`);
    assert.ok(item.recommendationLabelZh, `${item.id} needs recommendation label`);
    assert.match(item.price.sourceUrl, /^https?:\/\//, `${item.id} price source URL`);
    assert.ok(item.price.messageZh, `${item.id} price message`);
    assert.ok(item.reviews.messageZh, `${item.id} review message`);
    assert.ok(item.reviews.riskLevel, `${item.id} review risk level`);
  }
});

function assertUniqueIds(label: string, ids: string[]) {
  assert.equal(new Set(ids).size, ids.length, `${label} should have unique ids`);
}

function assertSourceLink(label: string, source: { label: string; url: string; noteZh: string }) {
  assert.ok(source.label.trim(), `${label} needs label`);
  assert.match(source.url, /^https?:\/\//, `${label} needs URL`);
  assert.ok(source.noteZh.trim(), `${label} needs note`);
}
