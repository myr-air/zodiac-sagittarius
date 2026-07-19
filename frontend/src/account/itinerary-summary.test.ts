import { describe, expect, it } from "vitest";
import type { AccountTripSummary } from "./account-api";
import { toItinerarySummary } from "./itinerary-summary";
import type { UpcomingTripCard } from "./trip-cards";

const EXPLORER_NEXT_TRIP: AccountTripSummary = {
  id: "018f4e80-0000-7000-a000-0000000000aa",
  name: "Bangkok - Chiang Mai",
  destinationLabel: "Chiang Mai",
  countries: ["Thailand"],
  partySize: 4,
  startDate: "2026-12-12",
  endDate: "2026-12-15",
};

const FALLBACK_CARD: UpcomingTripCard = {
  id: "018f4e80-0000-7000-a000-0000000000cc",
  title: "Phuket Escape",
  destinationLabel: "Phuket",
  country: "Thailand",
  partySize: 2,
  startDate: "2027-01-10",
  endDate: "2027-01-14",
};

const OTHER_CARD: UpcomingTripCard = {
  id: "018f4e80-0000-7000-a000-0000000000dd",
  title: "Should Not Win",
  destinationLabel: "Elsewhere",
  country: "Nowhere",
  partySize: 8,
  startDate: "2030-01-01",
  endDate: "2030-01-02",
};

describe("toItinerarySummary", () => {
  it("prefers explorer.nextTrip name, partySize, dates when present; falls back to first upcoming trip card when nextTrip is null", () => {
    const fromNext = toItinerarySummary({
      nextTrip: EXPLORER_NEXT_TRIP,
      upcomingCards: [FALLBACK_CARD, OTHER_CARD],
    });

    expect(fromNext).not.toBeNull();
    expect(fromNext?.name).toBe("Bangkok - Chiang Mai");
    expect(fromNext?.partySize).toBe(4);
    expect(fromNext?.startDate).toBe("2026-12-12");
    expect(fromNext?.endDate).toBe("2026-12-15");

    const fromFallback = toItinerarySummary({
      nextTrip: null,
      upcomingCards: [FALLBACK_CARD, OTHER_CARD],
    });

    expect(fromFallback).not.toBeNull();
    expect(fromFallback?.name).toBe("Phuket Escape");
    expect(fromFallback?.partySize).toBe(2);
    expect(fromFallback?.startDate).toBe("2027-01-10");
    expect(fromFallback?.endDate).toBe("2027-01-14");
  });

  it("exposes budget as an explicit placeholder flag/string (no invented rollup amount)", () => {
    const summary = toItinerarySummary({
      nextTrip: EXPLORER_NEXT_TRIP,
      upcomingCards: [FALLBACK_CARD],
    });

    expect(summary).not.toBeNull();
    expect(summary?.budget.isPlaceholder).toBe(true);
    expect(typeof summary?.budget.label).toBe("string");
    expect(summary?.budget.label.length).toBeGreaterThan(0);
    // Must not invent a dollar rollup — there is no budget rollup API.
    expect(summary?.budget.label).not.toMatch(/\$\d/);
  });
});
