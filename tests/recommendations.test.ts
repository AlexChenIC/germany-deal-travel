import assert from "node:assert/strict";
import test from "node:test";
import { buildFamilyRecommendations } from "../src/lib/recommendations";
import type { TravelItem } from "../src/types";

const baseItem: TravelItem = {
  id: "base",
  sourceId: "fixture",
  sourceName: "Fixture",
  title: "Fixture",
  titleZh: "测试条目",
  url: "https://example.com",
  summary: "fixture",
  category: "planning",
  scope: "europe",
  tags: [],
  familyScore: 70,
  familySignals: [],
  fromBerlin: false,
  priorityScore: 60,
};

test("family recommendations bucket relevant items and respect exclusions", () => {
  const berlinEvent: TravelItem = {
    ...baseItem,
    id: "berlin-event",
    title: "Family museum weekend in Berlin",
    titleZh: "柏林亲子博物馆周末",
    category: "event",
    scope: "berlin-city",
    tags: ["family", "museum"],
    fromBerlin: true,
    priorityScore: 82,
    publishedAt: "2026-06-23T08:00:00Z",
  };
  const sunDeal: TravelItem = {
    ...baseItem,
    id: "sun-deal",
    title: "Turkey all inclusive family resort with transfer and flight",
    titleZh: "土耳其全包家庭度假套餐",
    category: "all-inclusive",
    scope: "sun-resort",
    tags: ["all inclusive", "transfer", "flight", "kids"],
    fromBerlin: true,
    priorityScore: 90,
  };
  const excludedCruise: TravelItem = {
    ...baseItem,
    id: "excluded-cruise",
    title: "Mediterranean family cruise balcony cabin",
    titleZh: "地中海家庭邮轮",
    category: "cruise",
    scope: "europe",
    tags: ["cruise", "family"],
    priorityScore: 95,
  };

  const recommendations = buildFamilyRecommendations({
    items: [berlinEvent, sunDeal, excludedCruise],
    kidActivities: [],
    excludedIds: new Set(["excluded-cruise"]),
    generatedAt: "2026-06-23T10:00:00Z",
    timezone: "Europe/Berlin",
  });

  assertBucketIncludes(recommendations.buckets, "berlin-soon", "berlin-event");
  assertBucketIncludes(recommendations.buckets, "sun-all-inclusive", "sun-deal");
  for (const bucket of recommendations.buckets) {
    assert.equal(
      bucket.items.some((item) => item.item.id === "excluded-cruise"),
      false,
      "excluded item should not appear in recommendations",
    );
  }
});

function assertBucketIncludes(
  buckets: ReturnType<typeof buildFamilyRecommendations>["buckets"],
  bucketId: string,
  itemId: string,
) {
  const bucket = buckets.find((candidate) => candidate.id === bucketId);
  assert.ok(bucket, `${bucketId} bucket should exist`);
  assert.ok(
    bucket.items.some((item) => item.item.id === itemId),
    `${bucketId} should include ${itemId}`,
  );
}
