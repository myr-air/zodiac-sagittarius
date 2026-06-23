import { describe, expect, it } from "vitest";
import {
  accountTravelerTrip,
  accountTrip,
  accountTrips,
} from "../../../testing/account-access-panel-test-clients";
import {
  accountPortalExplorerPinStyle,
  buildAccountPortalExplorerMapPins,
  buildAccountPortalExplorerTripRows,
  buildAccountPortalExplorerTrips,
} from "../account-portal-explorer-model";

describe("account portal explorer model", () => {
  it("prefers shared trips before owned trips", () => {
    expect(buildAccountPortalExplorerTrips(accountTrips, "")).toEqual([
      accountTravelerTrip,
    ]);
  });

  it("falls back to owned trips when there are no shared trips", () => {
    expect(buildAccountPortalExplorerTrips([accountTrip], "")).toEqual([
      accountTrip,
    ]);
  });

  it("filters explorer trips by name, destination, and role", () => {
    expect(
      buildAccountPortalExplorerTrips(accountTrips, " traveler "),
    ).toEqual([accountTravelerTrip]);
    expect(
      buildAccountPortalExplorerTrips(accountTrips, "seoul"),
    ).toEqual([]);
  });

  it("derives stable map pin positions", () => {
    expect(accountPortalExplorerPinStyle(0)).toEqual({
      "--pin-x": "22%",
      "--pin-y": "32%",
    });
    expect(accountPortalExplorerPinStyle(3)).toEqual({
      "--pin-x": "73%",
      "--pin-y": "58%",
    });
  });

  it("builds map pins from the first four explorer trips", () => {
    expect(
      buildAccountPortalExplorerMapPins([
        accountTravelerTrip,
        accountTrip,
        { ...accountTrip, id: "trip-3", name: "Osaka Autumn" },
        { ...accountTrip, id: "trip-4", name: "Hong Kong Stopover" },
        { ...accountTrip, id: "trip-5", name: "Hidden overflow" },
      ]),
    ).toEqual([
      {
        id: "trip-traveler",
        style: { "--pin-x": "22%", "--pin-y": "32%" },
        title: "Taipei Shared, Taipei",
      },
      {
        id: "trip-id",
        style: { "--pin-x": "39%", "--pin-y": "58%" },
        title: "Seoul Spring, Seoul",
      },
      {
        id: "trip-3",
        style: { "--pin-x": "56%", "--pin-y": "32%" },
        title: "Osaka Autumn, Seoul",
      },
      {
        id: "trip-4",
        style: { "--pin-x": "73%", "--pin-y": "58%" },
        title: "Hong Kong Stopover, Seoul",
      },
    ]);
  });

  it("builds explorer trip rows from centralized trip detail and badge rules", () => {
    expect(
      buildAccountPortalExplorerTripRows([accountTravelerTrip, accountTrip], {
        owned: "Owned",
        shared: "Shared",
      }),
    ).toEqual([
      {
        badgeLabel: "Shared",
        badgeTone: "neutral",
        detail: "Taipei · 2026-07-01 - 2026-07-04",
        id: "trip-traveler",
        title: "Taipei Shared",
      },
      {
        badgeLabel: "Owned",
        badgeTone: "success",
        detail: "Seoul · 2026-06-01 - 2026-06-05",
        id: "trip-id",
        title: "Seoul Spring",
      },
    ]);
  });
});
