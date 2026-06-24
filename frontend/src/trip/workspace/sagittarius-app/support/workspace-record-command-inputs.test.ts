import { describe, expect, it } from "vitest";
import { seedTrip } from "@/src/trip/seed";
import { getTripFixtureItineraryItem } from "@/src/trip/testing/fixtures/trip-fixtures";
import {
  buildWorkspaceStopNoteCreateInput,
  buildWorkspaceTaskCreateDraft,
} from "./workspace-record-command-inputs";

const selectedTripPlanId = seedTrip.activePlanVariantId;
const linkedItem = getTripFixtureItineraryItem("item-dimdim");

describe("workspace record command inputs", () => {
  it("builds trimmed stop-note create input with the linked item trip plan", () => {
    expect(
      buildWorkspaceStopNoteCreateInput(
        {
          itemId: linkedItem.id,
          body: "  Bring confirmation details  ",
        },
        {
          selectedTripPlanId,
          trip: seedTrip,
        },
      ),
    ).toEqual({
      itemId: linkedItem.id,
      tripPlanId: linkedItem.planVariantId,
      body: "Bring confirmation details",
    });
  });

  it("rejects blank stop-note bodies", () => {
    expect(
      buildWorkspaceStopNoteCreateInput(
        {
          itemId: linkedItem.id,
          body: "   ",
        },
        {
          selectedTripPlanId,
          trip: seedTrip,
        },
      ),
    ).toBeNull();
  });

  it("builds trimmed task drafts with scoped trip plan and private assignee", () => {
    expect(
      buildWorkspaceTaskCreateDraft(
        {
          title: "  Pack passport  ",
          visibility: "private",
          assigneeId: null,
          relatedItemId: linkedItem.id,
        },
        {
          currentMemberId: "member-aom",
          selectedTripPlanId,
          trip: seedTrip,
        },
      ),
    ).toMatchObject({
      title: "Pack passport",
      status: "open",
      visibility: "private",
      kind: "prep",
      tripPlanId: linkedItem.planVariantId,
      createdBy: "member-aom",
      assigneeId: "member-aom",
      relatedItemId: linkedItem.id,
    });
  });

  it("rejects blank task titles", () => {
    expect(
      buildWorkspaceTaskCreateDraft(
        {
          title: " ",
          visibility: "shared",
          relatedItemId: null,
        },
        {
          currentMemberId: "member-aom",
          selectedTripPlanId,
          trip: seedTrip,
        },
      ),
    ).toBeNull();
  });
});
