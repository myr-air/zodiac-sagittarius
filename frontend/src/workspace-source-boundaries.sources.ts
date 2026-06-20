import { readFileSync } from "node:fs";
import { join } from "node:path";

export function readWorkspaceBoundarySources(frontendRoot: string) {
  const sagaCore = readFileSync(
    join(frontendRoot, "src/trip/workspace/sagittarius-app/SagittariusAppCore.tsx"),
    "utf8",
  );
  const sagittariusAccessGate = readFileSync(
    join(frontendRoot, "src/trip/workspace/sagittarius-app/access-gate.tsx"),
    "utf8",
  );
  const workspaceAppFrame = readFileSync(
    join(frontendRoot, "src/trip/workspace/sagittarius-app/WorkspaceAppFrame.tsx"),
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
  const cockpitReplacementHook = readFileSync(
    join(frontendRoot, "src/trip/workspace/sagittarius-app/hooks/use-workspace-cockpit-replacement.ts"),
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
  const overviewSummaryBand = readFileSync(
    join(frontendRoot, "src/features/itinerary/components/overview/OverviewSummaryBand.tsx"),
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
  const overviewTaskLayer = readFileSync(
    join(frontendRoot, "src/features/itinerary/components/overview/OverviewTaskLayer.tsx"),
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
  const smartItineraryTable = readFileSync(
    join(frontendRoot, "src/features/itinerary/components/smart-itinerary-table/SmartItineraryTable.tsx"),
    "utf8",
  );
  const smartItineraryTablePageHeader = readFileSync(
    join(frontendRoot, "src/features/itinerary/components/smart-itinerary-table/SmartItineraryTablePageHeader.tsx"),
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
  const stopDialogStory = readFileSync(
    join(frontendRoot, "src/features/itinerary/stories/StopDialog.stories.tsx"),
    "utf8",
  );
  const stopDialogStorySupport = readFileSync(
    join(frontendRoot, "src/features/itinerary/stories/StopDialog.stories.support.ts"),
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
  const stopDialogTimeFields = readFileSync(
    join(frontendRoot, "src/features/itinerary/components/stop-dialog/stop-dialog-time-fields.ts"),
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
  const portalTripWizardDerivedState = readFileSync(
    join(frontendRoot, "src/features/account/components/account-access-panel/trip-wizard/portal-trip-wizard-derived-state.ts"),
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
  const accountAccessStory = readFileSync(
    join(frontendRoot, "src/features/account/components/account-access-panel/AccountAccessPanel.stories.tsx"),
    "utf8",
  );
  const accountAccessStorySupport = readFileSync(
    join(frontendRoot, "src/features/account/components/account-access-panel/account-access-panel.stories.support.ts"),
    "utf8",
  );
  const accountSettingsEditor = readFileSync(
    join(frontendRoot, "src/features/account/components/account-access-panel/portal/account-settings-editor.tsx"),
    "utf8",
  );
  const accountSettingsEditorState = readFileSync(
    join(frontendRoot, "src/features/account/components/account-access-panel/portal/use-account-settings-editor-state.ts"),
    "utf8",
  );
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
  const emailLoginPanel = readFileSync(
    join(frontendRoot, "src/features/account/components/account-access-panel/email-login/account-email-login-panel.tsx"),
    "utf8",
  );
  const emailLoginStepStage = readFileSync(
    join(frontendRoot, "src/features/account/components/account-access-panel/email-login/account-email-login-step-stage.tsx"),
    "utf8",
  );
  const tripSettingsPage = readFileSync(join(frontendRoot, "src/features/workspace/pages/trip-settings/TripSettingsPage.tsx"), "utf8");
  const tripSettingsSupport = readFileSync(join(frontendRoot, "src/features/workspace/pages/trip-settings/TripSettingsPage.support.ts"), "utf8");
  const tripSettingsFormState = readFileSync(join(frontendRoot, "src/features/workspace/pages/trip-settings/use-trip-settings-form-state.ts"), "utf8");


  return {
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
    itineraryStoryFixtures,
    itineraryStoryPathScenarios,
    itineraryPageStory,
    itineraryTemplateStory,
    accountAccessStory,
    accountAccessStorySupport,
    accountSettingsEditor,
    accountSettingsEditorState,
    emailLoginState,
    emailLoginAuthActions,
    emailLoginFormState,
    emailLoginSubmitActions,
    emailLoginResendCooldown,
    emailLoginPanel,
    emailLoginStepStage,
    tripSettingsPage,
    tripSettingsSupport,
    tripSettingsFormState,
  };
}
