import { describe, expect, it } from "vitest";
import { tripAuthApiRoutes } from "./api-contract";

describe("trip auth API contract", () => {
  it("builds stable auth endpoint paths for the backend", () => {
    expect(tripAuthApiRoutes.join()).toBe("/api/v1/trip-join-sessions");
    expect(tripAuthApiRoutes.claimMember("trip-1", "member-2")).toBe("/api/v1/trips/trip-1/members/member-2/claims");
    expect(tripAuthApiRoutes.loginMember("trip-1")).toBe("/api/v1/trips/trip-1/member-sessions");
    expect(tripAuthApiRoutes.logout("trip-1")).toBe("/api/v1/trips/trip-1/member-sessions/current");
    expect(tripAuthApiRoutes.updateMember("trip-1", "member-2")).toBe("/api/v1/trips/trip-1/members/member-2");
  });
});
