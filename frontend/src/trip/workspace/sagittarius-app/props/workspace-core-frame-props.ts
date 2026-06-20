import type {
  useWorkspaceCommands,
  useWorkspacePlanningContext,
  useWorkspaceSetupContext,
} from "../hooks";
import type { SagittariusAccessMode, SagittariusPortalSection } from "../types";
import { buildWorkspaceFrameProps } from "./workspace-frame-props";
import { buildWorkspaceCoreCommandProps } from "./workspace-core-command-props";
import { buildWorkspaceCoreRecordProps } from "./workspace-core-record-props";

type WorkspaceSetupContext = ReturnType<typeof useWorkspaceSetupContext>;
type WorkspacePlanningContext = ReturnType<typeof useWorkspacePlanningContext>;
type WorkspaceCommands = ReturnType<typeof useWorkspaceCommands>;

interface BuildWorkspaceCoreFramePropsInput {
  accessMode: SagittariusAccessMode;
  accountSuccessRedirectHref?: string;
  commands: WorkspaceCommands;
  initialJoinCode?: string;
  initialJoinToken?: string | null;
  planning: WorkspacePlanningContext;
  portalSection: SagittariusPortalSection;
  requireJoin: boolean;
  routeTripId?: string;
  setup: WorkspaceSetupContext;
  t: Parameters<typeof buildWorkspaceFrameProps>[0]["t"];
}

export function buildWorkspaceCoreFrameProps({
  accessMode,
  accountSuccessRedirectHref,
  commands,
  initialJoinCode,
  initialJoinToken,
  planning,
  portalSection,
  requireJoin,
  routeTripId,
  setup,
  t,
}: BuildWorkspaceCoreFramePropsInput) {
  return buildWorkspaceFrameProps({
    ...buildWorkspaceCoreCommandProps({ commands, planning, setup }),
    ...buildWorkspaceCoreRecordProps(planning),
    accessError: setup.accessError,
    accessMode,
    accountClaimState: setup.accountClaimState,
    accountClient: setup.accountClient,
    accountSession: setup.accountSession,
    accountSessionLoaded: setup.accountSessionLoaded,
    accountSuccessRedirectHref,
    activePlanItems: setup.activePlanItems,
    apiBaseUrl: setup.apiBaseUrl,
    canAccessPanel: setup.canAccessPanel,
    canCreateStopNote: setup.canCreateStopNote,
    canCreateSuggestion: setup.canCreateSuggestion,
    canEdit: setup.canEdit,
    canEditBookings: setup.canEditBookings,
    canEditExpenses: setup.canEditExpenses,
    canEditPhotoAlbums: setup.canEditPhotoAlbums,
    canManagePeople: setup.canManagePeople,
    canReviewSuggestions: setup.canReviewSuggestions,
    contextRailMounted: setup.contextRailMounted,
    contextRailOpen: setup.contextRailOpen,
    contextRailPreferredTab: setup.contextRailPreferredTab,
    currentMember: setup.currentMember,
    currentView: setup.currentView,
    dailyBriefings: setup.visibleDailyBriefings,
    dayPathOverrides: setup.dayPathOverrides,
    dialogDeleteItem: setup.dialogDeleteItem,
    dialogState: setup.dialogState,
    effectivePlaceResolver: setup.effectivePlaceResolver,
    initialJoinCode,
    initialJoinToken,
    isAccountTripAccessPending: setup.isAccountTripAccessPending,
    isApiMode: setup.isApiMode,
    isToastDismissing: setup.toastDismissing,
    isTripLoading: setup.isTripLoading,
    isTripPlanBusy: setup.isTripPlanBusy,
    joinInviteToken: setup.joinInviteToken,
    mainPlanItems: setup.mainPlanItems,
    pathOptions: setup.pathOptions,
    photoAlbumLinks: setup.trip.photoAlbumLinks ?? [],
    planItems: setup.planItems,
    portalSection,
    participantSession: setup.participantSession,
    requireJoin,
    resolvedApiClient: setup.resolvedApiClient,
    routeTripId,
    selectedTripPathId: setup.selectedTripPathId,
    selectedTripPlanId: setup.selectedTripPlanId,
    sessionMember: setup.sessionMember,
    sessionRestored: setup.sessionRestored,
    shouldRedirectUnauthenticatedTripRoute:
      setup.shouldRedirectUnauthenticatedTripRoute,
    showAllPaths: setup.showAllPaths,
    sidebarCollapsed: setup.sidebarCollapsed,
    stopPlaceResolution: setup.stopPlaceResolution,
    supportsContextRail: setup.supportsContextRail,
    t,
    toastDismissed: setup.toastDismissed,
    trip: setup.trip,
    tripPlanError: setup.tripPlanError,
  });
}
