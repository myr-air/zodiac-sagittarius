import { describe, expect, it } from "vitest";
import {
  buildItineraryItemDraft,
} from "@/src/trip/itinerary-core";
import {
  selectedItineraryPathIdForDay,
} from "@/src/trip/itinerary-paths";
import { nextLocalItemId } from "@/src/trip/identity";
import { seedTrip } from "@/src/trip/seed";
import { getTripFixtureItineraryItem } from "@/src/trip/testing/fixtures/trip-fixtures";
import { workspaceLocalMutationTimestamp } from "../../../support/local-mutations";
import {
  stopFormValues,
  stopLocationFields,
} from "./workspace-itinerary-stop-command-inputs.test-support";
import { buildWorkspaceCreatedStop } from "./workspace-itinerary-stop-create-inputs";

const currentMemberId = "member-owner";
const selectedTripPlanId = seedTrip.activePlanVariantId;
const planItems = seedTrip.itineraryItems;
const pathOptions = [
  { id: "main", name: "Main", scope: "trip" as const },
  { id: "path-rain", name: "Rain plan", scope: "trip" as const },
];

describe("workspace itinerary stop create inputs", () => {
  it("builds draft stops from form values and selected itinerary path", () => {
    const day = "2026-06-21";
    const pathSelection = { tripPathId: "path-rain" };
    const values = stopFormValues({ day: "" });
    const targetPathId = selectedItineraryPathIdForDay(day, pathSelection);
    const nextItemId = nextLocalItemId(seedTrip.itineraryItems, "item-new");

    expect(
      buildWorkspaceCreatedStop({
        currentMemberId,
        day,
        locationFields: stopLocationFields,
        pathOptions,
        pathSelection,
        planItems,
        selectedTripPlanId,
        trip: seedTrip,
        values,
      }),
    ).toEqual({
      draftItem: buildItineraryItemDraft(
        { ...values, day },
        {
          ...stopLocationFields,
          createdBy: currentMemberId,
          nextItemId,
          pathId: targetPathId,
          pathName: "Rain plan",
          planItems,
          selectedTripPlanId,
          trip: seedTrip,
          updatedAt: workspaceLocalMutationTimestamp,
        },
      ),
      hasParentItem: false,
      targetPathId,
    });
  });

  it("reports parent-child creates while preserving parent path draft behavior", () => {
    const parentItem = getTripFixtureItineraryItem("item-dimdim");
    const values = stopFormValues({ parentItemId: parentItem.id });
    const day = parentItem.day;
    const pathSelection = { tripPathId: "path-rain" };
    const targetPathId = selectedItineraryPathIdForDay(day, pathSelection);
    const nextItemId = nextLocalItemId(seedTrip.itineraryItems, "item-new");

    expect(
      buildWorkspaceCreatedStop({
        currentMemberId,
        day,
        locationFields: stopLocationFields,
        pathOptions,
        pathSelection,
        planItems,
        selectedTripPlanId,
        trip: seedTrip,
        values,
      }),
    ).toEqual({
      draftItem: buildItineraryItemDraft(
        { ...values, day },
        {
          ...stopLocationFields,
          createdBy: currentMemberId,
          nextItemId,
          pathId: targetPathId,
          pathName: "Rain plan",
          planItems,
          selectedTripPlanId,
          trip: seedTrip,
          updatedAt: workspaceLocalMutationTimestamp,
        },
      ),
      hasParentItem: true,
      targetPathId,
    });
  });
});
