import assert from "node:assert/strict";
import test from "node:test";
import {
  buildDiscountFocusItems,
  extractDiscountPercent,
  isLikelyIrrelevantTravelDiscount,
} from "../src/lib/discountFocus";
import type { TravelItem } from "../src/types";

const baseItem: TravelItem = {
  id: "base",
  sourceId: "fixture",
  sourceName: "Fixture",
  title: "Fixture",
  titleZh: "测试条目",
  url: "https://example.com",
  summary: "fixture",
  category: "package",
  scope: "europe",
  tags: [],
  familyScore: 70,
  familySignals: [],
  fromBerlin: true,
  priorityScore: 70,
};

test("discount focus extracts percentage and free-night discount signals", () => {
  assert.equal(extractDiscountPercent("Mega-Deal: Bis zu 50% sparen"), 50);
  assert.equal(extractDiscountPercent("4 Nächte reisen und nur 3 Nächte zahlen"), 25);
  assert.equal(extractDiscountPercent("Hotel in Lyon, -47%"), 47);
});

test("discount focus keeps strong family travel deals and filters indirect noise", () => {
  const tuiPackage: TravelItem = {
    ...baseItem,
    id: "tui-package",
    sourceId: "urlaubspiraten",
    sourceName: "Urlaubspiraten",
    title: "Kanaren all inclusive mit Flug, Transfer und Familienhotel bis zu 50%",
    titleZh: "加纳利全包家庭套餐最高 50%",
    category: "all-inclusive",
    scope: "sun-resort",
    tags: ["All Inclusive", "Familienurlaub", "Transfer"],
    priceLabel: "ab 529 € p.P.",
    priceValue: 529,
    familyScore: 86,
    priorityScore: 92,
  };
  const cardDeal: TravelItem = {
    ...baseItem,
    id: "card-deal",
    sourceId: "mydealz-reisen",
    sourceName: "mydealz Reisen",
    title: "DKB Kreditkarte mit Cashback und 50 € Bonus",
    titleZh: "信用卡返现",
    summary: "Kreditkarte, Cashback, Paypal und Amazon Gutschein",
    category: "planning",
    scope: "europe",
    tags: ["cashback"],
    familyScore: 20,
  };

  assert.equal(isLikelyIrrelevantTravelDiscount(cardDeal), true);

  const shortlist = buildDiscountFocusItems([tuiPackage, cardDeal], {
    excludedIds: new Set(),
  });

  assert.equal(shortlist.length, 1);
  assert.equal(shortlist[0].item.id, "tui-package");
  assert.equal(shortlist[0].discountPercent, 50);
  assert.equal(shortlist[0].strength, "excellent");
});
