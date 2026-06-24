import { describe, expect, it } from "vitest";
import { buildInlineItineraryItemPatchRequest } from "@/src/trip/itinerary-items";
import { buildInlineItineraryItemPatch } from "@/src/trip/itinerary-core";
import { buildMapLink } from "@/src/trip/places";
import { getTripFixtureItineraryItem } from "@/src/trip/testing/fixtures/trip-fixtures";
import { workspaceLocalMutationTimestamp } from "../../../support/local-mutations";
import {
  buildWorkspaceInlinePatch,
  buildWorkspaceInlinePatchRequest,
  buildWorkspaceInlineUpdatedItem,
} from "./workspace-itinerary-inline-update-inputs";

const item = getTripFixtureItineraryItem("item-dimdim");

describe("workspace itinerary inline update inputs", () => {
  it("builds API patch requests from normalized inline item patches", () => {
    const patch = {
      activity: "  Late lunch  ",
      place: "Central Market",
    };
    const nextPatch = buildInlineItineraryItemPatch(item, patch)!;

    expect(
      buildWorkspaceInlinePatchRequest({
        clientMutationId: "mutation-1",
        item,
        patch,
      }),
    ).toEqual(
      buildInlineItineraryItemPatchRequest(nextPatch, {
        clientMutationId: "mutation-1",
        expectedVersion: item.version,
      }),
    );
  });

  it("builds local updated items with derived place fields", () => {
    const patch = {
      place: "Central Market",
      transportation: "  Taxi  ",
    };
    const nextPatch = buildWorkspaceInlinePatch(item, patch)!;

    expect(buildWorkspaceInlineUpdatedItem(item, patch)).toEqual({
      ...item,
      ...nextPatch,
      address: nextPatch.place,
      coordinates: undefined,
      mapLink: buildMapLink(nextPatch.place!),
      updatedAt: workspaceLocalMutationTimestamp,
      version: item.version + 1,
    });
  });

  it("returns null when the inline patch does not change the item", () => {
    expect(buildWorkspaceInlinePatchRequest({
      clientMutationId: "mutation-1",
      item,
      patch: { activity: item.activity },
    })).toBeNull();
    expect(
      buildWorkspaceInlineUpdatedItem(item, { activity: item.activity }),
    ).toBeNull();
  });
});
