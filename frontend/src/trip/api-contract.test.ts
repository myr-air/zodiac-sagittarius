import { describe, expect, it } from "vitest";
import { tripAuthApiRoutes } from "./api-contract";

describe("trip auth API contract", () => {
  it("builds stable auth endpoint paths for the backend", () => {
    expect(tripAuthApiRoutes.join()).toBe("/v1/trips/join");
    expect(tripAuthApiRoutes.claimMember("trip-1", "member-2")).toBe("/v1/trips/trip-1/members/member-2/claim");
    expect(tripAuthApiRoutes.loginMember("trip-1", "member-2")).toBe("/v1/trips/trip-1/members/member-2/login");
    expect(tripAuthApiRoutes.logout("trip-1")).toBe("/v1/trips/trip-1/member-session/logout");
    expect(tripAuthApiRoutes.updateMember("trip-1", "member-2")).toBe("/v1/trips/trip-1/members/member-2");
  });
});
