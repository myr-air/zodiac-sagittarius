import { describe, expect, it } from "vitest";
import {
  accountTravelerTrip,
  accountTrip,
} from "../../testing/account-access-panel-test-clients";
import {
  accountPortalTripBadgeTone,
  accountPortalTripDetail,
} from "../account-portal-trip-list-item.model";

describe("account portal trip list item model", () => {
  it("formats trip row detail consistently for portal trip lists", () => {
    expect(accountPortalTripDetail(accountTrip)).toBe(
      "Seoul · 2026-06-01 - 2026-06-05",
    );
  });

  it("maps owner and shared trips to their badge tones", () => {
    expect(accountPortalTripBadgeTone(accountTrip)).toBe("success");
    expect(accountPortalTripBadgeTone(accountTravelerTrip)).toBe("neutral");
  });
});
