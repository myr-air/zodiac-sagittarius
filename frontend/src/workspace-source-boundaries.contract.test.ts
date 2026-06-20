import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const testDir = dirname(fileURLToPath(import.meta.url));
const frontendRoot = resolve(testDir, "..");

function expectSourceNotToContain(source: string, blockedTerms: string[]) {
  blockedTerms.forEach((term) => expect(source).not.toContain(term));
}

describe("Sagittarius workspace source boundaries", () => {
  it("keeps workspace orchestration split by responsibility", () => {
    const sagaCore = readFileSync(
      join(frontendRoot, "src/trip/workspace/sagittarius-app/SagittariusAppCore.tsx"),
      "utf8",
    );
    const sagittariusAccessGate = readFileSync(
      join(frontendRoot, "src/trip/workspace/sagittarius-app/access-gate.tsx"),
      "utf8",
    );
    const workspaceMainShell = readFileSync(
      join(frontendRoot, "src/trip/workspace/sagittarius-app/WorkspaceMainShell.tsx"),
      "utf8",
    );
    const workspaceFacade = readFileSync(
      join(frontendRoot, "src/trip/workspace/SagittariusApp.tsx"),
      "utf8",
    );
    const appFacade = readFileSync(join(frontendRoot, "src/app/SagittariusApp.tsx"), "utf8");
    const workspaceRecordsHook = readFileSync(
      join(frontendRoot, "src/trip/workspace/use-trip-workspace-records.ts"),
      "utf8",
    );
    const importHook = readFileSync(
      join(frontendRoot, "src/trip/workspace/sagittarius-app/hooks/use-workspace-itinerary-import.ts"),
      "utf8",
    );
    const accessGateHook = readFileSync(
      join(frontendRoot, "src/trip/workspace/sagittarius-app/hooks/use-workspace-access-gate.ts"),
      "utf8",
    );
    const uiStateHook = readFileSync(
      join(frontendRoot, "src/trip/workspace/sagittarius-app/hooks/use-workspace-ui-state.ts"),
      "utf8",
    );
    const accessState = readFileSync(
      join(frontendRoot, "src/trip/workspace/sagittarius-app/hooks/workspace-access-state.ts"),
      "utf8",
    );
    const participantSessionActions = readFileSync(
      join(frontendRoot, "src/trip/workspace/sagittarius-app/hooks/use-workspace-participant-session-actions.ts"),
      "utf8",
    );
    const participantPostAuthNavigation = readFileSync(
      join(frontendRoot, "src/trip/workspace/sagittarius-app/hooks/participant-post-auth-navigation.ts"),
      "utf8",
    );
    const workspaceSessionHook = readFileSync(
      join(frontendRoot, "src/trip/workspace/sagittarius-app/hooks/use-workspace-session.ts"),
      "utf8",
    );
    const workspaceSessionRestore = readFileSync(
      join(frontendRoot, "src/trip/workspace/sagittarius-app/hooks/workspace-session-restore.ts"),
      "utf8",
    );
    const workspaceTripPlansHook = readFileSync(
      join(frontendRoot, "src/trip/workspace/sagittarius-app/hooks/use-workspace-trip-plans.ts"),
      "utf8",
    );
    const workspaceTripPlanSelection = readFileSync(
      join(frontendRoot, "src/trip/workspace/sagittarius-app/hooks/trip-plans/workspace-trip-plan-selection.ts"),
      "utf8",
    );
    const itineraryBookingCommands = readFileSync(
      join(frontendRoot, "src/trip/workspace/sagittarius-app/hooks/bookings/use-workspace-itinerary-booking-commands.ts"),
      "utf8",
    );
    const bookingCommandInputs = readFileSync(
      join(frontendRoot, "src/trip/workspace/sagittarius-app/hooks/bookings/booking-command-inputs.ts"),
      "utf8",
    );
    const taskActionsHook = readFileSync(
      join(frontendRoot, "src/trip/workspace/sagittarius-app/hooks/records/use-workspace-task-actions.ts"),
      "utf8",
    );
    const stopNoteActionsHook = readFileSync(
      join(frontendRoot, "src/trip/workspace/sagittarius-app/hooks/records/use-workspace-stop-note-actions.ts"),
      "utf8",
    );
    const recordCommandInputs = readFileSync(
      join(frontendRoot, "src/trip/workspace/sagittarius-app/hooks/records/workspace-record-command-inputs.ts"),
      "utf8",
    );
    const photoAlbumsHook = readFileSync(
      join(frontendRoot, "src/trip/workspace/sagittarius-app/hooks/use-workspace-photo-albums.ts"),
      "utf8",
    );
    const photoAlbumsDomain = readFileSync(
      join(frontendRoot, "src/trip/photo-albums.ts"),
      "utf8",
    );
    const photoAlbumApi = readFileSync(
      join(frontendRoot, "src/trip/photo-album-api.ts"),
      "utf8",
    );
    const photoAlbumLocal = readFileSync(
      join(frontendRoot, "src/trip/photo-album-local.ts"),
      "utf8",
    );
    const photoAlbumQuery = readFileSync(
      join(frontendRoot, "src/trip/photo-album-query.ts"),
      "utf8",
    );
    const expenseMutationCommands = readFileSync(
      join(frontendRoot, "src/trip/workspace/sagittarius-app/hooks/expenses/use-workspace-expense-mutation-commands.ts"),
      "utf8",
    );
    const expenseDrafts = readFileSync(
      join(frontendRoot, "src/trip/expense-drafts.ts"),
      "utf8",
    );
    const itineraryViewModelHook = readFileSync(
      join(frontendRoot, "src/trip/workspace/sagittarius-app/hooks/use-workspace-itinerary-view-model.ts"),
      "utf8",
    );
    const apiClientsHook = readFileSync(
      join(frontendRoot, "src/trip/workspace/sagittarius-app/hooks/use-workspace-api-clients.ts"),
      "utf8",
    );
    const backendExpenseSummaryHook = readFileSync(
      join(frontendRoot, "src/trip/workspace/sagittarius-app/hooks/use-workspace-backend-expense-summary.ts"),
      "utf8",
    );
    const memberContextHook = readFileSync(
      join(frontendRoot, "src/trip/workspace/sagittarius-app/hooks/use-workspace-member-context.ts"),
      "utf8",
    );
    const selectedTripPlanHook = readFileSync(
      join(frontendRoot, "src/trip/workspace/sagittarius-app/hooks/use-workspace-selected-trip-plan.ts"),
      "utf8",
    );
    const workspaceDialogs = readFileSync(
      join(frontendRoot, "src/trip/workspace/sagittarius-app/WorkspaceDialogs.tsx"),
      "utf8",
    );
    const bookingDisplay = readFileSync(
      join(frontendRoot, "src/features/workspace/pages/bookings-docs/booking-display.ts"),
      "utf8",
    );
    const bookingFolders = readFileSync(
      join(frontendRoot, "src/features/workspace/pages/bookings-docs/booking-folders.ts"),
      "utf8",
    );
    const bookingList = readFileSync(
      join(frontendRoot, "src/features/workspace/pages/bookings-docs/booking-list.ts"),
      "utf8",
    );
    const bookingDialog = readFileSync(
      join(frontendRoot, "src/features/workspace/pages/bookings-docs/components/BookingDialog.tsx"),
      "utf8",
    );
    const bookingDialogState = readFileSync(
      join(frontendRoot, "src/features/workspace/pages/bookings-docs/components/useBookingDialogState.ts"),
      "utf8",
    );
    const itineraryTimeLib = readFileSync(
      join(frontendRoot, "src/features/itinerary/lib/itinerary-time.ts"),
      "utf8",
    );
    const overviewPage = readFileSync(
      join(frontendRoot, "src/features/itinerary/components/overview/OverviewPage.tsx"),
      "utf8",
    );
    const overviewCockpit = readFileSync(
      join(frontendRoot, "src/features/itinerary/components/overview/OverviewCockpit.tsx"),
      "utf8",
    );
    const overviewTaskDialog = readFileSync(
      join(frontendRoot, "src/features/itinerary/components/overview/OverviewTaskDialog.tsx"),
      "utf8",
    );
    const overviewWeatherBriefing = readFileSync(
      join(frontendRoot, "src/features/itinerary/components/overview/OverviewWeatherBriefing.tsx"),
      "utf8",
    );
    const routeMapTypes = readFileSync(
      join(frontendRoot, "src/features/itinerary/components/route-map/route-map.types.ts"),
      "utf8",
    );
    const routeMapView = readFileSync(
      join(frontendRoot, "src/features/itinerary/components/route-map/RouteMapView.tsx"),
      "utf8",
    );
    const routeMapUnresolvedPanel = readFileSync(
      join(frontendRoot, "src/features/itinerary/components/route-map/RouteMapUnresolvedPanel.tsx"),
      "utf8",
    );
    const routeLiveMapHook = readFileSync(
      join(frontendRoot, "src/features/itinerary/components/route-map/use-route-live-map.ts"),
      "utf8",
    );
    const routeMapUtils = readFileSync(
      join(frontendRoot, "src/features/itinerary/components/route-map/route-map.utils.ts"),
      "utf8",
    );
    const stopDialog = readFileSync(
      join(frontendRoot, "src/features/itinerary/components/stop-dialog/StopDialog.tsx"),
      "utf8",
    );
    const stopDialogModel = readFileSync(
      join(frontendRoot, "src/features/itinerary/components/stop-dialog/use-stop-dialog-model.ts"),
      "utf8",
    );
    const stopDialogForm = readFileSync(
      join(frontendRoot, "src/features/itinerary/components/stop-dialog/stop-dialog.form.ts"),
      "utf8",
    );
    const tripSettingsPageSource = readFileSync(
      join(frontendRoot, "src/features/workspace/pages/trip-settings/TripSettingsPage.tsx"),
      "utf8",
    );
    const tripSettingsIndexSource = readFileSync(
      join(frontendRoot, "src/features/workspace/pages/trip-settings/index.ts"),
      "utf8",
    );
    const memberSupport = readFileSync(
      join(frontendRoot, "src/features/workspace/pages/members/TripMembersPage.support.ts"),
      "utf8",
    );
    const accountAccessPanel = readFileSync(
      join(frontendRoot, "src/features/account/components/account-access-panel/AccountAccessPanel.tsx"),
      "utf8",
    );
    const accountAccessChrome = readFileSync(
      join(frontendRoot, "src/features/account/components/account-access-panel/account-access-panel-chrome.tsx"),
      "utf8",
    );
    const accountTripWizardSupport = readFileSync(
      join(frontendRoot, "src/features/account/components/account-access-panel/trip-wizard/account-trip-wizard-support.ts"),
      "utf8",
    );
    const portalTripWizard = readFileSync(
      join(frontendRoot, "src/features/account/components/account-access-panel/trip-wizard/portal-trip-wizard.tsx"),
      "utf8",
    );
    const portalTripWizardModel = readFileSync(
      join(frontendRoot, "src/features/account/components/account-access-panel/trip-wizard/use-portal-trip-wizard-model.ts"),
      "utf8",
    );
    const portalTripWizardActions = readFileSync(
      join(frontendRoot, "src/features/account/components/account-access-panel/trip-wizard/portal-trip-wizard-actions.tsx"),
      "utf8",
    );
    const accountAuthSupport = readFileSync(
      join(frontendRoot, "src/features/account/components/account-access-panel/auth/account-auth-support.ts"),
      "utf8",
    );
    const emailLoginStepContent = readFileSync(
      join(frontendRoot, "src/features/account/components/account-access-panel/email-login/account-email-login-step-content.tsx"),
      "utf8",
    );
    const dateTimePickers = readFileSync(
      join(frontendRoot, "src/shared/components/date-time-pickers/DateTimePickers.tsx"),
      "utf8",
    );
    const tripJoinGate = readFileSync(
      join(frontendRoot, "src/features/account/components/trip-join-gate/TripJoinGate.tsx"),
      "utf8",
    );
    const tripJoinGateChrome = readFileSync(
      join(frontendRoot, "src/features/account/components/trip-join-gate/TripJoinGateChrome.tsx"),
      "utf8",
    );
    const tripJoinGateVisual = readFileSync(
      join(frontendRoot, "src/features/account/components/trip-join-gate/TripJoinGateVisual.tsx"),
      "utf8",
    );
    const tripJoinRoomForm = readFileSync(
      join(frontendRoot, "src/features/account/components/trip-join-gate/TripJoinRoomForm.tsx"),
      "utf8",
    );
    const tripJoinParticipantStep = readFileSync(
      join(frontendRoot, "src/features/account/components/trip-join-gate/TripJoinParticipantStep.tsx"),
      "utf8",
    );
    const tripJoinGateStyles = readFileSync(
      join(frontendRoot, "src/features/account/components/trip-join-gate/trip-join-gate.styles.ts"),
      "utf8",
    );
    const tripWizardFormSections = readFileSync(
      join(frontendRoot, "src/features/account/components/account-access-panel/trip-wizard/portal-trip-wizard-form-sections.tsx"),
      "utf8",
    );
    expect(workspaceFacade).toContain("./sagittarius-app");
    expect(appFacade).toContain("@/src/trip/workspace/sagittarius-app");
    expect(appFacade).not.toContain('"use client"');
    const sagittariusApp = sagaCore;
    expectSourceNotToContain(sagittariusApp, [
      "function shouldUseApiItineraryImport",
      "interface PendingItineraryImport",
      "resolveViewFromPath",
      "navigatedView",
      "setContextRailMounted",
      "setSidebarCollapsed",
      "setToastDismissed",
      "setToastDismissing",
      "buildFallbackBriefings",
      "buildPatchDailyBriefingRequest",
      "useState<{ tripPlanId: string; summary: ExpenseSummary } | null>",
      "@/src/trip/trip-fixtures",
      "tripFixtureSuggestions",
      "tripFixtureTasks",
      "tripFixtureStopNotes",
      "function resolveSelectedTripPlanId",
      "function rememberSelectedTripPlanId",
      "function selectTripPlanRecords",
      "function tripPlanIdForRecord",
      "buildItineraryCommitmentsByItemId",
      "buildExpenseSummary",
      "function loadPersistedParticipantSession",
      "function clearParticipantSession",
      "function loadPersistedTrip",
      "function persistTripDraft",
      "useState<ItineraryPathSelection>",
      "function changeTripPath",
      "function toggleShowAllPaths",
      "past: Trip[]",
      "future: Trip[]",
      "function replaceTripParticipant",
      "function appendTripParticipant",
      "function nextLocalItemId",
      "function nextLocalSuggestionId",
      "function nextLocalTaskId",
      "function nextLocalStopNoteId",
      "function nextLocalBookingDocId",
      "function nextLocalPhotoAlbumId",
      "function nextLocalPlanVariantId",
      "function nextLocalExpenseId",
      "function nextClientMutationId",
      "function normalizeTripPlanAliases",
      "function buildSetMainTripPlanRequest",
      "function buildPatchTripPlanStatusRequest",
      "function buildRenameTripPlanRequest",
      "function buildCreateTripPlanRequest",
      "function buildCreateMemberRequest",
      "function buildPatchMemberRoleRequest",
      "function buildPatchMemberAccessStatusRequest",
      "function buildPatchMemberPasswordRequest",
      "function buildUpdatePresenceRequest",
      "function updateTripPlanInTrip",
      "function mergePublishedTripPlan",
      "function setLocalMainTripPlan",
      "function createLocalTripPlan",
      "function buildCreateEditSuggestionRequest",
      "function createLocalEditSuggestion",
      "function rejectSuggestionById",
      "function buildPatchDailyBriefingRequest",
      "function applyDailyBriefingOverrides",
      "function buildPatchTripSettingsRequest",
      "function applyTripSettingsToTrip",
      "function mergePatchedTripSettings",
      "function normalizeTripPlanSummary",
      "function planStatusForLegacyKind",
      "function legacyKindForPlanStatus",
      "function daysBetweenIsoDates",
      "function shiftIsoDate",
      "function itineraryDateTime",
      "function buildItineraryItemDraft",
      "function buildUpdatedItineraryItem",
      "function appendItineraryItemToTrip",
      "function appendItineraryItemPlacement",
      "function mergeCreatedItineraryItemIntoTrip",
      "function mergeUpdatedItineraryBranchIntoTrip",
      "function shiftItineraryItemsToStartDate",
      "function buildInlineItineraryItemPatch",
      "function buildInlineItineraryItemPatchRequest",
      "function buildCreateItineraryItemRequest",
      "function buildPatchItineraryItemRequest",
      "function buildMoveItineraryItemRequest",
      "function buildMoveItineraryItemToDayRequest",
      "function buildReorderItineraryItemsRequest",
      "function buildShiftItineraryItemDayRequest",
      "function normalizeInlineTimePatch",
      "function createLocalBookingDoc",
      "function replaceBookingDocInTrip",
      "function updateLocalBookingDocInTrip",
      "function removeBookingDocFromTrip",
      "function normalizeBookingDocTitle",
      "function resolveBookingDocCreateTripPlanId",
      "function bookingDocQuickFieldsInputFromRecord",
      "function serializeBookingDocInputForApi",
      "function normalizeBookingDocDateTimeForApi",
      "function bookingTypeForItineraryItem",
      "function syncItineraryDetailsWithBookingTicket",
      "function clearItineraryBookingTicketDetails",
      "function findDuplicateBookingDoc",
      "function buildCreateBookingDocRequest",
      "function buildPatchBookingDocRequest",
      "function bookingDraftTitleForItineraryItem",
      "function bookingTypeForExpenseEstimate",
      "function bookingDocInputForExpenseEstimate",
      "function bookingDraftDetailsForItineraryItem",
      "function bookingDraftTimeWindowForItineraryItem",
      "function createLocalPhotoAlbum",
      "function buildCreatePhotoAlbumRequest",
      "function buildPatchPhotoAlbumRequest",
      "function appendPhotoAlbumToTrip",
      "function replacePhotoAlbumInTrip",
      "function updateLocalPhotoAlbum",
      "function updateLocalPhotoAlbumInTrip",
      "function removePhotoAlbumFromTrip",
      'from "@/src/trip/photo-albums"',
      "async function createPhotoAlbum",
      "async function updatePhotoAlbum",
      "async function deletePhotoAlbum",
      "function buildExpenseCreateDrafts",
      "function buildCreateExpenseRequest",
      "function buildPatchExpenseRequest",
      "function appendExpensesToTrip",
      "function appendLocalExpensesToTrip",
      "function buildExpenseUpdateDraft",
      "function replaceExpenseInTrip",
      "function updateLocalExpenseInTrip",
      "function removeExpenseFromTrip",
      "function expenseReminderRequestForSuggestion",
      "function buildExpenseReminderRequest",
      "function recordLocalExpenseReminderInTrip",
      "function createLocalStopNote",
      "function buildCreateStopNoteRequest",
      "function buildPatchStopNoteRequest",
      "function appendStopNote",
      "function createLocalStopNoteInList",
      "function replaceStopNote",
      "function updateLocalStopNote",
      "function removeStopNote",
      "function deleteLocalStopNote",
      "function buildTaskCreateDraft",
      "function buildCreateTaskRequest",
      "function createLocalTask",
      "function appendTask",
      "function createLocalTaskInList",
      "function replaceTask",
      "function toggledTaskStatus",
      "function buildToggleTaskStatusRequest",
      "function toggleLocalTaskStatus",
      "function TripAccessLoadingFrame",
      "function WorkspaceToast",
      "Role preview",
      "WorkspaceRolePreview",
      "workspaceToastDismissClassName",
      "portalLoadingCardClassName",
      "function buildMapLink",
      "function buildMapPlaceResolutionRequest",
      "function mapResolutionPlaceHint",
      "function mapResolutionActivity",
      "function resolveStopPlace",
      "function locationFieldsFromCandidate",
      "function readItineraryDetailString",
      "function normalizeExpenseRepeatCount",
      "function repeatExpenseLineItems",
      "function buildImportItineraryRequest",
      "function resolveCreatedImportId",
      "function serializePhotoAlbumInputForApi",
      "function deriveTripCountriesFromDestination",
      "async function patchApiItineraryBranchItems",
      "function buildItineraryCommitmentsByItemId",
      "function selectedItineraryPathIdForDay",
      "function updateItineraryPathSelection",
      "function itineraryItemPathFieldsForTarget",
      "function getNextSortOrder",
      "function getNextChildSortOrder",
      "function normalizeStopHierarchyValues",
      "function replaceItineraryItem",
      "function replaceItineraryItems",
      "function deleteItineraryItemFromTrip",
      "function moveTripItem",
      "function moveTripItemToDay",
      "function moveTripItemIntoPlanBlock",
      "function hasDescendantItem",
      "function isUnauthenticated",
      "function isForbidden",
      "function isAuthFailure",
      "function slugifyFilePart",
      "function replaceSuggestionById",
      "function resolveJoinPostAuthReturnTo",
      'from "@/src/components/OverviewPage"',
      'from "@/src/components/TimelineView"',
    ]);
    expect(sagaCore).toContain("WorkspaceMainShell");
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
    expect(sagaCore).toContain("useWorkspaceMemberContext");
    expect(sagaCore).not.toContain("findSessionMember");
    expect(sagaCore).not.toContain("isLocalParticipantSession");
    expect(memberContextHook).toContain("findSessionMember");
    expect(memberContextHook).toContain("isLocalParticipantSession");
    expect(sagaCore).toContain("useWorkspaceBackendExpenseSummary");
    expect(sagaCore).not.toContain("useBackendExpenseSummary");
    expect(sagaCore).not.toContain("workspaceViewShouldSyncBackendExpenseSummary");
    expect(backendExpenseSummaryHook).toContain("useBackendExpenseSummary");
    expect(backendExpenseSummaryHook).toContain("workspaceViewShouldSyncBackendExpenseSummary");
    expect(backendExpenseSummaryHook).toContain("clearParticipantSession");
    expect(sagaCore).toContain("useWorkspaceItineraryViewModel");
    expect(sagaCore).not.toContain("buildItineraryView");
    expect(sagaCore).not.toContain("resolveSelectedWorkspaceItem");
    expect(itineraryViewModelHook).toContain("buildItineraryView");
    expect(itineraryViewModelHook).toContain("resolveSelectedWorkspaceItem");
    expect(sagaCore).toContain("useWorkspaceSelectedTripPlanState");
    expect(sagaCore).toContain("useWorkspaceSelectedTripPlanSync");
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
    expect(sagaCore).toContain("WorkspaceAccessBoundary");
    expect(sagaCore).not.toContain("TripAccessLoadingFrame");
    expect(sagaCore).not.toContain("TripWorkspaceAccessPanel");
    expect(sagittariusAccessGate).toContain("export function WorkspaceAccessBoundary");
    expect(sagittariusAccessGate).toContain("TripAccessLoadingFrame");
    expect(sagittariusAccessGate).toContain("TripWorkspaceAccessPanel");
    expect(sagaCore).not.toContain("./WorkspaceDialogs");
    expect(workspaceMainShell).toContain("./WorkspaceDialogs");
    expect(workspaceDialogs).toContain("@/src/trip/workspace/TripWorkspaceDeleteDialog");
    expect(workspaceDialogs).toContain("@/src/trip/workspace/TripWorkspaceImportDialog");
    expect(bookingDisplay).toContain("export function formatDateTime");
    expect(bookingDisplay).toContain("export function bookingTypeIcon");
    expect(bookingDisplay).not.toContain("function toDateTimeLocalValue");
    expect(bookingDisplay).not.toContain("function fromDateTimeLocalValue");
    expect(bookingDisplay).not.toContain("function toggleId");
    expect(bookingDisplay).not.toContain("bookingFolders");
    expect(bookingDisplay).not.toContain("bookingDocMatchesQuery");
    expect(bookingDisplay).not.toContain("compareBookingStartWithUndated");
    expect(bookingFolders).toContain("export const bookingFolders");
    expect(bookingFolders).toContain("export function countBookingFolders");
    expect(bookingList).toContain("export function bookingDocMatchesQuery");
    expect(bookingList).toContain("export function compareBookingStartWithUndated");
    expect(bookingDialog).toContain("./useBookingDialogState");
    expect(bookingDialog).not.toContain("useState");
    expect(bookingDialog).not.toContain("@/src/features/itinerary/lib/itinerary-time");
    expect(bookingDialog).not.toContain("@/src/features/itinerary/lib/itinerary-item-helpers");
    expect(bookingDialogState).toContain("export function useBookingDialogState");
    expect(bookingDialogState).toContain("@/src/features/itinerary/lib/itinerary-time");
    expect(bookingDialogState).toContain("@/src/features/itinerary/lib/itinerary-item-helpers");
    expect(bookingDialogState).toContain("function submit");
    const itineraryStoryFixtures = readFileSync(
      join(frontendRoot, "src/features/itinerary/stories/itinerary-story-fixtures.ts"),
      "utf8",
    );
    const itineraryStoryPathScenarios = readFileSync(
      join(frontendRoot, "src/features/itinerary/stories/itinerary-story-path-scenarios.ts"),
      "utf8",
    );
    const itineraryPageStory = readFileSync(
      join(frontendRoot, "src/features/itinerary/stories/ItineraryPage.stories.tsx"),
      "utf8",
    );
    const itineraryTemplateStory = readFileSync(
      join(frontendRoot, "src/features/itinerary/stories/ItineraryTemplate.stories.tsx"),
      "utf8",
    );
    expect(itineraryStoryFixtures).toContain("./itinerary-story-path-scenarios");
    expect(itineraryStoryFixtures).not.toContain("buildItineraryStoryPathItems");
    expect(itineraryStoryFixtures).not.toContain("const stressPathItemsBase");
    expect(itineraryStoryPathScenarios).toContain("buildItineraryStoryPathItems");
    expect(itineraryStoryPathScenarios).toContain("export const stressPathItemsBase");
    expect(itineraryPageStory).toContain("./itinerary-story-assertions");
    expect(itineraryTemplateStory).toContain("./itinerary-story-assertions");
    expect(itineraryTimeLib).toContain("@/src/trip/itinerary-time");
    expect(itineraryTimeLib).not.toContain("/^(\\d{2}):(\\d{2})$/");
    expect(overviewPage).toContain("OverviewCockpit");
    expect(overviewPage).not.toContain("overviewCockpitClassName");
    expect(overviewCockpit).toContain("export function OverviewCockpit");
    expect(overviewCockpit).toContain("overviewCockpitClassName");
    expect(overviewPage).toContain("OverviewTaskDialog");
    expect(overviewPage).not.toContain("taskDialogGridClassName");
    expect(overviewTaskDialog).toContain("export function OverviewTaskDialog");
    expect(overviewTaskDialog).toContain("taskDialogGridClassName");
    expect(overviewPage).toContain("OverviewWeatherBriefing");
    expect(overviewPage).not.toContain("WeatherBriefingDrawer");
    expect(overviewWeatherBriefing).toContain("WeatherBriefingDrawer");
    expect(overviewWeatherBriefing).toContain("WeatherForecastStrip");
    expect(routeMapTypes).toContain("export interface MapCoordinateResolutionResult");
    expect(routeMapView).not.toContain("export interface MapCoordinateResolutionResult");
    expect(routeMapView).toContain("useRouteLiveMap");
    expect(routeMapView).not.toContain("maplibre-gl");
    expect(routeMapView).not.toContain("function mountLiveMap");
    expect(routeLiveMapHook).toContain("export function useRouteLiveMap");
    expect(routeLiveMapHook).toContain("maplibre-gl");
    expect(routeLiveMapHook).toContain("function mountLiveMap");
    expect(routeMapView).toContain("RouteMapUnresolvedPanel");
    expect(routeMapView).not.toContain("unresolvedPanelListClassName");
    expect(routeMapUnresolvedPanel).toContain("unresolvedPanelListClassName");
    expect(routeMapUnresolvedPanel).toContain("export function RouteMapUnresolvedPanel");
    expect(routeMapUtils).not.toContain("export type { DayColorStyle");
    expect(stopDialogModel).toContain("applyStopActivityInput");
    expect(stopDialog).not.toContain("parseRouteActivity");
    expect(stopDialog).not.toContain("endOffsetDaysBetweenTimes");
    expect(stopDialogForm).toContain("export function applyStopStartTime");
    expect(stopDialogForm).toContain("export function applyStopActivityInput");
    expect(tripSettingsPageSource).not.toContain("export interface TripSettingsFormValues");
    expect(tripSettingsIndexSource).toContain("./TripSettingsPage.types");
    expect(memberSupport).toContain("@/src/routes/invite-links");
    expect(memberSupport).not.toContain("function buildInviteLink");
    expect(accountAccessPanel).toContain("AccountAccessChrome");
    expect(accountAccessPanel).not.toContain("accountHeroClassName");
    expect(accountAccessPanel).not.toContain("accountModeTabsClassName");
    expect(accountAccessPanel).not.toContain("appRoutes.home()");
    expect(accountAccessChrome).toContain("export function AccountAccessChrome");
    expect(accountAccessChrome).toContain("accountHeroClassName");
    expect(accountAccessChrome).toContain("accountModeTabsClassName");
    expect(accountAccessChrome).toContain("appRoutes.home()");
    expect(accountTripWizardSupport).toContain("@/src/routes/invite-links");
    expect(accountTripWizardSupport).toContain("./account-trip-credentials");
    expect(accountTripWizardSupport).toContain("./account-trip-destinations");
    expect(accountTripWizardSupport).toContain("./account-trip-dates");
    expect(accountTripWizardSupport).not.toContain("function buildInviteLink");
    expect(accountTripWizardSupport).not.toContain("function buildInviteEmailHref");
    expect(accountTripWizardSupport).not.toContain("function routeCalendarDays");
    expect(accountTripWizardSupport).not.toContain("function tripNightCount");
    expect(accountTripWizardSupport).not.toContain("const tripCountryOptions");
    expect(accountTripWizardSupport).not.toContain("const tripCityOptions");
    expect(accountTripWizardSupport).not.toContain("function tripDestinationCards");
    expect(accountTripWizardSupport).not.toContain("function destinationRouteCode");
    expect(accountTripWizardSupport).not.toContain("function generateJoinIdForTrip");
    expect(accountTripWizardSupport).not.toContain("function generateJoinPassword");
    expect(accountTripWizardSupport).not.toContain("function randomToken");
    expect(accountTripWizardSupport).toContain("export function applyTripDestinationCities");
    expect(accountTripWizardSupport).toContain("export function applyTripCalendarDate");
    expect(portalTripWizardModel).toContain("applyTripDestinationCities");
    expect(portalTripWizardModel).toContain("applyTripCalendarDate");
    expect(portalTripWizard).toContain("PortalTripWizardActions");
    expect(portalTripWizard).not.toContain("Date.parse(`${date}T00:00:00`)");
    expect(portalTripWizard).not.toContain("appRoutes.portalMyTrips()");
    expect(portalTripWizard).not.toContain("tripWizardActionsClassName");
    expect(portalTripWizardActions).toContain("export function PortalTripWizardActions");
    expect(portalTripWizardActions).toContain("appRoutes.portalMyTrips()");
    expect(portalTripWizardActions).toContain("tripWizardActionsClassName");
    const accountSettingsEditor = readFileSync(
      join(frontendRoot, "src/features/account/components/account-access-panel/portal/account-settings-editor.tsx"),
      "utf8",
    );
    const accountSettingsEditorState = readFileSync(
      join(frontendRoot, "src/features/account/components/account-access-panel/portal/use-account-settings-editor-state.ts"),
      "utf8",
    );
    expect(accountSettingsEditor).toContain("useAccountSettingsEditorState");
    expect(accountSettingsEditor).not.toContain("profileToForm");
    expect(accountSettingsEditor).not.toContain("function submitSettings");
    expect(accountSettingsEditorState).toContain("export function useAccountSettingsEditorState");
    expect(accountSettingsEditorState).toContain("profileToForm");
    expect(accountSettingsEditorState).toContain("function submitSettings");
    expect(accountAuthSupport).toContain("./account-access-error-codes");
    expect(accountAuthSupport).toContain("./account-passkey-support");
    expect(accountAuthSupport).toContain("buildPasskeyLoginFinishInput");
    expect(accountAuthSupport).not.toContain("accountLoadFailed:");
    expect(accountAuthSupport).not.toContain("function createPasskeyCredential");
    expect(accountAuthSupport).not.toContain("function getPasskeyCredential");
    expect(accountAuthSupport).not.toContain("function base64UrlToArrayBuffer");
    expect(accountAuthSupport).not.toContain("function arrayBufferToBase64Url");
    const emailLoginState = readFileSync(
      join(frontendRoot, "src/features/account/components/account-access-panel/email-login/use-email-login-panel-state.ts"),
      "utf8",
    );
    expect(emailLoginState).toContain("buildPasskeyLoginFinishInput");
    expect(emailLoginState).not.toContain("arrayBufferToBase64Url");
    expect(emailLoginStepContent).toContain("./account-email-login-credentials-step");
    expect(emailLoginStepContent).toContain("./account-email-login-methods-step");
    expect(emailLoginStepContent).toContain("./account-email-login-otp-step");
    expect(emailLoginStepContent).toContain("./account-email-login-password-step");
    expect(emailLoginStepContent).toContain("./account-email-login-setup-step");
    expect(emailLoginStepContent).not.toContain("interface EmailLoginCredentialsStepProps");
    expect(emailLoginStepContent).not.toContain("function EmailLoginCredentialsStep");
    const emailLoginPanel = readFileSync(
      join(frontendRoot, "src/features/account/components/account-access-panel/email-login/account-email-login-panel.tsx"),
      "utf8",
    );
    const emailLoginStepStage = readFileSync(
      join(frontendRoot, "src/features/account/components/account-access-panel/email-login/account-email-login-step-stage.tsx"),
      "utf8",
    );
    expect(emailLoginPanel).toContain("EmailLoginStepStage");
    expect(emailLoginPanel).not.toContain("EmailLoginCredentialsStep");
    expect(emailLoginStepStage).toContain("export function EmailLoginStepStage");
    expect(emailLoginStepStage).toContain("EmailLoginCredentialsStep");
    expect(emailLoginStepContent).not.toContain("function EmailLoginOtpStep");
    expect(emailLoginStepContent).not.toContain("function EmailLoginPasswordStep");
    expect(dateTimePickers).toContain("./DatePickerField");
    expect(dateTimePickers).toContain("./DateTimePickerField");
    expect(dateTimePickers).toContain("./TimePickerField");
    expect(dateTimePickers).not.toContain("function CalendarContent");
    expect(dateTimePickers).not.toContain("function TimePickerContent");
    expect(dateTimePickers).not.toContain("createPortal");
    expect(tripJoinGate).toContain("./trip-join-gate.support");
    expect(tripJoinGate).toContain("TripJoinGateChrome");
    expect(tripJoinGate).not.toContain("TripJoinGateVisual");
    expect(tripJoinGate).toContain("TripJoinRoomForm");
    expect(tripJoinGate).toContain("TripJoinParticipantStep");
    expect(tripJoinGate).not.toContain("joinFormClassName");
    expect(tripJoinGate).not.toContain("participantGridClassName");
    expect(tripJoinGate).not.toContain("joinHeroClassName");
    expect(tripJoinGate).not.toContain("tripAccessRightColumnClassName");
    expect(tripJoinGateChrome).toContain("export function TripJoinGateChrome");
    expect(tripJoinGateChrome).toContain("TripJoinGateVisual");
    expect(tripJoinGateChrome).toContain("joinHeroClassName");
    expect(tripJoinGateChrome).toContain("tripAccessRightColumnClassName");
    expect(tripJoinRoomForm).toContain("export function TripJoinRoomForm");
    expect(tripJoinRoomForm).toContain("joinFormClassName");
    expect(tripJoinParticipantStep).toContain("export function TripJoinParticipantStep");
    expect(tripJoinParticipantStep).toContain("participantGridClassName");
    expect(tripJoinGate).not.toContain("tripAccessPhotoKrabiClassName");
    expect(tripJoinGateVisual).toContain("export function TripJoinGateVisual");
    expect(tripJoinGateVisual).toContain("tripAccessPhotoKrabiClassName");
    expect(tripJoinGateStyles).toContain("tripAccessRightColumnClassName");
    expect(tripJoinGate).not.toContain("function tripFromJoinResponse");
    expect(tripJoinGate).not.toContain("function friendlyErrorText");
    expect(tripJoinGate).not.toContain("assertMainPlanPointerAliasesMatch");
    expect(tripWizardFormSections).toContain("./portal-trip-wizard-invite-review");
    expect(tripWizardFormSections).toContain("./portal-trip-wizard-dates-step");
    expect(tripWizardFormSections).toContain("./portal-trip-wizard-destination-step");
    expect(tripWizardFormSections).not.toContain("interface TripWizardDestinationStepProps");
    expect(tripWizardFormSections).not.toContain("interface TripWizardDatesStepProps");
    expect(tripWizardFormSections).not.toContain("function TripWizardInviteStep");
    expect(tripWizardFormSections).not.toContain("function TripWizardReviewSummary");
    expect(sagaCore).toContain("@/src/trip/workspace/selected-trip-plan");
    expect(sagaCore).not.toContain("@/src/trip/workspace/use-backend-expense-summary");
    expect(backendExpenseSummaryHook).toContain("@/src/trip/workspace/use-backend-expense-summary");
    expect(sagaCore).toContain("@/src/trip/workspace/use-daily-briefings");
    expect(sagaCore).toContain("@/src/trip/workspace/use-itinerary-path-workspace");
    expect(sagaCore).toContain("@/src/trip/workspace/use-trip-workspace-records");
    expect(sagaCore).toContain("useWorkspacePhotoAlbums");
    expect(sagaCore).toContain("useWorkspaceRecords");
    expect(sagaCore).toContain("useWorkspaceAdministration");
    expect(sagaCore).toContain("useWorkspaceBookingCommands");
    expect(sagaCore).toContain("useWorkspaceItineraryCommands");
    expect(sagaCore).toContain("useWorkspaceItineraryImport");
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
    expect(sagaCore).toContain("@/src/trip/workspace/use-workspace-navigation");
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

    const tripSettingsPage = readFileSync(join(frontendRoot, "src/features/workspace/pages/trip-settings/TripSettingsPage.tsx"), "utf8");
    const tripSettingsSupport = readFileSync(join(frontendRoot, "src/features/workspace/pages/trip-settings/TripSettingsPage.support.ts"), "utf8");
    const tripSettingsFormState = readFileSync(join(frontendRoot, "src/features/workspace/pages/trip-settings/use-trip-settings-form-state.ts"), "utf8");
    expect(tripSettingsPage).toContain("./TripSettingsPage.support");
    expect(tripSettingsPage).toContain("./use-trip-settings-form-state");
    expect(tripSettingsSupport).toContain("@/src/trip/itinerary-time");
    expect(tripSettingsPage).not.toContain("function daysBetweenIsoDates");
    expect(tripSettingsPage).not.toContain("function shiftIsoDate");
    expect(tripSettingsPage).not.toContain("useState");
    expect(tripSettingsPage).not.toContain("normalizeTripSettingsForm");
    expect(tripSettingsSupport).not.toContain("function daysBetweenIsoDates");
    expect(tripSettingsSupport).not.toContain("function shiftIsoDate");
    expect(tripSettingsFormState).toContain("useTripSettingsFormState");
    expect(tripSettingsFormState).toContain("normalizeTripSettingsForm");
  });
});
