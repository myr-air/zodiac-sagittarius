import { describe, expect, it } from "vitest";
import type { AccountTripSummary } from "@/src/account/api-client";
import {
  accountPortalExplorerPinStyle,
  buildAccountPortalExplorerTrips,
} from "../account-portal-explorer-model";

const ownerTrip: AccountTripSummary = {
  destinationLabel: "Seoul",
  endDate: "2026-06-05",
  id: "trip-owner",
  isOwner: true,
  joinedAt: "2026-05-30T08:00:00.000Z",
  memberId: "member-owner",
  name: "Seoul Spring",
  ownerMemberId: "member-owner",
  role: "owner",
  startDate: "2026-06-01",
};

const sharedTrip: AccountTripSummary = {
  destinationLabel: "Taipei",
  endDate: "2026-07-04",
  id: "trip-shared",
  isOwner: false,
  joinedAt: "2026-05-30T08:00:00.000Z",
  memberId: "member-shared",
  name: "Taipei Shared",
  ownerMemberId: "member-owner",
  role: "traveler",
  startDate: "2026-07-01",
};

describe("account portal explorer model", () => {
  it("prefers shared trips before owned trips", () => {
    expect(buildAccountPortalExplorerTrips([ownerTrip, sharedTrip], "")).toEqual([
      sharedTrip,
    ]);
  });

  it("falls back to owned trips when there are no shared trips", () => {
    expect(buildAccountPortalExplorerTrips([ownerTrip], "")).toEqual([
      ownerTrip,
    ]);
  });

  it("filters explorer trips by name, destination, and role", () => {
    expect(
      buildAccountPortalExplorerTrips([ownerTrip, sharedTrip], " traveler "),
    ).toEqual([sharedTrip]);
    expect(
      buildAccountPortalExplorerTrips([ownerTrip, sharedTrip], "seoul"),
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
