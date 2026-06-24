import type { useWorkspaceAdministration } from "./use-workspace-administration";
import type { useWorkspaceItineraryUiActions } from "./use-workspace-itinerary-ui-actions";
import type { useWorkspaceParticipantSessionActions } from "./use-workspace-participant-session-actions";
import type { UseWorkspacePlanningCommandsParams } from "./use-workspace-planning-commands-params";

type AdministrationParams = Parameters<typeof useWorkspaceAdministration>[0];
type ItineraryUiParams = Parameters<typeof useWorkspaceItineraryUiActions>[0];
type ParticipantSessionParams = Parameters<
  typeof useWorkspaceParticipantSessionActions
>[0];

export type UseWorkspaceCommandsParams =
  UseWorkspacePlanningCommandsParams &
  Omit<AdministrationParams, "currentMemberId" | "resolvedApiClient"> &
  Omit<ItineraryUiParams, "createStop"> &
  ParticipantSessionParams & {
    currentMemberId: string;
    resolvedApiClient:
      | UseWorkspacePlanningCommandsParams["resolvedApiClient"]
      | AdministrationParams["resolvedApiClient"];
  };
