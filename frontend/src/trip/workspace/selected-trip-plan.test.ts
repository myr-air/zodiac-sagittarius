import { beforeEach, describe, expect, it } from "vitest";
import {
  initialSelectedTripPlanId,
  rememberSelectedTripPlanId,
  resolveSelectedTripPlanId,
  selectedTripPlanStorageKey,
  tripHasPlan,
} from "./selected-trip-plan";
import { tripFixture } from "@/src/trip/trip-fixtures";
import type { PlanVariant, Trip } from "@/src/trip/types";

function tripWithPlans(): Trip {
  const rainPlan: PlanVariant = {
    description: "",
    id: "plan-rain",
    kind: "draft",
    name: "Rain Plan",
    status: "backup",
    tripId: tripFixture.trip.id,
  };
  return {
    ...tripFixture.trip,
    mainTripPlanId: "plan-main",
    activePlanVariantId: "plan-main",
    planVariants: [
      { ...tripFixture.trip.planVariants[0], id: "plan-main" },
      rainPlan,
    ],
    tripPlans: [
      { ...tripFixture.trip.planVariants[0], id: "plan-main" },
      rainPlan,
    ],
  };
}

describe("selected trip plan workspace state", () => {
  beforeEach(() => {
    window.sessionStorage.clear();
    window.history.replaceState(null, "", "/trips/demo/itinerary");
  });

  it("resolves preferred, URL, session, and default trip plan ids in order", () => {
    const trip = tripWithPlans();

    expect(initialSelectedTripPlanId(trip)).toBe("plan-main");
    expect(tripHasPlan(trip, "plan-rain")).toBe(true);
    expect(resolveSelectedTripPlanId(trip, "plan-rain")).toBe("plan-rain");

    window.history.replaceState(
      null,
      "",
      "/trips/demo/itinerary?tripPlanId=plan-rain",
    );
    expect(resolveSelectedTripPlanId(trip)).toBe("plan-rain");

    window.history.replaceState(null, "", "/trips/demo/itinerary");
    window.sessionStorage.setItem(
      selectedTripPlanStorageKey(trip.id),
      "plan-rain",
    );
    expect(resolveSelectedTripPlanId(trip)).toBe("plan-rain");

    window.sessionStorage.setItem(
      selectedTripPlanStorageKey(trip.id),
      "missing-plan",
    );
    expect(resolveSelectedTripPlanId(trip)).toBe("plan-main");
  });

  it("persists selected plan in session storage and mirrors non-default ids in the URL", () => {
    const trip = tripWithPlans();

    rememberSelectedTripPlanId(trip, "plan-rain");
    expect(window.sessionStorage.getItem(selectedTripPlanStorageKey(trip.id))).toBe(
      "plan-rain",
    );
    expect(window.location.search).toBe("?tripPlanId=plan-rain");

    rememberSelectedTripPlanId(trip, "plan-main");
    expect(window.sessionStorage.getItem(selectedTripPlanStorageKey(trip.id))).toBe(
      "plan-main",
    );
    expect(window.location.search).toBe("");
  });
});
