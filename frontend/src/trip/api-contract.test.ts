import { describe, expect, it } from "vitest";
import { tripApiRoutes, tripAuthApiRoutes } from "./api-contract";

describe("trip auth API contract", () => {
  it("builds stable auth endpoint paths for the backend", () => {
    expect(tripAuthApiRoutes.join()).toBe("/api/v1/trip-join-sessions");
    expect(tripAuthApiRoutes.claimMember("trip-1", "member-2")).toBe("/api/v1/trips/trip-1/members/member-2/claims");
    expect(tripAuthApiRoutes.loginMember("trip-1")).toBe("/api/v1/trips/trip-1/member-sessions");
    expect(tripAuthApiRoutes.logout("trip-1")).toBe("/api/v1/trips/trip-1/member-sessions/current");
    expect(tripAuthApiRoutes.updateMember("trip-1", "member-2")).toBe("/api/v1/trips/trip-1/members/member-2");
  });

  it("builds daily briefing routes", () => {
    expect(tripApiRoutes.dailyBriefings("trip 1")).toBe("/api/v1/trips/trip%201/daily-briefings");
    expect(tripApiRoutes.dailyBriefing("trip 1", "2026-07-09")).toBe("/api/v1/trips/trip%201/daily-briefings/2026-07-09");
  });

  it("builds canonical Trip Plan routes beside legacy plan variant routes", () => {
    expect(tripApiRoutes.tripPlans("trip 1")).toBe("/api/v1/trips/trip%201/trip-plans");
    expect(tripApiRoutes.tripPlan("trip 1", "plan / rain")).toBe("/api/v1/trips/trip%201/trip-plans/plan%20%2F%20rain");
    expect(tripApiRoutes.setMainTripPlan("trip 1", "plan / rain")).toBe(
      "/api/v1/trips/trip%201/trip-plans/plan%20%2F%20rain/set-main",
    );
    expect(tripApiRoutes.planVariants("trip 1")).toBe("/api/v1/trips/trip%201/plan-variants");
    expect(tripApiRoutes.planVariant("trip 1", "plan / rain")).toBe("/api/v1/trips/trip%201/plan-variants/plan%20%2F%20rain");
    expect(tripApiRoutes.planVariantPublications("trip 1", "plan / rain")).toBe(
      "/api/v1/trips/trip%201/plan-variants/plan%20%2F%20rain/publications",
    );
  });
});
