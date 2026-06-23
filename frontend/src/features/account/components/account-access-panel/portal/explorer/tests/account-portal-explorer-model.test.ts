import { describe, expect, it } from "vitest";
import {
  accountTravelerTrip,
  accountTrip,
  accountTrips,
} from "../../../testing/account-access-panel-test-clients";
import {
  accountPortalExplorerPinStyle,
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
});
