import {
  initialSelectedTripPlanId,
  rememberSelectedTripPlanId,
  resolveSelectedTripPlanId,
} from "@/src/trip/workspace/selected-trip-plan";
import { useWorkspaceApiCockpitEffects } from "./use-workspace-api-cockpit-effects";
import { useWorkspaceCockpitReplacement } from "./use-workspace-cockpit-replacement";
import { useWorkspacePlanningRecordsContext } from "./use-workspace-planning-records-context";
import { buildWorkspacePlanningContextOutput } from "./workspace-planning-context-output";
import type { UseWorkspacePlanningContextParams } from "./use-workspace-planning-context-params";
import { useWorkspaceSelectedTripPlanSync } from "./use-workspace-selected-trip-plan";
import { useWorkspaceTripPlanCommands } from "./use-workspace-trip-plans";

export function useWorkspacePlanningContext({
  activePlanItems,
  backendExpenseSummary,
  canCreateStopNote,
  canCreateSuggestion,
  canEdit,
  canManageTripPlans,
  canReviewSuggestions,
  commitTrip,
  currentMember,
  initialTrip,
  isApiMode,
  latestTripRef,
  mainPlanItems,
  participantSession,
  planItems,
  replaceDailyBriefings,
  resetBackendExpenseSummary,
  resetDailyBriefings,
  resolvedApiClient,
  selectedItemId,
  selectedTripPlanId,
  sessionRestored,
  setAccessError,
  setContextRailPreferredTab,
  setIsCockpitLoaded,
  setIsTripPlanBusy,
  setParticipantSession,
  setSelectedItemId,
  setSelectedTripPlanId,
  setTripPlanError,
  setTripState,
  trip,
  tripPlanErrorMessage,
  updateApiTrip,
}: UseWorkspacePlanningContextParams) {
  useWorkspaceSelectedTripPlanSync({
    isApiMode,
    sessionRestored,
    setSelectedTripPlanId,
    trip,
  });
  const records = useWorkspacePlanningRecordsContext({
    activePlanItems,
    backendExpenseSummary,
    canCreateStopNote,
    canCreateSuggestion,
    canEdit,
    canReviewSuggestions,
    commitTrip,
    currentMember,
    initialTrip,
    isApiMode,
    latestTripRef,
    mainPlanItems,
    participantSession,
    planItems,
    resolvedApiClient,
    selectedItemId,
    selectedTripPlanId,
    setContextRailPreferredTab,
    setSelectedItemId,
    trip,
  });
  const {
    replaceWorkspaceRecords,
  } = records;

  const replaceCockpitFromApi = useWorkspaceCockpitReplacement({
    replaceWorkspaceRecords,
    resetBackendExpenseSummary,
    setIsCockpitLoaded,
    setTripState,
  });

  const tripPlanCommands = useWorkspaceTripPlanCommands({
    canManageTripPlans,
    isApiMode,
    latestTripRef,
    participantSession,
    rememberSelectedTripPlanId,
    replaceCockpitFromApi,
    resolveSelectedTripPlanId,
    selectedTripPlanId,
    setIsTripPlanBusy,
    setSelectedTripPlanId,
    setTripPlanError,
    trip,
    tripPlanErrorMessage,
    commitTrip,
    updateApiTrip,
    initialSelectedTripPlanId,
    resolvedApiClient,
  });

  useWorkspaceApiCockpitEffects({
    isApiMode,
    participantSession,
    rememberSelectedTripPlanId,
    replaceCockpitFromApi,
    replaceDailyBriefings,
    resetDailyBriefings,
    resolvedApiClient,
    resolveSelectedTripPlanId,
    setAccessError,
    setIsCockpitLoaded,
    setParticipantSession,
    setSelectedTripPlanId,
    updateApiTrip,
  });

  return buildWorkspacePlanningContextOutput({
    records,
    replaceCockpitFromApi,
    tripPlanCommands,
  });
}

export type WorkspacePlanningContext = ReturnType<typeof useWorkspacePlanningContext>;
