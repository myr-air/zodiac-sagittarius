import { describe, expect, it } from "vitest";
import { frontendRoot } from "../../project/contracts/project-contract.helpers";
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
    expect(administrationHook).toContain("useWorkspaceAccountClaimActions");
    expect(administrationHook).toContain("useWorkspaceMemberAdminActions");
    expect(administrationHook).toContain("useWorkspaceTripSettingsActions");
    expect(administrationHook).not.toContain("interface UseWorkspaceAdministrationOptions");
    expect(administrationCommandTypes).toContain(
      "WorkspaceAdministrationCommandBaseParams",
    );
    expect(administrationCommandTypes).toContain(
      "UseWorkspaceAdministrationOptions",
    );
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
    expect(planningCommandsHook).toContain("useWorkspaceBookingCommands");
    expect(planningCommandsHook).toContain("useWorkspaceItineraryCommands");
    expect(planningCommandsHook).toContain("useWorkspaceItineraryImport");
    expect(planningCommandsHook).not.toContain("type BookingParams");
    expect(planningCommandsParams).toContain("type BookingParams");
    expect(itineraryMoveCommands).toContain("useWorkspaceItineraryReorderCommand");
    expect(itineraryMoveCommands).toContain(
      "useWorkspaceItineraryBlockMoveCommand",
    );
    expect(itineraryMoveCommands).toContain("useWorkspaceItineraryDayMoveCommand");
    expect(itineraryMoveCommands).toContain("useWorkspaceItineraryPathMoveCommand");
    expect(itineraryMoveCommands).not.toContain("moveTripItemIntoPlanBlock");
    expect(itineraryMoveCommands).not.toContain("moveTripItemToDay");
    expect(itineraryMoveCommandTypes).toContain(
      "UseWorkspaceItineraryMoveCommandsParams",
    );
    expect(itineraryMoveCommandTypes).toContain(
      "UseWorkspaceItineraryReorderCommandParams",
    );
    expect(itineraryMoveCommandTypes).toContain(
      "UseWorkspaceItineraryPathMoveCommandParams",
    );
    expect(itineraryBlockMoveCommand).toContain("moveTripItemIntoPlanBlock");
    expect(itineraryBlockMoveCommand).toContain(
      "buildWorkspaceMoveItemPatchRequest",
    );
    expect(itineraryDayMoveCommand).toContain("moveTripItemToDay");
    expect(itineraryDayMoveCommand).toContain(
      "buildWorkspaceMoveItemToDayPatchRequest",
    );
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
    expect(itineraryStopSaveCommands).toContain(
      "useWorkspaceItineraryStopCreateCommand",
    );
    expect(itineraryStopSaveCommands).toContain(
      "useWorkspaceItineraryStopUpdateCommand",
    );
    expect(itineraryStopSaveCommands).not.toContain(
      "interface UseWorkspaceItineraryStopSaveCommandsParams",
    );
    expect(itineraryStopCommandTypes).toContain(
      "WorkspaceItineraryStopCommandBaseParams",
    );
    expect(itineraryStopCommandTypes).toContain(
      "UseWorkspaceItineraryStopSaveCommandsParams",
    );
    expect(itineraryStopCommandTypes).toContain(
      "@/src/features/itinerary/domain/stop-form-values",
    );
    expect(itineraryStopCommandTypes).not.toContain(
      "@/src/features/itinerary/components",
    );
    expect(itineraryStopCreateCommand).toContain("buildWorkspaceCreatedStop");
    expect(itineraryStopCreateCommand).toContain("placeCreatedWorkspaceStop");
    expect(itineraryStopCreateCommand).not.toContain(
      "interface UseWorkspaceItineraryStopCreateCommandParams",
    );
    expect(itineraryStopUpdateCommand).toContain("buildWorkspaceUpdatedStop");
    expect(itineraryStopUpdateCommand).toContain("placeUpdatedWorkspaceStop");
    expect(itineraryStopUpdateCommand).not.toContain(
      "interface UseWorkspaceItineraryStopUpdateCommandParams",
    );
  });
});
