import assert from "node:assert/strict";
import test from "node:test";
import { bookingSearchUrl, exactHotelSearchUrl, hasAllInclusive, matchHotelByName } from "../src/lib/travelSearch";
import { expandQuery } from "../src/lib/search";
import data from "../src/data/christmas-all-inclusive-2026.json";

test("hotel search keeps hotel identity, dates and both actual family configurations", () => {
  for (const adults of [2, 3]) for (const dates of data.dateOptions) for (const hotel of data.hotels) {
    const url = new URL(bookingSearchUrl(hotel.name, hotel.location, dates, { adults, childAge: 1 }));
    assert.equal(url.searchParams.get("ss"), `${hotel.name}, ${hotel.location}`);
    assert.equal(url.searchParams.get("group_adults"), String(adults));
    assert.equal(url.searchParams.get("group_children"), "1");
    assert.equal(url.searchParams.get("age"), "1");
    assert.equal(url.searchParams.get("checkin"), dates.checkIn);
    assert.equal(url.searchParams.get("checkout"), dates.checkOut);
    assert.equal(url.searchParams.get("no_rooms"), "1");
    const nights = (Date.parse(dates.checkOut) - Date.parse(dates.checkIn)) / 86400000;
    assert.ok(nights >= 6 && nights <= 9);
    assert.ok(dates.checkIn >= "2026-12-20");
  }
});

test("hotel matching never substitutes the first search hit or an ambiguous brand", () => {
  const properties = [{ name: "H10 Ocean Suites" }, { name: "H10 Suites Lanzarote Gardens" }];
  assert.equal(matchHotelByName("H10 Suites Lanzarote Gardens", properties), properties[1]);
  assert.equal(matchHotelByName("H10", properties), undefined);
  assert.equal(matchHotelByName("Calheta Beach", properties), undefined);
  assert.equal(matchHotelByName("", [{ name: "" }]), undefined);
  assert.equal(matchHotelByName("Hotel ABC", [{ name: "Hotel ABC" }, { name: "Hotel ABC" }]), undefined);
});

test("full board is not all-inclusive and destination aliases do not broaden multiword searches", () => {
  assert.equal(hasAllInclusive("Vollpension mit Frühstück, Mittagessen und Abendessen"), false);
  assert.equal(hasAllInclusive("All-inclusive resort"), true);
  assert.equal(expandQuery("all inclusive").includes("vollpension"), false);
  assert.ok(expandQuery("全包").includes("all inclusive"));
  assert.deepEqual(expandQuery("turkey museum"), ["turkey museum"]);
  assert.ok(new URL(exactHotelSearchUrl("Calheta Beach", "Madeira", "tui.com")).searchParams.get("q")?.includes('"Calheta Beach" "Madeira"'));
});

test("Christmas research distinguishes per-person ads from verified family quotes", () => {
  assert.ok(!data.hotels.some((hotel) => /egypt|hurghada/i.test(hotel.location)));
  assert.equal(data.hotels.find((hotel) => hotel.rank3 === 1)?.id, "orquidea");
  assert.equal(data.hotels.find((hotel) => hotel.rank4 === 1)?.id, "gardens");
  for (const hotel of data.hotels) {
    assert.ok(hotel.room3 && hotel.room4 && hotel.priceStatus.includes("待核实"));
    for (const source of hotel.references) assert.equal(new URL(source.url).protocol, "https:");
  }
  for (const promo of data.promotions) assert.equal(new URL(promo.url).protocol, "https:");
});
