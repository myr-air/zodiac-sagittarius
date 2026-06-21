import { useI18n } from "@/src/i18n/I18nProvider";
import { useWorkspaceCommands } from "./use-workspace-commands";
import { useWorkspacePlanningContext } from "./use-workspace-planning-context";
import {
  buildWorkspaceCommandsParams,
  buildWorkspacePlanningContextParams,
} from "./use-sagittarius-workspace-context-inputs";
import { useWorkspaceSetupContext } from "./use-workspace-setup-context";
import type { UseWorkspaceSetupContextParams } from "./use-workspace-setup-context-params";

export function useSagittariusWorkspaceContexts({
  accessMode,
  apiClient,
  dataSource,
  initialJoinToken,
  initialMemberId,
  initialTrip,
  initialView,
  placeResolver,
  requireJoin,
  routeTripId,
}: UseWorkspaceSetupContextParams) {
  const { t } = useI18n();
  const setup = useWorkspaceSetupContext({
    accessMode,
    apiClient,
    dataSource,
    initialJoinToken,
    initialMemberId,
    initialTrip,
    initialView,
    placeResolver,
    requireJoin,
    routeTripId,
  });
  const tripPlanErrorMessage = t.itinerary.tripPlans.error;
  const planning = useWorkspacePlanningContext(
    buildWorkspacePlanningContextParams(setup, {
      initialTrip,
      tripPlanErrorMessage,
    }),
  );

  const commands = useWorkspaceCommands(
    buildWorkspaceCommandsParams(setup, planning, {
      canSaveItineraryErrorMessage: t.itinerary.saveError,
      initialTrip,
      routeTripId,
      tripPlanErrorMessage,
    }),
  );

  return {
    commands,
    planning,
    setup,
    t,
  };
}
