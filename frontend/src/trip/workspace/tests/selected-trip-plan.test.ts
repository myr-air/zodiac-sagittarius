import { beforeEach, describe, expect, it } from "vitest";
import {
  initialSelectedTripPlanId,
  rememberSelectedTripPlanId,
  resolveSelectedTripPlanId,
  selectedTripPlanStorageKey,
  tripHasPlan,
} from "../selected-trip-plan";
import { tripWithPlans } from "../testing/fixtures/selected-trip-plan-fixtures";
import { tripFixture } from "@/src/trip/trip-fixtures";
import { tripRoutes } from "@/src/trip/workspace/sagittarius-app/support";

describe("selected trip plan workspace state", () => {
  beforeEach(() => {
    window.sessionStorage.clear();
    window.history.replaceState(null, "", tripRoutes.itinerary(tripFixture.trip.id));
  });

  it("resolves preferred, URL, session, and default trip plan ids in order", () => {
    const trip = tripWithPlans();

    expect(initialSelectedTripPlanId(trip)).toBe("plan-main");
    expect(tripHasPlan(trip, "plan-rain")).toBe(true);
    expect(resolveSelectedTripPlanId(trip, "plan-rain")).toBe("plan-rain");

    window.history.replaceState(
      null,
      "",
      `${tripRoutes.itinerary(tripFixture.trip.id)}?tripPlanId=plan-rain`,
    );
    expect(resolveSelectedTripPlanId(trip)).toBe("plan-rain");

    window.history.replaceState(null, "", tripRoutes.itinerary(tripFixture.trip.id));
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
