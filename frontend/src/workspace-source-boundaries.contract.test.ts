import { describe, expect, it } from "vitest";
import { frontendRoot } from "./project-contract.helpers";
import { sagittariusAppBlockedBoundaryTerms } from "./workspace-source-boundaries.blocked-terms";
import { readWorkspaceBoundarySources } from "./workspace-source-boundaries.sources";

function expectSourceNotToContain(source: string, blockedTerms: readonly string[]) {
  blockedTerms.forEach((term) => expect(source).not.toContain(term));
}

describe("Sagittarius workspace source boundaries", () => {
  it("keeps workspace orchestration split by responsibility", () => {
    const {
      sagaCore,
      sagittariusAccessGate,
      workspaceAppFrame,
      workspaceMainShell,
      workspaceAccessProps,
      workspaceShellProps,
      workspaceFrameActionProps,
      workspaceFrameProps,
      workspacePageViewProps,
      workspacePlanningViewProps,
      workspaceViewProps,
      workspaceViewPropsTypes,
      workspaceFacade,
      appFacade,
      workspaceRecordsHook,
      importHook,
      accessContextHook,
      accessGateHook,
      uiStateHook,
      accessState,
      participantSessionActions,
      participantPostAuthNavigation,
      workspaceSessionHook,
      workspaceSessionRestore,
      workspaceCommandsHook,
      workspaceTripPlansHook,
      workspaceTripPlanSelection,
      itineraryBookingCommands,
      bookingCommandInputs,
      taskActionsHook,
      stopNoteActionsHook,
      recordCommandInputs,
      photoAlbumsHook,
      photoAlbumsDomain,
      photoAlbumApi,
      photoAlbumLocal,
      photoAlbumQuery,
      expenseMutationCommands,
      expenseDrafts,
      itineraryViewModelHook,
      apiClientsHook,
      backendExpenseSummaryHook,
      cockpitReplacementHook,
      memberContextHook,
      navigationContextHook,
      planningContextHook,
      planningCommandsHook,
      selectedTripPlanHook,
      workspaceDialogs,
    } = readWorkspaceBoundarySources(frontendRoot);
    expect(workspaceFacade).toContain("./sagittarius-app");
    expect(appFacade).toContain("@/src/trip/workspace/sagittarius-app");
    expect(appFacade).not.toContain('"use client"');
    const sagittariusApp = sagaCore;
    expect(sagittariusApp).toContain("./WorkspaceAppFrame");
    expect(sagittariusApp).not.toContain("./access-gate");
    expect(sagittariusApp).not.toContain("./WorkspaceMainShell");
    expect(sagittariusApp).toContain("./props");
    expect(sagittariusApp).toContain("buildWorkspaceFrameProps");
    expect(sagittariusApp).not.toContain("buildWorkspaceAccessProps");
    expect(sagittariusApp).not.toContain("buildWorkspaceShellProps");
    expect(sagittariusApp).not.toContain("buildWorkspaceViewsProps");
    expect(sagittariusApp).not.toContain("accessProps={{");
    expect(sagittariusApp).not.toContain("shellProps={{");
    expect(sagittariusApp).not.toContain("dialogsProps:");
    expect(sagittariusApp).not.toContain("toastProps:");
    expect(sagittariusApp).not.toContain("settingsProps:");
    expect(sagittariusApp).not.toContain("timelineProps:");
    expect(workspaceAccessProps).toContain("export function buildWorkspaceAccessProps");
    expect(workspaceAccessProps).toContain("sessionRestored");
    expect(workspaceAccessProps).toContain("../WorkspaceAppFrame");
    expect(workspaceShellProps).toContain("export function buildWorkspaceShellProps");
    expect(workspaceShellProps).toContain("dialogsProps:");
    expect(workspaceShellProps).toContain("toastProps:");
    expect(workspaceShellProps).toContain("../WorkspaceAppFrame");
    expect(sagittariusApp).not.toContain("buildWorkspaceFrameActionProps");
    expect(workspaceFrameProps).toContain("buildWorkspaceAccessProps");
    expect(workspaceFrameProps).toContain("buildWorkspaceShellProps");
    expect(workspaceFrameProps).toContain("buildWorkspaceViewsProps");
    expect(workspaceFrameProps).toContain("buildWorkspaceFrameActionProps");
    expect(workspaceFrameProps).toContain("export function buildWorkspaceFrameProps");
    expect(sagittariusApp).not.toContain("onAddNoteForItem: (itemId, body)");
    expect(sagittariusApp).not.toContain("onSaveDayTitle: (date, version, title)");
    expect(sagittariusApp).not.toContain("canClaimMember: Boolean(");
    expect(workspaceFrameActionProps).toContain(
      "export function buildWorkspaceFrameActionProps",
    );
    expect(workspaceFrameActionProps).toContain("onSaveDayTitle:");
    expect(workspaceFrameActionProps).toContain("canClaimMember:");
    expect(workspaceViewProps).toContain("export function buildWorkspaceViewsProps");
    expect(workspaceViewProps).toContain("buildWorkspacePageViewProps");
    expect(workspaceViewProps).toContain("buildWorkspacePlanningViewProps");
    expect(workspaceViewProps).not.toContain("settingsProps:");
    expect(workspaceViewProps).not.toContain("timelineProps:");
    expect(workspacePageViewProps).toContain("settingsProps:");
    expect(workspacePageViewProps).toContain("expensesProps:");
    expect(workspacePlanningViewProps).toContain("overviewProps:");
    expect(workspacePlanningViewProps).toContain("timelineProps:");
    expect(workspaceViewPropsTypes).toContain("@/src/trip/workspace/TripWorkspaceViews");
    expect(workspaceAppFrame).toContain("WorkspaceAccessBoundary");
    expect(workspaceAppFrame).toContain("WorkspaceMainShell");
    expect(workspaceAppFrame).not.toContain("useWorkspaceApiClients");
    expectSourceNotToContain(sagittariusApp, sagittariusAppBlockedBoundaryTerms);
    expect(sagaCore).toContain("WorkspaceAppFrame");
    expect(sagaCore).not.toContain("WorkspaceMainShell");
    expect(workspaceAppFrame).toContain("WorkspaceMainShell");
    expect(sagaCore).toContain("useWorkspaceUiState");
    expect(sagaCore).not.toContain("useState");
    expect(uiStateHook).toContain("export function useWorkspaceUiState");
    expect(uiStateHook).toContain("useState");
    expect(sagaCore).toContain("useWorkspaceApiClients");
    expect(sagaCore).not.toContain("createConfiguredTripApiClient");
    expect(sagaCore).not.toContain("createConfiguredAccountApiClient");
    expect(sagaCore).not.toContain("publicSagittariusApiBaseUrl");
    expect(apiClientsHook).toContain("createConfiguredTripApiClient");
    expect(apiClientsHook).toContain("createConfiguredAccountApiClient");
    expect(apiClientsHook).toContain("publicSagittariusApiBaseUrl");
    expect(sagaCore).toContain("useWorkspaceAccessContext");
    expect(sagaCore).not.toContain("useWorkspaceMemberContext");
    expect(accessContextHook).toContain("useWorkspaceMemberContext");
    expect(accessContextHook).toContain("deriveWorkspacePermissions");
    expect(accessContextHook).toContain("useWorkspaceAccessGate");
    expect(sagaCore).not.toContain("findSessionMember");
    expect(sagaCore).not.toContain("isLocalParticipantSession");
    expect(memberContextHook).toContain("findSessionMember");
    expect(memberContextHook).toContain("isLocalParticipantSession");
    expect(sagaCore).toContain("useWorkspaceNavigationContext");
    expect(sagaCore).not.toContain("@/src/trip/workspace/use-workspace-navigation");
    expect(sagaCore).not.toContain("workspaceViewSupportsContextRail");
    expect(sagaCore).not.toContain("appRoutes.tripExpenses");
    expect(navigationContextHook).toContain("useWorkspaceNavigation");
    expect(navigationContextHook).toContain("workspaceViewSupportsContextRail");
    expect(navigationContextHook).toContain("appRoutes.tripExpenses");
    expect(sagaCore).toContain("useWorkspaceBackendExpenseSummary");
    expect(sagaCore).not.toContain("useBackendExpenseSummary");
    expect(sagaCore).not.toContain("workspaceViewShouldSyncBackendExpenseSummary");
    expect(backendExpenseSummaryHook).toContain("useBackendExpenseSummary");
    expect(backendExpenseSummaryHook).toContain("workspaceViewShouldSyncBackendExpenseSummary");
    expect(backendExpenseSummaryHook).toContain("clearParticipantSession");
    expect(sagaCore).toContain("useWorkspacePlanningContext");
    expect(sagaCore).not.toContain("useWorkspaceCockpitReplacement");
    expect(sagaCore).not.toContain("normalizeTripPlanAliases");
    expect(cockpitReplacementHook).toContain("export function useWorkspaceCockpitReplacement");
    expect(cockpitReplacementHook).toContain("normalizeTripPlanAliases");
    expect(cockpitReplacementHook).toContain("resetBackendExpenseSummary");
    expect(planningContextHook).toContain("useWorkspaceCockpitReplacement");
    expect(planningContextHook).toContain("useWorkspaceItineraryViewModel");
    expect(planningContextHook).toContain("useWorkspaceRecords");
    expect(planningContextHook).toContain("useWorkspaceTripPlanCommands");
    expect(planningContextHook).toContain("useWorkspaceApiCockpitEffects");
    expect(sagaCore).not.toContain("useWorkspaceItineraryViewModel");
    expect(sagaCore).not.toContain("buildItineraryView");
    expect(sagaCore).not.toContain("resolveSelectedWorkspaceItem");
    expect(itineraryViewModelHook).toContain("buildItineraryView");
    expect(itineraryViewModelHook).toContain("resolveSelectedWorkspaceItem");
    expect(sagaCore).toContain("useWorkspaceSelectedTripPlanState");
    expect(sagaCore).not.toContain("useWorkspaceSelectedTripPlanSync");
    expect(planningContextHook).toContain("useWorkspaceSelectedTripPlanSync");
    expect(sagaCore).not.toContain("queueMicrotask");
    expect(selectedTripPlanHook).toContain("queueMicrotask");
    expect(selectedTripPlanHook).toContain("rememberSelectedTripPlanId");
    expect(selectedTripPlanHook).toContain("resolveSelectedTripPlanId");
    expect(sagaCore).not.toContain("@/src/trip/workspace/TripWorkspaceFrame");
    expect(sagaCore).not.toContain("@/src/trip/workspace/TripWorkspaceRail");
    expect(sagaCore).not.toContain("@/src/trip/workspace/TripWorkspaceViews");
    expect(workspaceMainShell).toContain("export function WorkspaceMainShell");
    expect(workspaceMainShell).toContain("@/src/trip/workspace/TripWorkspaceFrame");
    expect(workspaceMainShell).toContain("@/src/trip/workspace/TripWorkspaceRail");
    expect(workspaceMainShell).toContain("@/src/trip/workspace/TripWorkspaceViews");
    expect(sagaCore).toContain("WorkspaceAppFrame");
    expect(sagaCore).not.toContain("WorkspaceAccessBoundary");
    expect(workspaceAppFrame).toContain("WorkspaceAccessBoundary");
    expect(sagaCore).not.toContain("TripAccessLoadingFrame");
    expect(sagaCore).not.toContain("TripWorkspaceAccessPanel");
    expect(sagittariusAccessGate).toContain("export function WorkspaceAccessBoundary");
    expect(sagittariusAccessGate).toContain("TripAccessLoadingFrame");
    expect(sagittariusAccessGate).toContain("TripWorkspaceAccessPanel");
    expect(sagaCore).not.toContain("./WorkspaceDialogs");
    expect(workspaceMainShell).toContain("./WorkspaceDialogs");
    expect(workspaceDialogs).toContain("@/src/trip/workspace/TripWorkspaceDeleteDialog");
    expect(workspaceDialogs).toContain("@/src/trip/workspace/TripWorkspaceImportDialog");
    expect(sagaCore).not.toContain("@/src/trip/workspace/selected-trip-plan");
    expect(planningContextHook).toContain("@/src/trip/workspace/selected-trip-plan");
    expect(sagaCore).not.toContain("@/src/trip/workspace/use-backend-expense-summary");
    expect(backendExpenseSummaryHook).toContain("@/src/trip/workspace/use-backend-expense-summary");
    expect(sagaCore).toContain("@/src/trip/workspace/use-daily-briefings");
    expect(sagaCore).toContain("@/src/trip/workspace/use-itinerary-path-workspace");
    expect(sagaCore).not.toContain("@/src/trip/workspace/use-trip-workspace-records");
    expect(planningContextHook).toContain("@/src/trip/workspace/use-trip-workspace-records");
    expect(sagaCore).toContain("useWorkspacePhotoAlbums");
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
    expect(accessGateHook).toContain("resolveWorkspaceAccessState");
    expect(accessState).toContain("shouldRedirectUnauthenticatedTripRoute");
    expect(participantSessionActions).toContain("resolveParticipantPostAuthHref");
    expect(participantSessionActions).not.toContain("decodeReturnTo");
    expect(participantPostAuthNavigation).toContain("resolveJoinPostAuthReturnTo");
    expect(workspaceSessionHook).toContain("resolveWorkspaceSessionRestore");
    expect(workspaceSessionHook).not.toContain("normalizeTripPlanAliases");
    expect(workspaceSessionRestore).toContain("normalizeTripPlanAliases");
    expect(workspaceSessionRestore).toContain("resolveSelectedTripPlanId");
    expect(workspaceTripPlansHook).toContain("canSelectWorkspaceTripPlan");
    expect(workspaceTripPlansHook).toContain("resolveReloadedTripPlanSelection");
    expect(workspaceTripPlanSelection).toContain("planVariants.some");
    expect(itineraryBookingCommands).toContain(
      "resolveItineraryBookingTicketCommandInput",
    );
    expect(itineraryBookingCommands).not.toContain(
      "buildItineraryBookingTicketDocInput",
    );
    expect(bookingCommandInputs).toContain(
      "findDuplicateBookingDoc",
    );
    expect(taskActionsHook).toContain("buildWorkspaceTaskCreateDraft");
    expect(taskActionsHook).not.toContain("tripPlanIdForRecord");
    expect(stopNoteActionsHook).toContain("buildWorkspaceStopNoteCreateInput");
    expect(stopNoteActionsHook).not.toContain("tripPlanIdForRecord");
    expect(recordCommandInputs).toContain("tripPlanIdForRecord");
    expect(photoAlbumsHook).toContain("normalizePhotoAlbumCreateInput");
    expect(photoAlbumsHook).not.toContain("const title = input.title.trim()");
    expect(photoAlbumsHook).not.toContain("const url = input.url.trim()");
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
    expect(sagaCore).toContain("./hooks");
    expect(sagaCore).toContain("@/src/trip/workspace/use-trip-workspace-state");
    expect(sagaCore).toContain("@/src/trip/workspace/use-workspace-chrome");
    expect(sagaCore).not.toContain("@/src/trip/workspace/use-workspace-navigation");
    expect(navigationContextHook).toContain("@/src/trip/workspace/use-workspace-navigation");
    expect(sagaCore).not.toContain('from "@/src/components/ContextRail"');
    expect(sagaCore).not.toContain("workspaceGridClassName");
    expect(sagaCore).not.toContain("planningMainClassName");
    expect(sagaCore).not.toContain("delete-confirm-dialog");
    expect(sagaCore).not.toContain("appDeleteDialogTitleClassName");
    expect(sagaCore).not.toContain("import-options-dialog");
    expect(sagaCore).not.toContain("ItineraryImportOptionsDialog");
    expect(sagaCore).not.toContain("function buildImportedPlanRecordsForTripPlan");
    expect(sagaCore).not.toContain("function mergeApiImportedPlanRecordsIntoTrip");
    expect(sagaCore).not.toContain("function mergeImportedRecordsIntoTripPlan");
    expect(sagaCore).not.toContain("function buildImportedItineraryItemCreateRequest");
    expect(sagaCore).not.toContain("upsertById");
    expect(sagaCore).not.toContain("async function createImportedPlanRecordsViaApi");
    expect(importHook).toContain("@/src/trip/workspace/itinerary-import-model");
    expect(importHook).toContain("@/src/trip/workspace/itinerary-import-api");
    expect(workspaceRecordsHook).toContain("@/src/trip/workspace/trip-plan-records");
    expect(workspaceMainShell).toContain("WorkspaceRolePreview");
  });
});
