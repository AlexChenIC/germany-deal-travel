import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import type {
  AlpineBorderPlanData,
  CanaryAllInclusiveData,
  DiscountWatchData,
  HeatEscapeLiveData,
  HeatEscapeStayData,
  KidActivityData,
  RadarData,
  RvFamilyGuideData,
  SummerAllInclusiveData,
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

test("summer all-inclusive recommendations stay actionable", async () => {
  const data = await readJson<SummerAllInclusiveData>(
    "src/data/summer-all-inclusive-recommendations.json",
  );
  assert.ok(data.updatedAt, "summer recommendations need an update timestamp");
  assert.ok(data.verdictZh.length > 30, "summer page needs a clear verdict");
  assert.ok(data.quickTakeawaysZh.length >= 4, "summer page needs quick takeaways");
  assert.ok(data.destinations.length >= 5, "summer page needs several destinations");
  assert.ok(data.roadTripIntroZh.length > 30, "summer page needs a road-trip intro");
  assert.ok(data.roadTripStays.length >= 6, "summer page needs road-trip stays");
  assert.ok(data.dealSignals.length >= 4, "summer page needs deal signals");
  assert.ok(data.searchPortals.length >= 5, "summer page needs search portals");
  assertUniqueIds(
    "summer deal signals",
    data.dealSignals.map((signal) => signal.id),
  );
  assertUniqueIds(
    "summer road-trip stays",
    data.roadTripStays.map((stay) => stay.id),
  );
  assertUniqueIds(
    "summer destinations",
    data.destinations.map((destination) => destination.id),
  );

  const ranks = data.destinations.map((destination) => destination.rank);
  assert.deepEqual(
    ranks,
    [...ranks].sort((a, b) => a - b),
    "summer destinations should be rank-sorted",
  );
  assert.ok(
    data.destinations.some((destination) => destination.budgetFit === "target"),
    "summer page needs at least one target-budget option",
  );
  assert.ok(
    data.roadTripStays.some((stay) => stay.country === "germany") &&
      data.roadTripStays.some((stay) => stay.country === "czechia"),
    "summer road-trip stays should cover Germany and Czechia",
  );
  assert.ok(
    data.roadTripStays.some(
      (stay) => stay.mealPlanLevel === "true-ai" || stay.mealPlanLevel === "kids-ai",
    ),
    "summer road-trip stays need at least one true all-inclusive option",
  );
  assert.ok(
    data.roadTripStays.some((stay) => stay.budgetFit === "target"),
    "summer road-trip stays need at least one target-budget option",
  );

  for (const signal of data.dealSignals) {
    assert.ok(signal.titleZh.trim(), `${signal.id} needs a Chinese title`);
    assert.ok(signal.priceLabelZh.trim(), `${signal.id} needs a price label`);
    assert.match(signal.url, /^https?:\/\//, `${signal.id} needs URL`);
    assert.ok(signal.evidence.length > 0, `${signal.id} needs evidence`);
    signal.evidence.forEach((source) => assertSourceLink(`${signal.id} evidence`, source));
  }

  for (const stay of data.roadTripStays) {
    assert.ok(stay.nameZh.trim(), `${stay.id} needs a Chinese name`);
    assert.ok(stay.driveHours > 0 && stay.driveHours <= 5, `${stay.id} drive hours`);
    assert.ok(stay.driveTimeZh.trim(), `${stay.id} needs drive time`);
    assert.ok(stay.fitScore >= 0 && stay.fitScore <= 100, `${stay.id} fit score`);
    assert.ok(stay.mealPlanZh.trim(), `${stay.id} needs meal-plan notes`);
    assert.ok(stay.priceExpectationZh.trim(), `${stay.id} needs price notes`);
    assert.ok(stay.babyFitZh.trim(), `${stay.id} needs baby fit`);
    assert.ok(stay.poolSpaZh.trim(), `${stay.id} needs pool/spa notes`);
    assert.ok(stay.bestForZh.trim(), `${stay.id} needs best-for note`);
    assert.ok(stay.whyZh.length >= 2, `${stay.id} needs reasons`);
    assert.ok(stay.risksZh.length >= 2, `${stay.id} needs risks`);
    assert.ok(stay.sourceLinks.length >= 2, `${stay.id} needs source links`);
    assert.ok(stay.bookingLinks.length > 0, `${stay.id} needs booking links`);
    stay.sourceLinks.forEach((source) => assertSourceLink(`${stay.id} source`, source));
    stay.bookingLinks.forEach((source) => assertSourceLink(`${stay.id} booking`, source));
  }

  for (const destination of data.destinations) {
    assert.ok(destination.destinationZh.trim(), `${destination.id} needs a destination`);
    assert.ok(
      destination.fitScore >= 0 && destination.fitScore <= 100,
      `${destination.id} fit score`,
    );
    assert.ok(destination.priceExpectationZh.trim(), `${destination.id} price expectation`);
    assert.ok(destination.whyZh.length >= 2, `${destination.id} needs reasons`);
    assert.ok(destination.risksZh.length >= 2, `${destination.id} needs risks`);
    assert.ok(destination.searchTermsZh.length >= 2, `${destination.id} needs search terms`);
    assert.ok(
      destination.priorityFiltersZh.length >= 4,
      `${destination.id} needs priority filters`,
    );
    assert.ok(destination.evidence.length > 0, `${destination.id} needs evidence links`);
    assert.ok(destination.bookingLinks.length > 0, `${destination.id} needs booking links`);
    destination.evidence.forEach((source) =>
      assertSourceLink(`${destination.id} evidence`, source),
    );
    destination.bookingLinks.forEach((source) =>
      assertSourceLink(`${destination.id} booking`, source),
    );
  }

  for (const portal of data.searchPortals) {
    assert.match(portal.url, /^https?:\/\//, `${portal.label} portal URL`);
    assert.ok(portal.intentZh.trim(), `${portal.label} needs intent`);
    assert.ok(portal.setManuallyZh.length >= 3, `${portal.label} needs manual filters`);
  }
});

test("baltic sea short-stay shortlist keeps urgent weekend choices actionable", async () => {
  const data = await readJson<{
    updatedAt: string;
    verdictZh: string;
    quickTakeawaysZh: string[];
    weatherCards: Array<{ placeZh: string; forecastZh: string; heatFitZh: string }>;
    destinationNotes: Array<{ nameZh: string; summaryZh: string; bestForZh: string }>;
    candidates: Array<{
      id: string;
      nameZh: string;
      destinationZh: string;
      fitScore: number;
      mealPlanLevel: string;
      driveTimeZh: string;
      travelWindowFitZh: string;
      priceZh: string;
      coolingZh: string;
      babyFitZh: string;
      poolSpaZh: string;
      recommendationZh: string;
      reasonsZh: string[];
      risksZh: string[];
      sourceLinks: Array<{ label: string; url: string; noteZh: string }>;
      bookingLinks: Array<{ label: string; url: string; noteZh: string }>;
    }>;
    regularBookingLinks: Array<{
      site: string;
      label: string;
      intentZh: string;
      url: string;
      cautionZh: string;
    }>;
    actionPlanZh: string[];
  }>("src/data/baltic-sea-shortlist.json");

  assert.ok(data.updatedAt, "baltic shortlist needs an update timestamp");
  assert.ok(data.verdictZh.length > 60, "baltic shortlist needs a clear verdict");
  assert.ok(data.quickTakeawaysZh.length >= 5, "baltic shortlist needs quick takeaways");
  assert.ok(data.weatherCards.length >= 4, "baltic shortlist needs weather context");
  assert.ok(data.destinationNotes.length >= 2, "baltic shortlist needs destination notes");
  assert.ok(data.candidates.length >= 5, "baltic shortlist needs several candidates");
  assert.ok(data.regularBookingLinks.length >= 4, "baltic shortlist needs booking fallbacks");
  assert.ok(data.actionPlanZh.length >= 4, "baltic shortlist needs a booking action plan");
  assertUniqueIds(
    "baltic candidates",
    data.candidates.map((candidate) => candidate.id),
  );
  assert.ok(
    data.candidates.some((candidate) => candidate.mealPlanLevel === "true-ai"),
    "baltic shortlist needs at least one true all-inclusive signal",
  );
  assert.ok(
    data.candidates.some((candidate) => candidate.id.includes("ruegen")),
    "baltic shortlist should cover Ruegen options",
  );
  assert.ok(
    data.candidates.some((candidate) => candidate.id.includes("kolobrzeg")),
    "baltic shortlist should cover Polish coast options",
  );

  for (const weather of data.weatherCards) {
    assert.ok(weather.placeZh.trim(), "weather card needs place");
    assert.ok(weather.forecastZh.trim(), `${weather.placeZh} needs forecast`);
    assert.ok(weather.heatFitZh.trim(), `${weather.placeZh} needs heat fit`);
  }

  for (const destination of data.destinationNotes) {
    assert.ok(destination.nameZh.trim(), "destination note needs name");
    assert.ok(destination.summaryZh.length > 40, `${destination.nameZh} needs summary`);
    assert.ok(destination.bestForZh.trim(), `${destination.nameZh} needs best-for note`);
  }

  for (const candidate of data.candidates) {
    assert.ok(candidate.nameZh.trim(), `${candidate.id} needs a Chinese name`);
    assert.ok(candidate.destinationZh.trim(), `${candidate.id} needs destination`);
    assert.ok(candidate.fitScore >= 0 && candidate.fitScore <= 100, `${candidate.id} fit score`);
    assert.ok(candidate.driveTimeZh.trim(), `${candidate.id} needs drive time`);
    assert.ok(candidate.travelWindowFitZh.trim(), `${candidate.id} needs travel window fit`);
    assert.ok(candidate.priceZh.trim(), `${candidate.id} needs price notes`);
    assert.ok(candidate.coolingZh.trim(), `${candidate.id} needs cooling notes`);
    assert.ok(candidate.babyFitZh.trim(), `${candidate.id} needs baby fit`);
    assert.ok(candidate.poolSpaZh.trim(), `${candidate.id} needs pool/spa notes`);
    assert.ok(candidate.recommendationZh.trim(), `${candidate.id} needs recommendation`);
    assert.ok(candidate.reasonsZh.length >= 2, `${candidate.id} needs reasons`);
    assert.ok(candidate.risksZh.length >= 2, `${candidate.id} needs risks`);
    assert.ok(candidate.sourceLinks.length > 0, `${candidate.id} needs source links`);
    assert.ok(candidate.bookingLinks.length > 0, `${candidate.id} needs booking links`);
    candidate.sourceLinks.forEach((source) =>
      assertSourceLink(`${candidate.id} source`, source),
    );
    candidate.bookingLinks.forEach((source) =>
      assertSourceLink(`${candidate.id} booking`, source),
    );
  }

  for (const link of data.regularBookingLinks) {
    assert.ok(link.site.trim(), `${link.label} needs site`);
    assert.ok(link.label.trim(), `${link.site} needs label`);
    assert.match(link.url, /^https?:\/\//, `${link.label} booking fallback URL`);
    assert.ok(link.intentZh.trim(), `${link.label} needs intent`);
    assert.ok(link.cautionZh.trim(), `${link.label} needs caution`);
  }
});

test("budapest return plan keeps flight, hotel, and transfer decisions actionable", async () => {
  const data = await readJson<{
    updatedAt: string;
    verdictZh: string;
    quickTakeawaysZh: string[];
    flightPlan: {
      routeZh: string;
      operatorZh: string;
      scheduleZh: string;
      sourceLinks: Array<{ label: string; url: string; noteZh: string }>;
    };
    dateOptimization: {
      recommendationZh: string;
      climateSummaryZh: string;
      dateCandidates: Array<{
        id: string;
        dateZh: string;
        score: number;
        verdictZh: string;
        vaccineBufferZh: string;
        schoolFitZh: string;
        ningboClimateZh: string;
        risksZh: string[];
      }>;
      sourceLinks: Array<{ label: string; url: string; noteZh: string }>;
    };
    recommendedItineraries: Array<{
      id: string;
      nameZh: string;
      fitScore: number;
      dayPlanZh: string[];
      risksZh: string[];
    }>;
    transportOptions: Array<{
      id: string;
      modeZh: string;
      rank: number;
      headlineZh: string;
      babyFitZh: string;
      prosZh: string[];
      consZh: string[];
      sourceLinks: Array<{ label: string; url: string; noteZh: string }>;
    }>;
    hotelOptions: Array<{
      id: string;
      nameZh: string;
      fitScore: number;
      boardLevel: string;
      boardZh: string;
      babyFitZh: string;
      poolSpaZh: string;
      prosZh: string[];
      risksZh: string[];
      sourceLinks: Array<{ label: string; url: string; noteZh: string }>;
      bookingLinks: Array<{ label: string; url: string; noteZh: string }>;
    }>;
    airportConnection: {
      recommendedZh: string;
      publicTransportZh: string;
      taxiZh: string;
      airportTimingZh: string;
      sourceLinks: Array<{ label: string; url: string; noteZh: string }>;
    };
    cityPacingZh: string[];
    bookingChecklistZh: string[];
    bookingLinks: Array<{ site: string; label: string; url: string; intentZh: string }>;
  }>("src/data/budapest-ningbo-return-plan.json");

  assert.ok(data.updatedAt, "budapest return plan needs an update timestamp");
  assert.ok(data.verdictZh.length > 80, "budapest return plan needs a clear verdict");
  assert.ok(data.quickTakeawaysZh.length >= 5, "budapest return plan needs takeaways");
  assert.ok(data.flightPlan.routeZh.includes("Budapest"), "flight plan needs Budapest route");
  assert.ok(data.flightPlan.routeZh.includes("Ningbo"), "flight plan needs Ningbo route");
  assert.ok(data.flightPlan.operatorZh.includes("FM898"), "flight plan needs FM898");
  assert.ok(data.flightPlan.scheduleZh.includes("周一"), "flight plan needs Monday schedule");
  assert.ok(data.flightPlan.scheduleZh.includes("周四"), "flight plan needs Thursday schedule");
  assert.ok(data.flightPlan.sourceLinks.length >= 2, "flight plan needs evidence");
  data.flightPlan.sourceLinks.forEach((source) =>
    assertSourceLink("budapest return flight source", source),
  );
  assert.ok(
    data.dateOptimization.recommendationZh.includes("2026-09-17"),
    "date optimization should prefer 2026-09-17",
  );
  assert.ok(
    data.dateOptimization.climateSummaryZh.includes("宁波"),
    "date optimization needs Ningbo climate summary",
  );
  assert.ok(data.dateOptimization.dateCandidates.length >= 5, "needs date candidates");
  assert.ok(data.dateOptimization.sourceLinks.length >= 2, "date optimization needs sources");
  assertUniqueIds(
    "budapest return date candidates",
    data.dateOptimization.dateCandidates.map((item) => item.id),
  );
  data.dateOptimization.sourceLinks.forEach((source) =>
    assertSourceLink("date optimization source", source),
  );
  assert.ok(
    data.dateOptimization.dateCandidates.some(
      (candidate) => candidate.dateZh === "2026-09-17" && candidate.score >= 90,
    ),
    "2026-09-17 should be the high-scoring date",
  );
  assert.ok(
    data.dateOptimization.dateCandidates.some(
      (candidate) => candidate.dateZh === "2026-09-10" && candidate.score < 80,
    ),
    "2026-09-10 should no longer be the default high-score date",
  );

  assert.ok(data.recommendedItineraries.length >= 2, "needs itinerary options");
  assert.ok(data.transportOptions.length >= 4, "needs flight, train, bus, and car comparison");
  assert.ok(data.hotelOptions.length >= 3, "needs hotel options");
  assert.ok(data.cityPacingZh.length >= 4, "needs city pacing notes");
  assert.ok(data.bookingChecklistZh.length >= 5, "needs booking checklist");
  assert.ok(data.bookingLinks.length >= 4, "needs booking links");
  assertUniqueIds(
    "budapest return itineraries",
    data.recommendedItineraries.map((item) => item.id),
  );
  assertUniqueIds(
    "budapest return transport options",
    data.transportOptions.map((item) => item.id),
  );
  assertUniqueIds(
    "budapest return hotels",
    data.hotelOptions.map((item) => item.id),
  );

  assert.ok(
    data.transportOptions.some((option) => option.id === "ber-bud-flight" && option.rank === 1),
    "flight should be the top Berlin-Budapest recommendation",
  );
  assert.ok(
    data.transportOptions.some((option) => option.id === "ber-bud-coach"),
    "bus option should be explicitly assessed",
  );
  assert.ok(
    data.hotelOptions.some((hotel) => hotel.id === "aquaworld-resort-budapest"),
    "Aquaworld should be present",
  );
  assert.ok(
    data.hotelOptions.some((hotel) => /half|full|board/i.test(hotel.boardLevel)),
    "needs at least one board-included hotel",
  );

  for (const itinerary of data.recommendedItineraries) {
    assert.ok(itinerary.nameZh.trim(), `${itinerary.id} needs name`);
    assert.ok(itinerary.fitScore >= 0 && itinerary.fitScore <= 100, `${itinerary.id} fit score`);
    assert.ok(itinerary.dayPlanZh.length >= 3, `${itinerary.id} needs day plan`);
    assert.ok(itinerary.risksZh.length >= 2, `${itinerary.id} needs risks`);
  }

  for (const candidate of data.dateOptimization.dateCandidates) {
    assert.ok(candidate.dateZh.trim(), `${candidate.id} needs date`);
    assert.ok(candidate.score >= 0 && candidate.score <= 100, `${candidate.id} score`);
    assert.ok(candidate.verdictZh.trim(), `${candidate.id} needs verdict`);
    assert.ok(candidate.vaccineBufferZh.trim(), `${candidate.id} needs vaccine buffer`);
    assert.ok(candidate.schoolFitZh.trim(), `${candidate.id} needs school fit`);
    assert.ok(candidate.ningboClimateZh.trim(), `${candidate.id} needs Ningbo climate`);
    assert.ok(candidate.risksZh.length >= 2, `${candidate.id} needs risks`);
  }

  for (const option of data.transportOptions) {
    assert.ok(option.modeZh.trim(), `${option.id} needs mode`);
    assert.ok(option.rank > 0, `${option.id} needs rank`);
    assert.ok(option.headlineZh.trim(), `${option.id} needs headline`);
    assert.ok(option.babyFitZh.trim(), `${option.id} needs baby fit`);
    assert.ok(option.prosZh.length >= 2, `${option.id} needs pros`);
    assert.ok(option.consZh.length >= 2, `${option.id} needs cons`);
    option.sourceLinks.forEach((source) => assertSourceLink(`${option.id} source`, source));
  }

  for (const hotel of data.hotelOptions) {
    assert.ok(hotel.nameZh.trim(), `${hotel.id} needs Chinese name`);
    assert.ok(hotel.fitScore >= 0 && hotel.fitScore <= 100, `${hotel.id} fit score`);
    assert.ok(hotel.boardZh.trim(), `${hotel.id} needs board notes`);
    assert.ok(hotel.babyFitZh.trim(), `${hotel.id} needs baby fit`);
    assert.ok(hotel.poolSpaZh.trim(), `${hotel.id} needs pool/spa notes`);
    assert.ok(hotel.prosZh.length >= 2, `${hotel.id} needs pros`);
    assert.ok(hotel.risksZh.length >= 2, `${hotel.id} needs risks`);
    assert.ok(hotel.sourceLinks.length > 0, `${hotel.id} needs sources`);
    assert.ok(hotel.bookingLinks.length > 0, `${hotel.id} needs booking links`);
    hotel.sourceLinks.forEach((source) => assertSourceLink(`${hotel.id} source`, source));
    hotel.bookingLinks.forEach((source) => assertSourceLink(`${hotel.id} booking`, source));
  }

  assert.ok(data.airportConnection.recommendedZh.trim(), "airport recommendation needed");
  assert.ok(data.airportConnection.publicTransportZh.trim(), "airport public transport needed");
  assert.ok(data.airportConnection.taxiZh.trim(), "airport taxi needed");
  assert.ok(data.airportConnection.airportTimingZh.trim(), "airport timing needed");
  data.airportConnection.sourceLinks.forEach((source) =>
    assertSourceLink("airport connection source", source),
  );

  for (const link of data.bookingLinks) {
    assert.ok(link.site.trim(), `${link.label} needs site`);
    assert.ok(link.label.trim(), `${link.site} needs label`);
    assert.match(link.url, /^https?:\/\//, `${link.label} booking URL`);
    assert.ok(link.intentZh.trim(), `${link.label} needs intent`);
  }
});

test("discount watch sources stay focused and actionable", async () => {
  const data = await readJson<DiscountWatchData>("src/data/discount-source-watch.json");
  assert.ok(data.updatedAt, "discount watch data needs an update timestamp");
  assert.ok(data.designVerdictZh.length > 30, "discount watch needs a design verdict");
  assert.ok(data.principlesZh.length >= 3, "discount watch needs design principles");
  assert.ok(
    data.regularBookingLinks.length >= 5,
    "discount watch needs regular booking links",
  );
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

  for (const link of data.regularBookingLinks) {
    assert.ok(link.name.trim(), `${link.id} needs name`);
    assert.match(link.url, /^https?:\/\//, `${link.id} needs URL`);
    assert.ok(link.categoryZh.trim(), `${link.id} needs category`);
    assert.ok(link.useForZh.trim(), `${link.id} needs use case`);
    assert.ok(link.bestWhenZh.trim(), `${link.id} needs best-use note`);
    assert.ok(link.cautionZh.trim(), `${link.id} needs caution`);
  }
});

test("rv family guide keeps beginner decisions actionable", async () => {
  const data = await readJson<RvFamilyGuideData>("src/data/rv-family-guide.json");
  assert.ok(data.updatedAt, "rv guide needs an update timestamp");
  assert.ok(data.verdictZh.length > 50, "rv guide needs a clear verdict");
  assert.ok(data.recommendedFirstStepZh.length > 30, "rv guide needs first step");
  assert.ok(data.quickTakeawaysZh.length >= 4, "rv guide needs takeaways");
  assert.ok(data.guideCards.length >= 4, "rv guide needs guide cards");
  assert.ok(data.rentalPortals.length >= 4, "rv guide needs rental portals");
  assert.ok(data.routes.length >= 5, "rv guide needs route recommendations");
  assert.ok(data.budgetScenarios.length >= 3, "rv guide needs budget scenarios");
  assertUniqueIds(
    "rv guide cards",
    data.guideCards.map((card) => card.id),
  );
  assertUniqueIds(
    "rv rental portals",
    data.rentalPortals.map((portal) => portal.id),
  );
  assertUniqueIds(
    "rv route recommendations",
    data.routes.map((route) => route.id),
  );
  assertUniqueIds(
    "rv budget scenarios",
    data.budgetScenarios.map((scenario) => scenario.id),
  );
  assert.ok(
    data.guideCards.some((card) => card.priority === "must"),
    "rv guide needs must-check safety cards",
  );
  assert.ok(
    data.routes.some((route) => route.suitability === "recommended"),
    "rv guide needs at least one recommended first route",
  );

  for (const card of data.guideCards) {
    assert.ok(card.titleZh.trim(), `${card.id} needs title`);
    assert.ok(card.summaryZh.trim(), `${card.id} needs summary`);
    assert.ok(card.pointsZh.length >= 3, `${card.id} needs practical points`);
    assert.ok(card.sources.length > 0, `${card.id} needs sources`);
    card.sources.forEach((source) => assertSourceLink(`${card.id} source`, source));
  }

  for (const portal of data.rentalPortals) {
    assert.ok(portal.name.trim(), `${portal.id} needs name`);
    assert.match(portal.url, /^https?:\/\//, `${portal.id} needs URL`);
    assert.ok(portal.fitZh.trim(), `${portal.id} needs fit note`);
    assert.ok(portal.bestForZh.trim(), `${portal.id} needs best-for note`);
    assert.ok(portal.cautionZh.trim(), `${portal.id} needs caution`);
    assert.ok(portal.mustCheckZh.length >= 4, `${portal.id} needs must-check list`);
    assert.ok(portal.evidence.length > 0, `${portal.id} needs evidence`);
    portal.evidence.forEach((source) => assertSourceLink(`${portal.id} evidence`, source));
  }

  for (const route of data.routes) {
    assert.ok(route.titleZh.trim(), `${route.id} needs title`);
    assert.ok(route.distanceKm > 0, `${route.id} needs distance`);
    assert.ok(route.nightsZh.trim(), `${route.id} needs nights`);
    assert.ok(route.summerFitZh.trim(), `${route.id} needs summer fit`);
    assert.ok(route.babyFitZh.trim(), `${route.id} needs baby fit`);
    assert.ok(route.routeStopsZh.length >= 3, `${route.id} needs route stops`);
    assert.ok(route.whyZh.length >= 2, `${route.id} needs reasons`);
    assert.ok(route.risksZh.length >= 2, `${route.id} needs risks`);
    assert.ok(route.bookingHintsZh.length >= 2, `${route.id} needs booking hints`);
    assert.ok(route.sources.length > 0, `${route.id} needs sources`);
    route.sources.forEach((source) => assertSourceLink(`${route.id} source`, source));
  }

  for (const scenario of data.budgetScenarios) {
    assert.ok(scenario.titleZh.trim(), `${scenario.id} needs title`);
    assert.ok(scenario.nights > 0, `${scenario.id} needs nights`);
    assert.ok(scenario.totalZh.includes("EUR"), `${scenario.id} needs EUR total`);
    assert.ok(scenario.verdictZh.trim(), `${scenario.id} needs verdict`);
  }
});

test("alpine border family plan keeps route and hotel decisions actionable", async () => {
  const data = await readJson<AlpineBorderPlanData>(
    "src/data/alpine-border-family-plan.json",
  );
  assert.ok(data.updatedAt, "alpine plan needs an update timestamp");
  assert.ok(data.verdictZh.length > 60, "alpine plan needs a clear verdict");
  assert.ok(data.quickTakeawaysZh.length >= 5, "alpine plan needs practical takeaways");
  assert.ok(data.hotelOptions.length >= 2, "alpine plan needs hotel comparisons");
  assert.ok(data.drivePlan.length >= 6, "alpine plan needs outbound and return driving days");
  assert.ok(data.dayPlans.length >= 6, "alpine plan needs a local itinerary");
  assert.ok(data.bookingChecklistZh.length >= 5, "alpine plan needs booking checks");
  assert.ok(data.areaAlternatives.length >= 3, "alpine plan needs regional alternatives");
  assertUniqueIds(
    "alpine hotels",
    data.hotelOptions.map((hotel) => hotel.id),
  );
  assertUniqueIds(
    "alpine drive legs",
    data.drivePlan.map((leg) => leg.id),
  );
  assertUniqueIds(
    "alpine day plans",
    data.dayPlans.map((day) => day.id),
  );

  assert.ok(
    data.hotelOptions.some((hotel) => hotel.fitLevel === "best"),
    "alpine plan needs a best hotel recommendation",
  );
  assert.ok(
    data.drivePlan.filter((leg) => leg.direction === "outbound").length >= 3,
    "alpine plan needs at least three outbound legs",
  );
  assert.ok(
    data.drivePlan.filter((leg) => leg.direction === "return").length >= 3,
    "alpine plan needs at least three return legs",
  );

  for (const hotel of data.hotelOptions) {
    assert.ok(hotel.nameZh.trim(), `${hotel.id} needs Chinese name`);
    assert.ok(hotel.fitScore >= 0 && hotel.fitScore <= 100, `${hotel.id} fit score`);
    assert.match(hotel.imageUrl, /^https?:\/\//, `${hotel.id} image URL`);
    assert.match(hotel.bookingUrl, /^https?:\/\//, `${hotel.id} booking URL`);
    assert.match(hotel.officialUrl, /^https?:\/\//, `${hotel.id} official URL`);
    assert.ok(hotel.discountSignalZh.trim(), `${hotel.id} needs discount signal`);
    assert.ok(hotel.roomFitZh.trim(), `${hotel.id} needs room fit`);
    assert.ok(hotel.babyFitZh.trim(), `${hotel.id} needs baby fit`);
    assert.ok(hotel.prosZh.length >= 3, `${hotel.id} needs pros`);
    assert.ok(hotel.risksZh.length >= 3, `${hotel.id} needs risks`);
    assert.ok(hotel.bookingChecksZh.length >= 3, `${hotel.id} needs checks`);
    assert.ok(hotel.evidence.length >= 2, `${hotel.id} needs evidence`);
    hotel.evidence.forEach((source) => assertSourceLink(`${hotel.id} evidence`, source));
    hotel.bookingLinks.forEach((source) =>
      assertSourceLink(`${hotel.id} booking`, source),
    );
  }

  for (const alternative of data.areaAlternatives) {
    assert.ok(alternative.nameZh.trim(), `${alternative.id} needs name`);
    assert.ok(alternative.priceSignalZh.trim(), `${alternative.id} needs price signal`);
    assert.ok(alternative.fitZh.trim(), `${alternative.id} needs fit note`);
    assert.ok(alternative.cautionZh.trim(), `${alternative.id} needs caution`);
    alternative.sourceLinks.forEach((source) =>
      assertSourceLink(`${alternative.id} source`, source),
    );
  }

  for (const leg of data.drivePlan) {
    assert.ok(leg.dayZh.trim(), `${leg.id} needs day label`);
    assert.ok(leg.driveTimeZh.trim(), `${leg.id} needs drive time`);
    assert.ok(leg.distanceKm > 0, `${leg.id} needs distance`);
    assert.ok(leg.stopIdeasZh.length >= 2, `${leg.id} needs stops`);
    assert.ok(leg.babyNotesZh.trim(), `${leg.id} needs baby notes`);
    assert.ok(leg.overnightZh.trim(), `${leg.id} needs overnight plan`);
    leg.sourceLinks.forEach((source) => assertSourceLink(`${leg.id} source`, source));
  }

  for (const day of data.dayPlans) {
    assert.ok(day.titleZh.trim(), `${day.id} needs title`);
    assert.ok(day.planZh.length >= 3, `${day.id} needs concrete steps`);
    assert.ok(day.babyNotesZh.trim(), `${day.id} needs baby note`);
    assert.ok(day.badWeatherZh.trim(), `${day.id} needs bad-weather option`);
    day.sourceLinks.forEach((source) => assertSourceLink(`${day.id} source`, source));
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
