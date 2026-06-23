import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import type {
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
