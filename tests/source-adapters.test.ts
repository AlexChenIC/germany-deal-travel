import test from "node:test";
import assert from "node:assert/strict";
import {
  createSourceAdapters,
  fetchItemsWithAdapters,
} from "../scripts/radar/source-adapters";
import type { SourceDefinition, TravelItem } from "../src/types";

const baseSource: SourceDefinition = {
  id: "travel-feed",
  name: "Travel Feed",
  homepage: "https://example.com",
  kind: "rss",
  status: "active",
  enabled: true,
  url: "https://example.com/rss.xml",
  focus: ["travel-deals"],
  access: "public",
  quality: "high",
  notes: "fixture",
};

const fixtureItem: TravelItem = {
  id: "fixture",
  sourceId: "travel-feed",
  sourceName: "Travel Feed",
  title: "Fixture",
  titleZh: "测试条目",
  url: "https://example.com/item",
  summary: "Fixture summary",
  category: "planning",
  scope: "europe",
  tags: ["测试"],
  familyScore: 70,
  familySignals: [],
  fromBerlin: false,
  priorityScore: 80,
};

test("rss adapter handles enabled RSS sources", async () => {
  const adapters = createSourceAdapters({
    fetchRssItems: async () => [fixtureItem],
    fetchVisitBerlinEvents: async () => [],
  });

  const items = await fetchItemsWithAdapters(baseSource, adapters);

  assert.equal(items.length, 1);
  assert.equal(items[0].id, "fixture");
});

test("visitBerlin adapter is selected by source id", async () => {
  const adapters = createSourceAdapters({
    fetchRssItems: async () => [],
    fetchVisitBerlinEvents: async () => [fixtureItem],
  });
  const source: SourceDefinition = {
    ...baseSource,
    id: "visitberlin-events",
    kind: "html",
    url: "https://www.visitberlin.de/en/event-calendar-berlin",
  };

  const items = await fetchItemsWithAdapters(source, adapters);

  assert.equal(items.length, 1);
});

test("unsupported sources return no items instead of failing", async () => {
  const adapters = createSourceAdapters({
    fetchRssItems: async () => [fixtureItem],
    fetchVisitBerlinEvents: async () => [fixtureItem],
  });
  const source: SourceDefinition = {
    ...baseSource,
    kind: "manual",
    url: undefined,
  };

  const items = await fetchItemsWithAdapters(source, adapters);

  assert.deepEqual(items, []);
});
