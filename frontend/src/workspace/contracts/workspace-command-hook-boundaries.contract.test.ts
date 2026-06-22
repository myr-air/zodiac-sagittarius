import { describe, expect, it } from "vitest";
import { frontendRoot } from "../../project/contracts/project-contract.helpers";
import { readWorkspaceBoundarySources } from "./workspace-source-boundaries.sources";

describe("Sagittarius workspace command hook source boundaries", () => {
  it("keeps workspace commands, record inputs, photo albums, and expense drafts split by responsibility", () => {
    const {
      sagaCore,
      workspaceContextsHook,
      workspaceCommandsHook,
      workspaceCommandsParams,
      itineraryBookingCommands,
      bookingDocCommands,
      bookingCommandInputs,
      bookingCommandCreateInputs,
      bookingCommandDraftInputs,
      bookingCommandTicketInputs,
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
      planningCommandsParams,
      itineraryBookingCommandTypes,
      createItineraryBookingDraftCommand,
      saveItineraryBookingTicketCommand,
      unlinkItineraryBookingCommand,
      bookingDocUpdateCommands,
      bookingDocUpdateCommandTypes,
      bookingDocUpdateRunner,
      bookingDocTypeCommand,
      bookingDocQuickFieldCommand,
    } = readWorkspaceBoundarySources(frontendRoot);

    expect(sagaCore).not.toContain("useWorkspacePhotoAlbums");
    expect(sagaCore).not.toContain("useWorkspaceRecords");
    expect(sagaCore).toContain("useSagittariusWorkspaceContexts");
    expect(workspaceContextsHook).toContain("useWorkspaceCommands");
    expect(sagaCore).not.toContain("useWorkspaceAdministration");
    expect(sagaCore).not.toContain("useWorkspaceBookingCommands");
    expect(sagaCore).not.toContain("useWorkspaceItineraryCommands");
    expect(sagaCore).not.toContain("useWorkspaceItineraryImport");
    expect(workspaceCommandsHook).toContain("useWorkspacePlanningCommands");
    expect(workspaceCommandsHook).not.toContain("useWorkspaceBookingCommands");
    expect(workspaceCommandsHook).not.toContain("useWorkspaceItineraryCommands");
    expect(workspaceCommandsHook).not.toContain("useWorkspaceItineraryImport");
    expect(workspaceCommandsHook).toContain("useWorkspaceAdministration");
    expect(workspaceCommandsHook).not.toContain("type AdministrationParams");
    expect(workspaceCommandsParams).toContain("type AdministrationParams");
    expect(planningCommandsHook).toContain("useWorkspaceBookingCommands");
    expect(planningCommandsHook).toContain("useWorkspaceItineraryCommands");
    expect(planningCommandsHook).toContain("useWorkspaceItineraryImport");
    expect(planningCommandsHook).not.toContain("type BookingParams");
    expect(planningCommandsParams).toContain("type BookingParams");
    expect(sagaCore).not.toContain("useWorkspaceRecordState");
    expect(sagaCore).not.toContain("useWorkspaceRecordActions");
    expect(itineraryBookingCommands).toContain("useCreateItineraryBookingDraftCommand");
    expect(itineraryBookingCommands).toContain("useSaveItineraryBookingTicketCommand");
    expect(itineraryBookingCommands).toContain("useUnlinkItineraryBookingCommand");
    expect(itineraryBookingCommands).not.toContain("resolveItineraryBookingTicketCommandInput");
    expect(itineraryBookingCommands).not.toContain("syncItineraryDetailsWithBookingTicket");
    expect(itineraryBookingCommands).not.toContain("bookingDocInputFromRecord");
    expect(itineraryBookingCommands).not.toContain(
      "buildItineraryBookingTicketDocInput",
    );
    expect(itineraryBookingCommandTypes).toContain("UseWorkspaceItineraryBookingCommandsOptions");
    expect(createItineraryBookingDraftCommand).toContain("buildItineraryBookingDraftInput");
    expect(createItineraryBookingDraftCommand).toContain("findDuplicateBookingDoc");
    expect(saveItineraryBookingTicketCommand).toContain(
      "resolveItineraryBookingTicketCommandInput",
    );
    expect(saveItineraryBookingTicketCommand).toContain("syncItineraryDetailsWithBookingTicket");
    expect(unlinkItineraryBookingCommand).toContain("bookingDocInputFromRecord");
    expect(unlinkItineraryBookingCommand).toContain("clearItineraryBookingTicketDetails");
    expect(bookingDocCommands).toContain("buildWorkspaceBookingDocCreateInput");
    expect(bookingDocCommands).not.toContain("normalizeBookingDocTitle");
    expect(bookingDocCommands).not.toContain("resolveBookingDocCreateTripPlanId");
    expect(bookingDocUpdateCommands).toContain("useBookingDocUpdateRunner");
    expect(bookingDocUpdateCommands).toContain("useBookingDocTypeCommand");
    expect(bookingDocUpdateCommands).toContain("useBookingDocQuickFieldCommand");
    expect(bookingDocUpdateCommands).not.toContain("runWorkspaceVersionConflictRetry");
    expect(bookingDocUpdateCommands).not.toContain("bookingDocInputFromRecord");
    expect(bookingDocUpdateCommands).not.toContain("bookingDocQuickFieldsInputFromRecord");
    expect(bookingDocUpdateCommandTypes).toContain("UseWorkspaceBookingDocUpdateCommandsOptions");
    expect(bookingDocUpdateRunner).toContain("runWorkspaceVersionConflictRetry");
    expect(bookingDocUpdateRunner).toContain("queueKeyedUpdate");
    expect(bookingDocUpdateRunner).toContain("updateLocalBookingDocInTrip");
    expect(bookingDocTypeCommand).toContain("bookingDocInputFromRecord");
    expect(bookingDocQuickFieldCommand).toContain("bookingDocQuickFieldsInputFromRecord");
    expect(bookingCommandInputs).toContain("./booking-command-create-inputs");
    expect(bookingCommandInputs).toContain("./booking-command-draft-inputs");
    expect(bookingCommandInputs).toContain("./booking-command-ticket-inputs");
    expect(bookingCommandInputs).not.toContain("findDuplicateBookingDoc");
    expect(bookingCommandCreateInputs).toContain("buildWorkspaceBookingDocCreateInput");
    expect(bookingCommandCreateInputs).toContain("normalizeBookingDocTitle");
    expect(bookingCommandCreateInputs).toContain("resolveBookingDocCreateTripPlanId");
    expect(bookingCommandDraftInputs).toContain("buildItineraryBookingDraftInput");
    expect(bookingCommandDraftInputs).toContain("bookingDraftTitleForItineraryItem");
    expect(bookingCommandTicketInputs).toContain("buildItineraryBookingTicketDocInput");
    expect(bookingCommandTicketInputs).toContain("resolveItineraryBookingTicketCommandInput");
    expect(bookingCommandTicketInputs).toContain("findDuplicateBookingDoc");
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
