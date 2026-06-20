import { describe, expect, it } from "vitest";
import { canTripRole } from "./auth";

describe("trip participant capabilities", () => {
  it("maps roles to trip capabilities", () => {
    expect(canTripRole("organizer", "managePeople")).toBe(true);
    expect(canTripRole("owner", "manageTripPlans")).toBe(true);
    expect(canTripRole("organizer", "manageTripPlans")).toBe(true);
    expect(canTripRole("traveler", "createSuggestion")).toBe(true);
    expect(canTripRole("traveler", "editItinerary")).toBe(true);
    expect(canTripRole("traveler", "manageTripPlans")).toBe(false);
    expect(canTripRole("viewer", "viewPlan")).toBe(true);
    expect(canTripRole("viewer", "createSuggestion")).toBe(false);
    expect(canTripRole("viewer", "manageTripPlans")).toBe(false);
  });
});
