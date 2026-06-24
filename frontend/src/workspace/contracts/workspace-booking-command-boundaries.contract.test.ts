import { describe, expect, it } from "vitest";
import { frontendRoot } from "../../project/contracts/project-contract.helpers";
import {
  expectSourceNotToContain,
  expectSourceToContain,
} from "./workspace-source-boundaries.assertions";
import { readWorkspaceBoundarySources } from "./workspace-source-boundaries.sources";

describe("Sagittarius workspace booking command source boundaries", () => {
  it("keeps itinerary booking, booking document commands, update runners, and inputs split by responsibility", () => {
    const {
      itineraryBookingCommands,
      itineraryBookingCommandTypes,
      createItineraryBookingDraftCommand,
      saveItineraryBookingTicketCommand,
      unlinkItineraryBookingCommand,
      bookingDocCommands,
      bookingDocCommandTypes,
      createBookingDocCommand,
      deleteBookingDocCommand,
      bookingDocUpdateCommands,
      bookingDocUpdateCommandTypes,
      bookingDocUpdateRunner,
      bookingDocTypeCommand,
      bookingDocQuickFieldCommand,
      bookingCommandCreateInputs,
      bookingCommandDraftInputs,
      bookingCommandTicketInputs,
    } = readWorkspaceBoundarySources(frontendRoot);

    expectSourceToContain(itineraryBookingCommands, [
      "useCreateItineraryBookingDraftCommand",
      "useSaveItineraryBookingTicketCommand",
      "useUnlinkItineraryBookingCommand",
    ]);
    expectSourceNotToContain(itineraryBookingCommands, [
      "resolveItineraryBookingTicketCommandInput",
      "syncItineraryDetailsWithBookingTicket",
      "bookingDocInputFromRecord",
      "buildItineraryBookingTicketDocInput",
    ]);
    expect(itineraryBookingCommandTypes).toContain(
      "UseWorkspaceItineraryBookingCommandsOptions",
    );
    expectSourceToContain(createItineraryBookingDraftCommand, [
      "buildItineraryBookingDraftInput",
      "findDuplicateBookingDoc",
    ]);
    expectSourceToContain(saveItineraryBookingTicketCommand, [
      "resolveItineraryBookingTicketCommandInput",
      "syncItineraryDetailsWithBookingTicket",
    ]);
    expectSourceToContain(unlinkItineraryBookingCommand, [
      "bookingDocInputFromRecord",
      "clearItineraryBookingTicketDetails",
    ]);
    expectSourceToContain(bookingDocCommands, [
      "useCreateBookingDocCommand",
      "useDeleteBookingDocCommand",
      "useWorkspaceBookingDocUpdateCommands",
    ]);
    expectSourceNotToContain(bookingDocCommands, [
      "buildWorkspaceBookingDocCreateInput",
      "removeBookingDocFromTrip",
      "normalizeBookingDocTitle",
      "resolveBookingDocCreateTripPlanId",
    ]);
    expect(bookingDocCommandTypes).toContain(
      "UseWorkspaceBookingDocCommandsOptions",
    );
    expectSourceToContain(createBookingDocCommand, [
      "buildWorkspaceBookingDocCreateInput",
      "buildCreateBookingDocRequest",
      "createLocalBookingDoc",
    ]);
    expect(deleteBookingDocCommand).toContain("removeBookingDocFromTrip");
    expectSourceToContain(bookingDocUpdateCommands, [
      "useBookingDocUpdateRunner",
      "useBookingDocTypeCommand",
      "useBookingDocQuickFieldCommand",
    ]);
    expectSourceNotToContain(bookingDocUpdateCommands, [
      "runWorkspaceVersionConflictRetry",
      "bookingDocInputFromRecord",
      "bookingDocQuickFieldsInputFromRecord",
    ]);
    expect(bookingDocUpdateCommandTypes).toContain(
      "UseWorkspaceBookingDocUpdateCommandsOptions",
    );
    expectSourceToContain(bookingDocUpdateRunner, [
      "runWorkspaceVersionConflictRetry",
      "queueKeyedUpdate",
      "updateLocalBookingDocInTrip",
    ]);
    expect(bookingDocTypeCommand).toContain("bookingDocInputFromRecord");
    expect(bookingDocQuickFieldCommand).toContain(
      "bookingDocQuickFieldsInputFromRecord",
    );
    expectSourceToContain(bookingCommandCreateInputs, [
      "buildWorkspaceBookingDocCreateInput",
      "normalizeBookingDocTitle",
      "resolveBookingDocCreateTripPlanId",
    ]);
    expectSourceToContain(bookingCommandDraftInputs, [
      "buildItineraryBookingDraftInput",
      "bookingDraftTitleForItineraryItem",
    ]);
    expectSourceToContain(bookingCommandTicketInputs, [
      "buildItineraryBookingTicketDocInput",
      "resolveItineraryBookingTicketCommandInput",
      "findDuplicateBookingDoc",
    ]);
  });
});
