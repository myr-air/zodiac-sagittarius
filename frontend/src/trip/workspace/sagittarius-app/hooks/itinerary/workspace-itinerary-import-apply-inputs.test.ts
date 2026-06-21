import { describe, expect, it } from "vitest";
import type { ItineraryImportApplyTarget } from "@/src/trip/itinerary-paths";
import { applyImportedItemsToItineraryPath } from "@/src/trip/itinerary-paths";
import { seedTrip } from "@/src/trip/seed";
import type { ItineraryExportItem } from "@/src/trip/itinerary-import-export";
import type { PendingItineraryImport } from "@/src/trip/workspace/itinerary-import-model";
import {
  buildWorkspaceItineraryImportPreview,
  buildWorkspaceLocalItineraryImportApplyInput,
  importedRecordsForApplyTarget,
} from "./workspace-itinerary-import-apply-inputs";

const importedItem: ItineraryExportItem = {
  activity: "Imported museum",
  activityType: "attraction",
  day: "2026-06-19",
  details: {},
  durationMinutes: 60,
  id: "imported-museum",
  linkLabel: "",
  mapLink: "",
  note: "",
  place: "Central",
  sortOrder: 100,
  startTime: "10:00",
  transportation: "",
};

const target: ItineraryImportApplyTarget = {
  memberId: "member-aom",
  pathId: "path-rain",
  pathName: "Rain plan",
  recordMode: "clone-linked",
  scope: "trip",
  mode: "keep-alternatives",
};

function pendingImport(
  input: Partial<PendingItineraryImport> = {},
): PendingItineraryImport {
  return {
    fileName: "import.json",
    items: [importedItem],
    records: {
      bookingDocs: [],
      expenses: [],
      stopNotes: [
        {
          authorId: "member-aom",
          body: "Use exit C",
          createdAt: "2026-06-16T00:00:00.000Z",
          id: "note-imported",
          itemId: importedItem.id,
          tripId: "source-trip",
        },
      ],
      tasks: [
        {
          assigneeId: "member-aom",
          createdBy: "member-aom",
          id: "task-imported",
          kind: "booking",
          relatedItemId: importedItem.id,
          status: "open",
          title: "Buy tickets",
          visibility: "shared",
        },
      ],
    },
    ...input,
  };
}

describe("workspace itinerary import apply inputs", () => {
  it("builds import preview item sets from the path import result", () => {
    const pendingItineraryImport = pendingImport();
    const previewTrip = applyImportedItemsToItineraryPath(
      seedTrip,
      pendingItineraryImport.items,
      target,
    );
    const preview = buildWorkspaceItineraryImportPreview({
      pendingItineraryImport,
      target,
      trip: seedTrip,
    });

    expect(preview.previewTrip).toEqual(previewTrip);
    expect(preview.deletedItems).toEqual([]);
    expect(preview.previewImportedItems).toEqual([
      previewTrip.itineraryItems.at(-1),
    ]);
    expect(preview.appliedImportedItems).toEqual([
      previewTrip.itineraryItems.at(-1),
    ]);
  });

  it("builds local import records from linked records for clone-linked mode", () => {
    const pendingItineraryImport = pendingImport();
    const input = buildWorkspaceLocalItineraryImportApplyInput({
      pendingItineraryImport,
      target,
      trip: seedTrip,
    });
    const importedItemId = input.appliedImportedItems[0]!.id;

    expect(input.nextSelectedItemId).toBe(importedItemId);
    expect(input.importedPlanRecords.stopNotes).toEqual([
      expect.objectContaining({
        id: "note-imported",
        itemId: importedItemId,
        tripId: seedTrip.id,
      }),
    ]);
    expect(input.importedPlanRecords.tasks).toEqual([
      expect.objectContaining({
        id: "task-imported",
        relatedItemId: importedItemId,
      }),
    ]);
  });

  it("drops linked records for activities-only mode", () => {
    const pendingItineraryImport = pendingImport();
    const activitiesOnlyTarget = {
      ...target,
      recordMode: "activities-only" as const,
    };

    expect(
      importedRecordsForApplyTarget(pendingItineraryImport, activitiesOnlyTarget),
    ).toEqual({
      bookingDocs: [],
      expenses: [],
      stopNotes: [],
      tasks: [],
    });
    expect(
      buildWorkspaceLocalItineraryImportApplyInput({
        pendingItineraryImport,
        target: activitiesOnlyTarget,
        trip: seedTrip,
      }).importedPlanRecords,
    ).toEqual({
      bookingDocs: [],
      expenses: [],
      stopNotes: [],
      tasks: [],
    });
  });
});
