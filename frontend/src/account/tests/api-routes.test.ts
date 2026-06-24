import { describe, expect, it } from "vitest";
import { accountApiRoutes } from "../api-routes";

describe("account API routes", () => {
  it("builds stable account endpoint paths", () => {
    expect(accountApiRoutes.account()).toBe("/api/v1/account");
    expect(accountApiRoutes.accountTrips()).toBe("/api/v1/account/trips");
    expect(accountApiRoutes.accountTripMemberSessions("trip 1")).toBe(
      "/api/v1/account/trips/trip%201/member-sessions",
    );
    expect(accountApiRoutes.trustedDevice("device / one")).toBe(
      "/api/v1/account/trusted-devices/device%20%2F%20one",
    );
  });

  it("builds trip-scoped account integration paths", () => {
    expect(accountApiRoutes.memberAccountLink("trip 1", "member / 2")).toBe(
      "/api/v1/trips/trip%201/members/member%20%2F%202/account-links",
    );
    expect(accountApiRoutes.ownershipTransfers("trip 1")).toBe(
      "/api/v1/trips/trip%201/ownership-transfers",
    );
  });
});
