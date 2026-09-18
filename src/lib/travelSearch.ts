import { normalizeSearchText } from "./search";

export interface TravelParty { adults: number; childAge: number }
export interface TravelDates { checkIn: string; checkOut: string }

export function bookingSearchUrl(hotel: string, location: string, dates: TravelDates, party: TravelParty) {
  const url = new URL("https://www.booking.com/searchresults.html");
  url.search = new URLSearchParams({
    ss: `${hotel}, ${location}`, checkin: dates.checkIn, checkout: dates.checkOut,
    group_adults: String(party.adults), group_children: "1", age: String(party.childAge),
    no_rooms: "1", selected_currency: "EUR",
  }).toString();
  return url.toString();
}

export function hotelMapUrl(hotel: string, location: string) {
  return `https://www.google.com/maps/search/?${new URLSearchParams({ api: "1", query: `${hotel}, ${location}` })}`;
}

export function exactHotelSearchUrl(hotel: string, location: string, domain?: string) {
  const q = `${domain ? `site:${domain} ` : ""}"${hotel}" "${location}"`;
  return `https://www.google.com/search?${new URLSearchParams({ q })}`;
}

// Only accept a unique full-name match. Search rank alone is not hotel identity.
export function matchHotelByName<T extends { name?: string; title?: string }>(name: string, properties: T[]): T | undefined {
  const key = (value: string) => normalizeSearchText(value).replace(/[^\p{L}\p{N}]+/gu, " ").trim();
  const expected = key(name);
  if (!expected) return undefined;
  const matches = properties.filter((property) => key(property.name ?? property.title ?? "") === expected);
  return matches.length === 1 ? matches[0] : undefined;
}

export function hasAllInclusive(text: string) {
  return /\ball[\s-]+inclusive\b|\balles inklusive\b|全包/i.test(text);
}

export function isAdultsOnly(text: string) {
  return /\badults?[\s-]+only\b|erwachsenenhotel|nur f[uü]r erwachsene|仅限成人|成人限定/i.test(text);
}
