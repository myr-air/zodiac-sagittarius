import { describe, expect, it } from "vitest";
import { frontendRoot } from "./project-contract.helpers";
import { readWorkspaceBoundarySources } from "./workspace-source-boundaries.sources";

describe("Sagittarius workspace command hook source boundaries", () => {
  it("keeps workspace commands, record inputs, photo albums, and expense drafts split by responsibility", () => {
    const {
      sagaCore,
      workspaceCommandsHook,
      itineraryBookingCommands,
      bookingCommandInputs,
      taskActionsHook,
      stopNoteActionsHook,
      recordCommandInputs,
      photoAlbumsHook,
      photoAlbumApiCommands,
      photoAlbumLocalCommands,
      photoAlbumsDomain,
      photoAlbumApi,
      photoAlbumLocal,
      photoAlbumQuery,
      expenseMutationCommands,
      expenseDrafts,
      planningCommandsHook,
    } = readWorkspaceBoundarySources(frontendRoot);

    expect(sagaCore).not.toContain("useWorkspacePhotoAlbums");
    expect(sagaCore).not.toContain("useWorkspaceRecords");
    expect(sagaCore).toContain("useWorkspaceCommands");
    expect(sagaCore).not.toContain("useWorkspaceAdministration");
    expect(sagaCore).not.toContain("useWorkspaceBookingCommands");
    expect(sagaCore).not.toContain("useWorkspaceItineraryCommands");
    expect(sagaCore).not.toContain("useWorkspaceItineraryImport");
    expect(workspaceCommandsHook).toContain("useWorkspacePlanningCommands");
    expect(workspaceCommandsHook).not.toContain("useWorkspaceBookingCommands");
    expect(workspaceCommandsHook).not.toContain("useWorkspaceItineraryCommands");
    expect(workspaceCommandsHook).not.toContain("useWorkspaceItineraryImport");
    expect(workspaceCommandsHook).toContain("useWorkspaceAdministration");
    expect(planningCommandsHook).toContain("useWorkspaceBookingCommands");
    expect(planningCommandsHook).toContain("useWorkspaceItineraryCommands");
    expect(planningCommandsHook).toContain("useWorkspaceItineraryImport");
    expect(sagaCore).not.toContain("useWorkspaceRecordState");
    expect(sagaCore).not.toContain("useWorkspaceRecordActions");
    expect(itineraryBookingCommands).toContain(
      "resolveItineraryBookingTicketCommandInput",
    );
    expect(itineraryBookingCommands).not.toContain(
      "buildItineraryBookingTicketDocInput",
    );
    expect(bookingCommandInputs).toContain("findDuplicateBookingDoc");
    expect(taskActionsHook).toContain("buildWorkspaceTaskCreateDraft");
    expect(taskActionsHook).not.toContain("tripPlanIdForRecord");
    expect(stopNoteActionsHook).toContain("buildWorkspaceStopNoteCreateInput");
    expect(stopNoteActionsHook).not.toContain("tripPlanIdForRecord");
    expect(recordCommandInputs).toContain("tripPlanIdForRecord");
    expect(photoAlbumsHook).toContain("normalizePhotoAlbumCreateInput");
    expect(photoAlbumsHook).toContain("useWorkspaceApiPhotoAlbumCommands");
    expect(photoAlbumsHook).toContain("useWorkspaceLocalPhotoAlbumCommands");
    expect(photoAlbumsHook).not.toContain("const title = input.title.trim()");
    expect(photoAlbumsHook).not.toContain("const url = input.url.trim()");
    expect(photoAlbumApiCommands).toContain("isVersionConflict");
    expect(photoAlbumApiCommands).toContain("buildCreatePhotoAlbumRequest");
    expect(photoAlbumApiCommands).toContain("buildPatchPhotoAlbumRequest");
    expect(photoAlbumLocalCommands).toContain("createLocalPhotoAlbum");
    expect(photoAlbumLocalCommands).toContain("updateLocalPhotoAlbumInTrip");
    expect(photoAlbumsDomain).toContain("./photo-album-api");
    expect(photoAlbumsDomain).toContain("./photo-album-local");
    expect(photoAlbumsDomain).toContain("./photo-album-query");
    expect(photoAlbumApi).toContain("serializePhotoAlbumInputForApi");
    expect(photoAlbumLocal).toContain("normalizePhotoAlbumCreateInput");
    expect(photoAlbumLocal).toContain("createLocalPhotoAlbum");
    expect(photoAlbumQuery).toContain("buildPhotoAlbumSummary");
    expect(expenseMutationCommands).toContain(
      "resolveExpenseCreateDraftTripPlanId",
    );
    expect(expenseDrafts).toContain("resolveExpenseCreateDraftTripPlanId");
  });
});
