import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { readWorkspaceBoundarySources } from "./workspace-source-boundaries.sources";

const testDir = dirname(fileURLToPath(import.meta.url));
const frontendRoot = resolve(testDir, "..");

function expectSourceNotToContain(source: string, blockedTerms: string[]) {
  blockedTerms.forEach((term) => expect(source).not.toContain(term));
}

describe("Sagittarius workspace source boundaries", () => {
  it("keeps workspace orchestration split by responsibility", () => {
    const {
      sagaCore,
      sagittariusAccessGate,
      workspaceAppFrame,
      workspaceMainShell,
      workspaceFacade,
      appFacade,
      workspaceRecordsHook,
      importHook,
      accessGateHook,
      uiStateHook,
      accessState,
      participantSessionActions,
      participantPostAuthNavigation,
      workspaceSessionHook,
      workspaceSessionRestore,
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
      selectedTripPlanHook,
      workspaceDialogs,
      bookingDisplay,
      bookingFolders,
      bookingList,
      bookingDialog,
      bookingDialogState,
      itineraryTimeLib,
      overviewPage,
      overviewSummaryBand,
      overviewCockpit,
      overviewTaskDialog,
      overviewTaskLayer,
      overviewWeatherBriefing,
      routeMapTypes,
      smartItineraryTable,
      smartItineraryTablePageHeader,
      routeMapView,
      routeMapUnresolvedPanel,
      routeLiveMapHook,
      routeMapUtils,
      stopDialog,
      stopDialogStory,
      stopDialogStorySupport,
      stopDialogModel,
      stopDialogForm,
      stopDialogTimeFields,
      tripSettingsPageSource,
      tripSettingsIndexSource,
      memberSupport,
      accountAccessPanel,
      accountAccessChrome,
      accountTripWizardSupport,
      portalTripWizard,
      portalTripWizardModel,
      portalTripWizardDerivedState,
      portalTripWizardActions,
      accountAuthSupport,
      emailLoginStepContent,
      dateTimePickers,
      tripJoinGate,
      tripJoinGateChrome,
      tripJoinGateVisual,
      tripJoinRoomForm,
      tripJoinParticipantStep,
      tripJoinGateStyles,
      tripWizardFormSections,
    } = readWorkspaceBoundarySources(frontendRoot);
    expect(workspaceFacade).toContain("./sagittarius-app");
    expect(appFacade).toContain("@/src/trip/workspace/sagittarius-app");
    expect(appFacade).not.toContain('"use client"');
    const sagittariusApp = sagaCore;
    expect(sagittariusApp).toContain("./WorkspaceAppFrame");
    expect(sagittariusApp).not.toContain("./access-gate");
    expect(sagittariusApp).not.toContain("./WorkspaceMainShell");
    expect(workspaceAppFrame).toContain("WorkspaceAccessBoundary");
    expect(workspaceAppFrame).toContain("WorkspaceMainShell");
    expect(workspaceAppFrame).not.toContain("useWorkspaceApiClients");
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
    expect(sagaCore).toContain("useWorkspaceCockpitReplacement");
    expect(sagaCore).not.toContain("normalizeTripPlanAliases");
    expect(cockpitReplacementHook).toContain("export function useWorkspaceCockpitReplacement");
    expect(cockpitReplacementHook).toContain("normalizeTripPlanAliases");
    expect(cockpitReplacementHook).toContain("resetBackendExpenseSummary");
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
    expect(overviewPage).toContain("OverviewSummaryBand");
    expect(overviewPage).not.toContain("OverviewCockpit");
    expect(overviewPage).not.toContain("overviewCockpitClassName");
    expect(overviewSummaryBand).toContain("OverviewCockpit");
    expect(overviewCockpit).toContain("export function OverviewCockpit");
    expect(overviewCockpit).toContain("overviewCockpitClassName");
    expect(overviewPage).toContain("OverviewTaskLayer");
    expect(overviewPage).not.toContain("OverviewTaskDialog");
    expect(overviewPage).not.toContain("overviewUndoToastClassName");
    expect(overviewPage).not.toContain("taskDialogGridClassName");
    expect(overviewTaskLayer).toContain("OverviewTaskDialog");
    expect(overviewTaskLayer).toContain("overviewUndoToastClassName");
    expect(overviewTaskDialog).toContain("export function OverviewTaskDialog");
    expect(overviewTaskDialog).toContain("taskDialogGridClassName");
    expect(overviewPage).not.toContain("OverviewWeatherBriefing");
    expect(overviewSummaryBand).toContain("OverviewWeatherBriefing");
    expect(overviewPage).not.toContain("WeatherBriefingDrawer");
    expect(overviewWeatherBriefing).toContain("WeatherBriefingDrawer");
    expect(overviewWeatherBriefing).toContain("WeatherForecastStrip");
    expect(smartItineraryTable).toContain("SmartItineraryTablePageHeader");
    expect(smartItineraryTable).not.toContain("@/src/shared/components/page-header");
    expect(smartItineraryTable).not.toContain("SmartItineraryTableHeaderControls");
    expect(smartItineraryTablePageHeader).toContain("PageHeader");
    expect(smartItineraryTablePageHeader).toContain("SmartItineraryTableHeaderControls");
    expect(smartItineraryTablePageHeader).toContain("SmartItineraryTableMeta");
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
    expect(stopDialogStory).toContain("./StopDialog.stories.support");
    expect(stopDialogStory).not.toContain("tripFixture");
    expect(stopDialogStory).not.toContain("function categoryItem");
    expect(stopDialogStorySupport).toContain("export const stopDialogCreateArgs");
    expect(stopDialogStorySupport).toContain("export function stopDialogCategoryItem");
    expect(stopDialogForm).toContain("./stop-dialog-time-fields");
    expect(stopDialogForm).not.toContain("durationBetweenTimes");
    expect(stopDialogForm).toContain("export function applyStopActivityInput");
    expect(stopDialogTimeFields).toContain("export function applyStopStartTime");
    expect(stopDialogTimeFields).toContain("export function applyStopEndTime");
    expect(stopDialogTimeFields).toContain("export function applyStopTimeMode");
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
    const accountAccessStory = readFileSync(
      join(frontendRoot, "src/features/account/components/account-access-panel/AccountAccessPanel.stories.tsx"),
      "utf8",
    );
    const accountAccessStorySupport = readFileSync(
      join(frontendRoot, "src/features/account/components/account-access-panel/account-access-panel.stories.support.ts"),
      "utf8",
    );
    expect(accountAccessStory).toContain("./account-access-panel.stories.support");
    expect(accountAccessStory).not.toContain("AccountApiClient");
    expect(accountAccessStory).not.toContain("const accountSettings");
    expect(accountAccessStorySupport).toContain("export const accountStoryClient");
    expect(accountAccessStorySupport).toContain("export const accountLoginStoryArgs");
    expect(accountAccessStorySupport).toContain("export const portalDashboardStoryArgs");
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
    expect(portalTripWizardModel).toContain("buildPortalTripWizardDerivedState");
    expect(portalTripWizardModel).not.toContain("function tripStepComplete");
    expect(portalTripWizardDerivedState).toContain("export function buildPortalTripWizardDerivedState");
    expect(portalTripWizardDerivedState).toContain("tripStepComplete");
    expect(portalTripWizardDerivedState).toContain("routeCalendarDays");
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
    const emailLoginAuthActions = readFileSync(
      join(frontendRoot, "src/features/account/components/account-access-panel/email-login/email-login-auth-actions.ts"),
      "utf8",
    );
    const emailLoginFormState = readFileSync(
      join(frontendRoot, "src/features/account/components/account-access-panel/email-login/use-email-login-form-state.ts"),
      "utf8",
    );
    const emailLoginSubmitActions = readFileSync(
      join(frontendRoot, "src/features/account/components/account-access-panel/email-login/use-email-login-submit-actions.ts"),
      "utf8",
    );
    const emailLoginResendCooldown = readFileSync(
      join(frontendRoot, "src/features/account/components/account-access-panel/email-login/use-email-login-resend-cooldown.ts"),
      "utf8",
    );
    expect(emailLoginState).toContain("./use-email-login-form-state");
    expect(emailLoginState).toContain("./use-email-login-resend-cooldown");
    expect(emailLoginState).toContain("./use-email-login-submit-actions");
    expect(emailLoginState).not.toContain("./email-login-auth-actions");
    expect(emailLoginState).not.toContain("buildPasskeyLoginFinishInput");
    expect(emailLoginState).not.toContain("finishPasswordLogin({");
    expect(emailLoginState).not.toContain("finishEmailLogin({");
    expect(emailLoginState).not.toContain("finishEmailCodeLogin");
    expect(emailLoginState).not.toContain("finishEmailPasswordLogin");
    expect(emailLoginState).not.toContain("finishEmailRegistrationSetup");
    expect(emailLoginState).not.toContain("signInWithEmailPasskey");
    expect(emailLoginState).not.toContain("window.setInterval");
    expect(emailLoginState).not.toContain("replace(/\\D/g");
    expect(emailLoginAuthActions).toContain("export async function finishEmailCodeLogin");
    expect(emailLoginAuthActions).toContain("export async function finishEmailPasswordLogin");
    expect(emailLoginAuthActions).toContain("export async function signInWithEmailPasskey");
    expect(emailLoginAuthActions).toContain("buildPasskeyLoginFinishInput");
    expect(emailLoginAuthActions).not.toContain("arrayBufferToBase64Url");
    expect(emailLoginFormState).toContain("export function useEmailLoginFormState");
    expect(emailLoginFormState).toContain("function updateCode");
    expect(emailLoginSubmitActions).toContain("export function useEmailLoginSubmitActions");
    expect(emailLoginSubmitActions).toContain("./email-login-auth-actions");
    expect(emailLoginSubmitActions).toContain("finishEmailCodeLogin");
    expect(emailLoginResendCooldown).toContain("export function useEmailLoginResendCooldown");
    expect(emailLoginResendCooldown).toContain("window.setInterval");
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
