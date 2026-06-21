import { describe, expect, it } from "vitest";
import { buildItineraryView } from "@/src/trip/itinerary-core";
import { seedTrip } from "@/src/trip/seed";
import { resolveSelectedWorkspaceItem } from "../selected-itinerary-item";

const [baseItem] = seedTrip.itineraryItems;

function item(id: string, day: string) {
  return {
    ...baseItem,
    activity: id,
    day,
    id,
    place: id,
  };
}

describe("resolveSelectedWorkspaceItem", () => {
  it("uses the selected active plan item when available", () => {
    const activePlanItems = [item("active-1", "2026-06-10")];

    expect(
      resolveSelectedWorkspaceItem({
        activePlanItems,
        itineraryView: buildItineraryView(activePlanItems),
        planItems: activePlanItems,
        selectedItemId: "active-1",
        tripStartDate: "2026-06-09",
      }),
    ).toMatchObject({
      selectedDay: "2026-06-10",
      selectedItemIdForView: "active-1",
    });
  });

  it("falls back to visible plan items before active graph items", () => {
    const activePlanItems = [item("active-1", "2026-06-11")];
    const planItems = [item("visible-1", "2026-06-12")];

    expect(
      resolveSelectedWorkspaceItem({
        activePlanItems,
        itineraryView: buildItineraryView(planItems),
        planItems,
        selectedItemId: "missing",
        tripStartDate: "2026-06-09",
      }),
    ).toMatchObject({
      selectedDay: "2026-06-12",
      selectedItemIdForView: "visible-1",
    });
  });

  it("falls back to the itinerary view day, then trip start date", () => {
    expect(
      resolveSelectedWorkspaceItem({
        activePlanItems: [],
        itineraryView: buildItineraryView([item("hidden-day", "2026-06-13")]),
        planItems: [],
        selectedItemId: "missing",
        tripStartDate: "2026-06-09",
      }),
    ).toMatchObject({
      selectedDay: "2026-06-13",
      selectedItem: undefined,
      selectedItemIdForView: "",
    });

    expect(
      resolveSelectedWorkspaceItem({
        activePlanItems: [],
        itineraryView: buildItineraryView([]),
        planItems: [],
        selectedItemId: "missing",
        tripStartDate: "2026-06-09",
      }),
    ).toMatchObject({
      selectedDay: "2026-06-09",
      selectedItem: undefined,
      selectedItemIdForView: "",
    });
  });
});
