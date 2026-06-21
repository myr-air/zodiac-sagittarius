import { useItineraryPathWorkspace } from "@/src/trip/workspace/use-itinerary-path-workspace";
import { useTripWorkspaceState } from "@/src/trip/workspace/use-trip-workspace-state";
import { useWorkspaceChrome } from "@/src/trip/workspace/use-workspace-chrome";
import { useEffectivePlaceResolver } from "./use-effective-place-resolver";
import { useWorkspaceAccessContext } from "./use-workspace-access-context";
import { useWorkspaceApiClients } from "./use-workspace-api-clients";
import { useWorkspaceDataContext } from "./use-workspace-data-context";
import { useWorkspaceNavigationContext } from "./use-workspace-navigation-context";
import {
  useWorkspaceSelectedTripPlanState,
} from "./use-workspace-selected-trip-plan";
import { useWorkspaceSession } from "./use-workspace-session";
import type { UseWorkspaceSetupContextParams } from "./use-workspace-setup-context-params";
import { useWorkspaceUiState } from "./use-workspace-ui-state";

export function useWorkspaceSetupContext({
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
  const {
    accountClient,
    apiBaseUrl,
    resolvedApiClient,
  } = useWorkspaceApiClients({ apiClient, dataSource });
  const uiState = useWorkspaceUiState({
    initialJoinToken,
    initialMemberId,
    initialTrip,
  });
  const chrome = useWorkspaceChrome({ autoDismissToast: requireJoin });
  const [selectedTripPlanId, setSelectedTripPlanId] =
    useWorkspaceSelectedTripPlanState(initialTrip);
  const workspaceState = useTripWorkspaceState(
    initialTrip,
    uiState.setSelectedItemId,
  );
  const isDataSourceApiMode = dataSource === "api";
  const session = useWorkspaceSession({
    accountClient,
    initialTrip,
    isApiMode: isDataSourceApiMode,
    requireJoin,
    routeTripId,
    setCurrentMemberId: uiState.setCurrentMemberId,
    setSelectedTripPlanId,
    setTripState: workspaceState.setTripState,
  });
  const paths = useItineraryPathWorkspace(
    workspaceState.trip,
    selectedTripPlanId,
  );
  const navigation = useWorkspaceNavigationContext({
    initialView,
    routeTripId,
    setContextRailVisibility: chrome.setContextRailVisibility,
    tripId: workspaceState.trip.id,
  });
  const effectivePlaceResolver = useEffectivePlaceResolver({
    apiClient: resolvedApiClient,
    participantSession: session.participantSession,
    placeResolver,
    tripId: workspaceState.trip.id,
  });
  const access = useWorkspaceAccessContext({
    accessError: session.accessError,
    accessMode,
    accountSession: session.accountSession,
    accountSessionLoaded: session.accountSessionLoaded,
    accountTripAccessDeniedRouteId: session.accountTripAccessDeniedRouteId,
    currentMemberId: uiState.currentMemberId,
    dataSource,
    isCockpitLoaded: uiState.isCockpitLoaded,
    participantSession: session.participantSession,
    requireJoin,
    routeTripId,
    sessionRestored: session.sessionRestored,
    trip: workspaceState.trip,
  });
  const workspaceData = useWorkspaceDataContext({
    apiClient: resolvedApiClient,
    canEditPhotoAlbums: access.canEditPhotoAlbums,
    canViewExpenses: access.canViewExpenses,
    commitTrip: workspaceState.commitTrip,
    currentMemberId: access.currentMember.id,
    currentView: navigation.currentView,
    isApiMode: access.isApiMode,
    isCockpitLoaded: uiState.isCockpitLoaded,
    latestTripRef: workspaceState.latestTripRef,
    participantSession: session.participantSession,
    replaceApiTrip: workspaceState.replaceApiTrip,
    selectedTripPlanId,
    setAccessError: session.setAccessError,
    setParticipantSession: session.setParticipantSession,
    setTripState: workspaceState.setTripState,
    trip: workspaceState.trip,
  });

  return {
    ...access,
    ...chrome,
    ...navigation,
    ...paths,
    ...session,
    ...uiState,
    ...workspaceData,
    ...workspaceState,
    accountClient,
    apiBaseUrl,
    effectivePlaceResolver,
    resolvedApiClient,
    selectedTripPlanId,
    setSelectedTripPlanId,
  };
}
