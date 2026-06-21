import { describe, expect, it } from "vitest";
import { buildUpdatedItineraryItem } from "@/src/trip/itinerary";
import { buildPatchItineraryItemRequest } from "@/src/trip/itinerary-api-requests";
import { seedTrip } from "@/src/trip/seed";
import { workspaceLocalMutationTimestamp } from "../../../support/local-mutations";
import {
  stopFormValues,
  stopLocationFields,
} from "./workspace-itinerary-stop-command-inputs.test-support";
import {
  buildWorkspaceStopUpdatePatchRequest,
  buildWorkspaceUpdatedStop,
} from "./workspace-itinerary-stop-update-inputs";

const item = seedTrip.itineraryItems[0]!;
const values = stopFormValues();

describe("workspace itinerary stop update inputs", () => {
  it("builds API patch requests from stop form values and resolved location", () => {
    expect(
      buildWorkspaceStopUpdatePatchRequest({
        clientMutationId: "mutation-1",
        editDay: "2026-06-21",
        item,
        locationFields: stopLocationFields,
        values,
      }),
    ).toEqual(
      buildPatchItineraryItemRequest(
        { ...values, day: "2026-06-21" },
        {
          ...stopLocationFields,
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
        locationFields: stopLocationFields,
        values,
      }),
    ).toEqual(
      buildUpdatedItineraryItem(
        item,
        { ...values, day: "2026-06-21" },
        {
          ...stopLocationFields,
          updatedAt: workspaceLocalMutationTimestamp,
        },
      ),
    );
  });
});
