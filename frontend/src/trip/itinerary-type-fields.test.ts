import { describe, expect, it } from "vitest";
import {
  isBagKeyPersistable,
  seedFieldBag,
  softMapBagKeyToPatch,
  type StopFieldBag,
} from "./itinerary-type-fields";

/**
 * M82GSOYG T1: from/to must persist to details.origin / details.destination,
 * not only the derived activity route string.
 */
function travelBag(overrides: Partial<StopFieldBag> = {}): StopFieldBag {
  return {
    title: "",
    place: "",
    from: "",
    to: "",
    note: "",
    by: "",
    meal: "",
    action: "",
    checkin: "",
    checkout: "",
    ticket: "",
    meeting: "",
    list: "",
    carrier: "",
    ref: "",
    reservation: "",
    ...overrides,
  };
}

describe("softMapBagKeyToPatch travel from/to details persistence", () => {
  it("maps from -> details.origin and to -> details.destination (not activity-only)", () => {
    const bag = travelBag({ from: "Denpasar", to: "Ubud" });

    const fromPatch = softMapBagKeyToPatch({
      activityType: "travel",
      key: "from",
      value: "Denpasar",
      bag,
    });
    expect(fromPatch?.details?.origin).toBe("Denpasar");

    const toPatch = softMapBagKeyToPatch({
      activityType: "travel",
      key: "to",
      value: "Ubud",
      bag,
    });
    expect(toPatch?.details?.destination).toBe("Ubud");
  });
});

describe("softMapBagKeyToPatch by/meal details persistence", () => {
  it("by -> details.mode while the By choice-chip still writes activitySubtype; meal -> details.meal preserved", () => {
    const byBag = travelBag({ by: "flight" });
    const byPatch = softMapBagKeyToPatch({
      activityType: "travel",
      key: "by",
      value: "flight",
      bag: byBag,
    });
    expect(byPatch?.activitySubtype).toBe("flight");
    expect(byPatch?.details?.mode).toBe("flight");

    const mealBag = travelBag({ meal: "Lunch" });
    const mealPatch = softMapBagKeyToPatch({
      activityType: "food",
      key: "meal",
      value: "Lunch",
      bag: mealBag,
    });
    expect(mealPatch?.details?.meal).toBe("Lunch");
  });

  it("isBagKeyPersistable returns true for the mapped from/to/by/meal keys", () => {
    expect(isBagKeyPersistable("travel", "from")).toBe(true);
    expect(isBagKeyPersistable("travel", "to")).toBe(true);
    expect(isBagKeyPersistable("travel", "by")).toBe(true);
    expect(isBagKeyPersistable("food", "meal")).toBe(true);
  });
});

/**
 * M82GSOYG: `details` is coalesced (replaces the whole column) on the API,
 * so a `by`/`meal` patch that returns only `{ mode }` / `{ meal }` wipes out
 * sibling detail fields (origin/destination/bookingRef, …) that already live
 * in the item's current details JSON. softMapBagKeyToPatch must accept the
 * current details and MERGE the new field into them, not replace wholesale.
 */
describe("softMapBagKeyToPatch by/meal merges into existing details (no wipe)", () => {
  const currentDetails = {
    origin: "A",
    destination: "B",
    bookingRef: "X",
  };

  it("by -> details merges mode into existing origin/destination/bookingRef instead of replacing them", () => {
    const byBag = travelBag({ by: "flight" });
    const byPatch = softMapBagKeyToPatch({
      activityType: "travel",
      key: "by",
      value: "flight",
      bag: byBag,
      currentDetails,
    });

    expect(byPatch?.details?.origin).toBe("A");
    expect(byPatch?.details?.destination).toBe("B");
    expect(byPatch?.details?.bookingRef).toBe("X");
    expect(byPatch?.details?.mode).toBe("flight");
  });

  it("meal -> details merges meal into existing origin/destination/bookingRef instead of replacing them", () => {
    const mealBag = travelBag({ meal: "Lunch" });
    const mealPatch = softMapBagKeyToPatch({
      activityType: "food",
      key: "meal",
      value: "Lunch",
      bag: mealBag,
      currentDetails,
    });

    expect(mealPatch?.details?.origin).toBe("A");
    expect(mealPatch?.details?.destination).toBe("B");
    expect(mealPatch?.details?.bookingRef).toBe("X");
    expect(mealPatch?.details?.meal).toBe("Lunch");
  });
});

/**
 * M82GSOYG T2: seedFieldBag must hydrate from/to/by/meal from item.details
 * (origin/destination/mode/meal) when present, so a reload after a T1-style
 * details PATCH doesn't lose the typed extras — while older/local bags with
 * no details still populate from the legacy activity route + place.
 */
describe("seedFieldBag hydrates from item.details", () => {
  it("populates from/to/by/meal from item.details (origin/destination/mode/meal) so typed extras survive reload", () => {
    // Legacy activity string deliberately has no "A → B" route and no meal
    // hint, so a pass here can only come from item.details hydration, not
    // the legacy activity-route / place fallback.
    const bag = seedFieldBag({
      activity: "Flight",
      activityType: "travel",
      place: "",
      details: {
        origin: "Denpasar",
        destination: "Ubud",
        mode: "flight",
        meal: "Lunch",
      },
    });

    expect(bag.from).toBe("Denpasar");
    expect(bag.to).toBe("Ubud");
    expect(bag.by).toBe("flight");
    expect(bag.meal).toBe("Lunch");
  });

  it("still falls back to the legacy activity route + place when details is absent (older/local bags still populate)", () => {
    const bag = seedFieldBag({
      activity: "Denpasar → Ubud",
      activityType: "travel",
      place: "Garuda Indonesia",
    });

    expect(bag.from).toBe("Denpasar");
    expect(bag.to).toBe("Ubud");
    expect(bag.carrier).toBe("Garuda Indonesia");
  });
});
