import { describe, expect, it } from "vitest";
import { frontendRoot } from "../../project/contracts/project-contract.helpers";
import {
  expectSourceNotToContain,
  expectSourceToContain,
} from "./workspace-source-boundaries.assertions";
import { readWorkspaceBoundarySources } from "./workspace-source-boundaries.sources";

describe("Sagittarius workspace command hook source boundaries", () => {
  it("keeps workspace command orchestration, administration, planning, and itinerary commands split by responsibility", () => {
    const {
      sagaCore,
      workspaceContextsHook,
      workspaceCommandsHook,
      workspaceCommandsParams,
      administrationHook,
      administrationCommandTypes,
      memberAdminActions,
      memberPatchActions,
      accountClaimActions,
      tripSettingsActions,
      itineraryMoveCommands,
      itineraryMoveCommandTypes,
      itineraryBlockMoveCommand,
      itineraryDayMoveCommand,
      itineraryPathMoveCommand,
      itineraryInlineUpdateCommand,
      itineraryInlineUpdateInputs,
      itineraryReorderCommand,
      itineraryStopSaveCommands,
      itineraryStopCommandTypes,
      itineraryStopCreateCommand,
      itineraryStopUpdateCommand,
      planningCommandsHook,
      planningCommandsParams,
    } = readWorkspaceBoundarySources(frontendRoot);

    expect(sagaCore).toContain("useSagittariusWorkspaceContexts");
    expectSourceNotToContain(sagaCore, [
      "useWorkspacePhotoAlbums",
      "useWorkspaceRecords",
      "useWorkspaceAdministration",
      "useWorkspaceBookingCommands",
      "useWorkspaceItineraryCommands",
      "useWorkspaceItineraryImport",
    ]);
    expect(workspaceContextsHook).toContain("useWorkspaceCommands");
    expectSourceToContain(workspaceCommandsHook, [
      "useWorkspacePlanningCommands",
      "useWorkspaceAdministration",
    ]);
    expectSourceNotToContain(workspaceCommandsHook, [
      "useWorkspaceBookingCommands",
      "useWorkspaceItineraryCommands",
      "useWorkspaceItineraryImport",
      "type AdministrationParams",
    ]);
    expect(workspaceCommandsParams).toContain("type AdministrationParams");
    expectSourceToContain(administrationHook, [
      "useWorkspaceAccountClaimActions",
      "useWorkspaceMemberAdminActions",
      "useWorkspaceTripSettingsActions",
    ]);
    expect(administrationHook).not.toContain("interface UseWorkspaceAdministrationOptions");
    expectSourceToContain(administrationCommandTypes, [
      "WorkspaceAdministrationCommandBaseParams",
      "UseWorkspaceAdministrationOptions",
    ]);
    expect(memberAdminActions).toContain("UseWorkspaceMemberAdminActionsOptions");
    expect(memberAdminActions).not.toContain(
      "interface UseWorkspaceMemberAdminActionsOptions",
    );
    expect(memberPatchActions).toContain("UseWorkspaceMemberPatchActionsOptions");
    expect(memberPatchActions).not.toContain(
      "interface UseWorkspaceMemberPatchActionsOptions",
    );
    expect(accountClaimActions).toContain("UseWorkspaceAccountClaimActionsOptions");
    expect(accountClaimActions).not.toContain(
      "interface UseWorkspaceAccountClaimActionsOptions",
    );
    expect(tripSettingsActions).toContain("UseWorkspaceTripSettingsActionsOptions");
    expect(tripSettingsActions).not.toContain(
      "interface UseWorkspaceTripSettingsActionsOptions",
    );
    expectSourceToContain(planningCommandsHook, [
      "useWorkspaceBookingCommands",
      "useWorkspaceItineraryCommands",
      "useWorkspaceItineraryImport",
    ]);
    expectSourceNotToContain(planningCommandsHook, ["type BookingParams"]);
    expect(planningCommandsParams).toContain("type BookingParams");
    expectSourceToContain(itineraryMoveCommands, [
      "useWorkspaceItineraryReorderCommand",
      "useWorkspaceItineraryBlockMoveCommand",
      "useWorkspaceItineraryDayMoveCommand",
      "useWorkspaceItineraryPathMoveCommand",
    ]);
    expectSourceNotToContain(itineraryMoveCommands, [
      "moveTripItemIntoPlanBlock",
      "moveTripItemToDay",
    ]);
    expectSourceToContain(itineraryMoveCommandTypes, [
      "UseWorkspaceItineraryMoveCommandsParams",
      "UseWorkspaceItineraryReorderCommandParams",
      "UseWorkspaceItineraryPathMoveCommandParams",
    ]);
    expectSourceToContain(itineraryBlockMoveCommand, [
      "moveTripItemIntoPlanBlock",
      "buildWorkspaceMoveItemPatchRequest",
    ]);
    expectSourceToContain(itineraryDayMoveCommand, [
      "moveTripItemToDay",
      "buildWorkspaceMoveItemToDayPatchRequest",
    ]);
    expect(itineraryPathMoveCommand).toContain(
      "buildWorkspacePathMovePlacement",
    );
    expect(itineraryPathMoveCommand).not.toContain(
      "interface UseWorkspaceItineraryPathMoveCommandParams",
    );
    expect(itineraryInlineUpdateCommand).toContain("@/src/trip/itinerary-items");
    expect(itineraryInlineUpdateCommand).not.toContain(
      "@/src/features/itinerary/lib/inline-itinerary-item-patch",
    );
    expect(itineraryInlineUpdateInputs).toContain("@/src/trip/itinerary-items");
    expect(itineraryInlineUpdateInputs).not.toContain(
      "@/src/features/itinerary/lib/inline-itinerary-item-patch",
    );
    expect(itineraryReorderCommand).toContain("buildWorkspaceReorderApiInput");
    expect(itineraryReorderCommand).not.toContain(
      "interface UseWorkspaceItineraryReorderCommandParams",
    );
    expectSourceToContain(itineraryStopSaveCommands, [
      "useWorkspaceItineraryStopCreateCommand",
      "useWorkspaceItineraryStopUpdateCommand",
    ]);
    expect(itineraryStopSaveCommands).not.toContain(
      "interface UseWorkspaceItineraryStopSaveCommandsParams",
    );
    expectSourceToContain(itineraryStopCommandTypes, [
      "WorkspaceItineraryStopCommandBaseParams",
      "UseWorkspaceItineraryStopSaveCommandsParams",
      "@/src/features/itinerary/domain/stop-form-values",
    ]);
    expect(itineraryStopCommandTypes).not.toContain(
      "@/src/features/itinerary/components",
    );
    expectSourceToContain(itineraryStopCreateCommand, [
      "buildWorkspaceCreatedStop",
      "placeCreatedWorkspaceStop",
    ]);
    expect(itineraryStopCreateCommand).not.toContain(
      "interface UseWorkspaceItineraryStopCreateCommandParams",
    );
    expectSourceToContain(itineraryStopUpdateCommand, [
      "buildWorkspaceUpdatedStop",
      "placeUpdatedWorkspaceStop",
    ]);
    expect(itineraryStopUpdateCommand).not.toContain(
      "interface UseWorkspaceItineraryStopUpdateCommandParams",
    );
  });
});
