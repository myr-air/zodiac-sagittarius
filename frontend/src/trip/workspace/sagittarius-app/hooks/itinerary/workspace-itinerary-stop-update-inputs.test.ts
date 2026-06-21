import { describe, expect, it } from "vitest";
import type { StopFormValues } from "@/src/features/itinerary/components";
import { buildUpdatedItineraryItem } from "@/src/trip/itinerary";
import { buildPatchItineraryItemRequest } from "@/src/trip/itinerary-api-requests";
import { seedTrip } from "@/src/trip/seed";
import { workspaceLocalMutationTimestamp } from "../../support/local-mutations";
import {
  buildWorkspaceStopUpdatePatchRequest,
  buildWorkspaceUpdatedStop,
} from "./workspace-itinerary-stop-update-inputs";

const item = seedTrip.itineraryItems[0]!;

const values: StopFormValues = {
  day: "2026-06-20",
  pathId: "path-rain",
  parentItemId: null,
  itemKind: "activity",
  timeMode: "scheduled",
  isPlanBlock: false,
  status: "confirmed",
  priority: "normal",
  startTime: "10:00",
  endTime: "11:00",
  endOffsetDays: 0,
  activity: "Updated stop",
  activityType: "food",
  place: "Updated place",
  mapLink: "https://maps.example/updated",
  durationMinutes: 60,
  transportation: "Walk",
  details: { note: "details" },
  note: "Bring booking code",
};

const locationFields = {
  address: "123 Updated Road",
  coordinates: { lat: 13.7563, lng: 100.5018 },
  mapLink: "https://maps.example/resolved",
};

describe("workspace itinerary stop update inputs", () => {
  it("builds API patch requests from stop form values and resolved location", () => {
    expect(
      buildWorkspaceStopUpdatePatchRequest({
        clientMutationId: "mutation-1",
        editDay: "2026-06-21",
        item,
        locationFields,
        values,
      }),
    ).toEqual(
      buildPatchItineraryItemRequest(
        { ...values, day: "2026-06-21" },
        {
          ...locationFields,
          clientMutationId: "mutation-1",
          expectedVersion: item.version,
        },
      ),
    );
  });

  it("builds local updated stops with the workspace mutation timestamp", () => {
    expect(
      buildWorkspaceUpdatedStop({
        editDay: "2026-06-21",
        item,
        locationFields,
        values,
      }),
    ).toEqual(
      buildUpdatedItineraryItem(
        item,
        { ...values, day: "2026-06-21" },
        {
          ...locationFields,
          updatedAt: workspaceLocalMutationTimestamp,
        },
      ),
    );
  });
});
