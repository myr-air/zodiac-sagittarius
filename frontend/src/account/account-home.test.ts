import { describe, expect, it } from "vitest";
import { accountHomeComposition } from "./account-home";
import { portalNavItems } from "../portal/portal-nav";

/** Draft compose grid order: stories ∥ friends → trips → places ∥ itinerary. */
const DRAFT_COMPOSE_AREA_IDS = [
  "stories",
  "friends",
  "trips",
  "places",
  "itinerary",
] as const;

describe("accountHomeComposition", () => {
  it("exposes Joii brand (no Sagittarius); primary nav lives in portalNavItems", () => {
    expect(accountHomeComposition.brand).toBe("Joii");
    expect(accountHomeComposition.brand).not.toMatch(/Sagittarius/i);

    expect(
      portalNavItems.map((item) => ({ label: item.label, href: item.href })),
    ).toEqual([
      { label: "Home", href: "/portal" },
      { label: "Explore", href: "/portal/explore" },
      { label: "Trips", href: "/portal/trips" },
      { label: "Friends", href: "/portal/friends" },
      { label: "Settings", href: "/portal/settings" },
    ]);
  });

  it("lists compose areas stories, friends, trips, places, itinerary in draft order", () => {
    const ids = accountHomeComposition.composeAreas.map((area) => area.id);
    expect(ids).toEqual([...DRAFT_COMPOSE_AREA_IDS]);
  });

  it("flags stories, friends, places as placeholder; trips and greeting/itinerary as live", () => {
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
