# Travel Site Audit and Christmas Planning

Research date: 2026-09-18 (Berlin). Implementation verification: 2026-09-19 (Asia/Shanghai).
Target: https://alexchenic.github.io/germany-deal-travel/#christmas

## Scope

Reviewed navigation, all 16 hash routes, hotel search construction, live-provider identity matching, search aliases, family recommendation heuristics, discount extraction, and the Christmas trip plan. Existing personal favorites and historic topics are preserved. No reservations or hotel messages were submitted.

## Findings and Changes

| Priority | Finding | Change |
| --- | --- | --- |
| High | Hotel lookup fell back to the first result when the requested hotel did not match; Google Places also accepted its first candidate. | Require a unique normalized full-name match; unknown and ambiguous matches remain unknown. |
| High | Full board (Vollpension) was treated as all-inclusive. | Separate meal plans in search aliases, new data classification and recommendation bonuses. |
| High | Generic percentage extraction could interpret a recommendation percentage as a discount. | Require discount context; test recommendation percentages and 100% separately. |
| High | Family candidates could include adult-only properties. | Exclude explicit adult-only candidates in family recommendations and the default family discount view. |
| High | Christmas content mixed older requirements and price assumptions. | Replace with Dec 20-Jan 5 European destination windows, 6-9 nights, two explicit party configurations, and unverified-price labels. |
| Medium | Multiword searches could expand into an entire destination category. | Expand aliases only for exact alias queries; retain multiword specificity. |
| Medium | A mention of Berlin alone could be classified as a Berlin departure. | Remove the bare-city departure trigger; retain explicit departure phrases. |
| Medium | Google Hotels links implied unsupported date/person prefill. | Keep the hotel/location query only and explain that conditions must be selected at the source. Do not expose a provider API details endpoint as a booking link. |
| Medium | Too many equally prominent tabs; obsolete trips looked current. | Three shortcuts plus a grouped native dropdown, with an archive notice for five dated topics; retain all old hashes. |
| Medium | Keyword recommendation scores looked like authoritative ratings; price units differed. | Label family scores as heuristic signals and price ordering as advertising amounts with different units. |
| Medium | Old activity discovery could dominate current family recommendations. | Remove event discovery older than 30 days from family recommendations. This is an editorial freshness filter, not event-date verification. |
| Medium | Every static trip page loaded with the application. | Lazy-load ten topic pages. Local main bundle decreased from approximately 781 KB to 503 KB uncompressed; a >500 KB build warning remains. |

## Christmas Decisions

- Party 1: two adults and one child aged 1 at travel. First candidates: TUI BLUE Orquidea and H10 Suites Lanzarote Gardens.
- Party 2: three adults and one child aged 1. Prioritize H10 Gardens' two-bedroom option or compare two separately occupied rooms; never infer occupancy from floor area.
- Secondary candidates: Riu Gran Canaria, H10 Costa Adeje Palace, and Calheta Beach.
- Canary Islands and Madeira are included as Spanish/Portuguese destinations; their Atlantic geography is explicit. Egypt is excluded from this European-country brief.
- Stay in one hotel, favor daytime nonstop BER flights, short transfers, a heated toddler pool, and a quiet sleeping area. Flight schedules, pool temperatures, cot availability and legal occupancy require date-specific confirmation.
- Each hotel has official references, an exact-name/location map query, date/person-aware Booking search, and an English inquiry template. Copying an inquiry does not send it.
- TUI's winter early-booking promotion specifies booking July 23-September 22, 2026, travel November 1, 2026-April 30, 2027, up to 30% on selected TUI/airtours products. This is not evidence of a matching Christmas family discount.
- H10 membership/long-stay offers and Urlaubspiraten/Travelzoo leads are separated from verified quotations. No advertising per-person amount is multiplied into a family quote.

## Evidence and Remaining Limits

Primary hotel and promotion URLs are stored with the data in `src/data/christmas-all-inclusive-2026.json`. Live public pages and recent review excerpts were checked; a small review sample is not a comprehensive review analysis.

No payable BER Christmas package price or room inventory was obtained for either party. The Booking browser checks for both family sizes redirected to generic search pages and lost conditions; the site explicitly warns about source-side resets. TUI public hotel information was reachable, but no matching package checkout quotation was confirmed. Final prices, eligibility and availability must be checked on the source site or through the inquiry template.

Full-name matching is deliberately conservative and may miss legitimate renamed properties. It is not a substitute for stable provider IDs and geographic/address validation. A later provider integration should persist verified hotel IDs. Adult-only and all-inclusive detection remains keyword-based; mixed family/adult-zone descriptions and negations require manual review. Radar source freshness does not prove that an advertised deal is still bookable. Archived external links and all historical advertised prices have not been revalidated.

The quotation worksheet is a temporary local calculation, not storage or a booking flow. It resets when dates or party changes. Blank cost fields remain unknown; confirmed included costs may be entered as zero.

## Verification

- 21 automated tests pass, including 60 hotel/date/party URL combinations, identity ambiguity, meal-plan distinction, discount false positives, and family exclusions.
- TypeScript and production build pass.
- Browser smoke check: all 16 routes render at 390x844 without horizontal overflow; all five archived routes show their notice.
- Desktop and mobile screenshots inspected; official hotel photographs load successfully.
- Browser interaction checks: four-person ranking, nine-night cross-year date query, destination filtering, EUR 3000 worksheet total, and worksheet reset when changing party.
- No browser runtime errors reported during local checks.

Deployment uses the repository's existing GitHub Pages workflow, not a separate hosting service.
