import { describe, expect, it } from "vitest";
import {
  accountTravelerTrip,
  accountTrip,
} from "../../../testing/account-access-panel-test-clients";
import {
  accountPortalTripBadgeTone,
  accountPortalTripDetail,
  buildAccountPortalTripListRows,
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

  it("builds portal trip list rows from one display rule", () => {
    expect(
      buildAccountPortalTripListRows([accountTrip, accountTravelerTrip], {
        open: "Open",
        owner: "Owner",
        roles: {
          organizer: "Organizer",
          owner: "Owner",
          traveler: "Traveler",
          viewer: "Viewer",
        },
      }),
    ).toEqual([
      {
        badgeLabel: "Owner",
        badgeTone: "success",
        detail: "Seoul · 2026-06-01 - 2026-06-05",
        href: "/trips/trip-id",
        id: "trip-id",
        openLabel: "Open",
        title: "Seoul Spring",
      },
      {
        badgeLabel: "Traveler",
        badgeTone: "neutral",
        detail: "Taipei · 2026-07-01 - 2026-07-04",
        href: "/trips/trip-traveler",
        id: "trip-traveler",
        openLabel: "Open",
        title: "Taipei Shared",
      },
    ]);
  });
});
