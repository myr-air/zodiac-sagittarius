import { describe, expect, it } from "vitest";
import { accountHomeComposition } from "./account-home";

/** Independent Navica top-nav literals from approved draft v3 (not from SUT). */
const NAVICA_TOP_NAV_LABELS = [
  "Home",
  "My Bookings",
  "Itinerary",
  "Community",
  "Money Changer",
] as const;

/** Draft v3 compose grid order: stories ∥ friends → trips → places ∥ itinerary. */
const DRAFT_V3_COMPOSE_AREA_IDS = [
  "stories",
  "friends",
  "trips",
  "places",
  "itinerary",
] as const;

describe("accountHomeComposition", () => {
  it("exposes Navica top-nav items with Home marked current and brand Joii (no Sagittarius)", () => {
    expect(accountHomeComposition.brand).toBe("Joii");

    const labels = accountHomeComposition.topNav.map((item) => item.label);
    expect(labels).toEqual([...NAVICA_TOP_NAV_LABELS]);

    const home = accountHomeComposition.topNav.find(
      (item) => item.label === "Home",
    );
    expect(home).toBeDefined();
    expect(home?.current).toBe(true);

    const otherCurrent = accountHomeComposition.topNav.filter(
      (item) => item.label !== "Home" && item.current,
    );
    expect(otherCurrent).toEqual([]);

    const publicSurface = [
      accountHomeComposition.brand,
      ...labels,
    ].join("\n");
    expect(publicSurface).toMatch(/Joii/);
    expect(publicSurface).not.toMatch(/Sagittarius/i);
  });

  it("lists compose areas stories, friends, trips, places, itinerary in draft v3 order", () => {
    const ids = accountHomeComposition.composeAreas.map((area) => area.id);
    expect(ids).toEqual([...DRAFT_V3_COMPOSE_AREA_IDS]);
  });

  it('flags stories, friends, places as placeholder; trips and greeting/itinerary as live', () => {
    const byId = Object.fromEntries(
      accountHomeComposition.composeAreas.map((area) => [
        area.id,
        area.dataSource,
      ]),
    );

    expect(byId.stories).toBe("placeholder");
    expect(byId.friends).toBe("placeholder");
    expect(byId.places).toBe("placeholder");

    expect(byId.trips).toBe("live");
    expect(byId.itinerary).toBe("live");
    expect(accountHomeComposition.greeting.dataSource).toBe("live");
  });
});
