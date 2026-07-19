import { describe, expect, it } from "vitest";
import type { AccountTripSummary } from "./account-api";
import { toUpcomingTripCard, toUpcomingTripCards } from "./trip-cards";

/** Independent fixture shaped like AccountTripSummary (camelCase API body). */
const CHIANG_MAI_TRIP: AccountTripSummary = {
  id: "018f4e80-0000-7000-a000-0000000000aa",
  name: "Bangkok - Chiang Mai",
  destinationLabel: "Chiang Mai",
  countries: ["Thailand"],
  partySize: 4,
  startDate: "2026-12-12",
  endDate: "2026-12-15",
  role: "traveler",
};

describe("toUpcomingTripCard", () => {
  it("maps name, destinationLabel, countries, partySize, startDate, endDate into draft-v3 trip card fields", () => {
    const card = toUpcomingTripCard(CHIANG_MAI_TRIP);

    // Draft v3 trip row: h3, .country, date badge inputs, faces count
    expect(card.title).toBe("Bangkok - Chiang Mai");
    expect(card.destinationLabel).toBe("Chiang Mai");
    expect(card.country).toBe("Thailand");
    expect(card.partySize).toBe(4);
    expect(card.startDate).toBe("2026-12-12");
    expect(card.endDate).toBe("2026-12-15");
    expect(card.id).toBe(CHIANG_MAI_TRIP.id);
  });
});

describe("toUpcomingTripCards", () => {
  it("yields zero cards for an empty trips array (no fabricated destinations or budgets)", () => {
    const cards = toUpcomingTripCards([]);

    expect(cards).toEqual([]);
    expect(cards).toHaveLength(0);
    expect(JSON.stringify(cards)).not.toMatch(/Paris|France|Budget|\$\d/i);
  });
});
