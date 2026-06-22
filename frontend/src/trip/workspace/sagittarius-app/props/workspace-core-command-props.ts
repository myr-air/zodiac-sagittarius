import type {
  useWorkspaceCommands,
  useWorkspacePlanningContext,
  useWorkspaceSetupContext,
} from "../hooks";
import type { BuildWorkspaceFramePropsInput } from "./workspace-frame-props";

type WorkspaceSetupContext = ReturnType<typeof useWorkspaceSetupContext>;
type WorkspacePlanningContext = ReturnType<typeof useWorkspacePlanningContext>;
type WorkspaceCommands = ReturnType<typeof useWorkspaceCommands>;

type WorkspaceCoreCommandProps = Pick<
  BuildWorkspaceFramePropsInput,
  | "applyPendingItineraryImport"
  | "authenticateParticipant"
  | "changeBookingDocQuickFields"
  | "changeBookingDocType"
  | "claimCurrentMemberToAccount"
  | "clearPendingItineraryImport"
  | "createBookingDoc"
  | "createExpense"
  | "createItineraryNote"
  | "createStop"
  | "createStopNote"
  | "deleteExpense"
  | "deleteSelectedStop"
  | "deleteStop"
  | "deleteStopNote"
  | "dismissWorkspaceToast"
  | "editItem"
  | "importItineraryError"
  | "leaveParticipantSession"
  | "navigateWorkspaceView"
  | "onAccountSessionChange"
  | "onAddBookingForItem"
  | "onAddStop"
  | "onAddSubActivity"
  | "onChangeDayPath"
  | "onChangeMemberAccessStatus"
  | "onChangeMemberPassword"
  | "onChangeMemberRole"
  | "onChangeTripPlan"
  | "onChangeTripPlanStatus"
  | "onClearDayPath"
  | "onCockpitLoaded"
  | "onCreateExpense"
  | "onCreateMember"
  | "onCreatePhotoAlbum"
  | "onCreateTask"
  | "onCreateTripPlan"
  | "onDeleteBookingDoc"
  | "onDeleteExpense"
  | "onDeleteItem"
  | "onDeletePhotoAlbum"
  | "onDuplicateExpenseAsEstimate"
  | "onEditItem"
  | "onMoveItemToPath"
  | "onOpenExpenses"
  | "onOpenItemDetails"
  | "onRecordPaybackReminder"
  | "onRenameTripPlan"
  | "onResetMemberClaim"
  | "onSaveDailyBriefingOverrides"
  | "onSaveItineraryBookingTicket"
  | "onSaveTripSettings"
  | "onSelectItem"
  | "onSetMainTripPlan"
  | "onToggleContextRail"
  | "onToggleShowAllPaths"
  | "onToggleTaskStatus"
  | "onUnlinkBookingForItem"
  | "onUpdateBookingDoc"
  | "onUpdateExpense"
  | "onUpdateItemInline"
  | "onUpdatePhotoAlbum"
  | "pendingItineraryImport"
  | "promoteFoodRecommendation"
  | "replaceTripFromJoin"
  | "resolveMissingMapCoordinates"
  | "reviewSuggestion"
  | "rotateJoinInviteToken"
  | "saveDailyBriefingOverrides"
  | "setContextRailVisibility"
  | "setCurrentMemberId"
  | "setDialogDeleteItem"
  | "setDialogState"
  | "setStopPlaceResolution"
  | "suggestSelectedStop"
  | "transferOwnerToAccountMember"
  | "toggleContextRailCollapsed"
  | "toggleTaskStatus"
  | "updateExpense"
  | "updateSelectedStop"
  | "updateStopNote"
>;

export function buildWorkspaceCoreCommandProps({
  commands,
  planning,
  setup,
}: {
  commands: WorkspaceCommands;
  planning: WorkspacePlanningContext;
  setup: WorkspaceSetupContext;
}): WorkspaceCoreCommandProps {
  return {
    applyPendingItineraryImport: commands.applyPendingItineraryImport,
    authenticateParticipant: commands.authenticateParticipant,
    changeBookingDocQuickFields: commands.changeBookingDocQuickFields,
    changeBookingDocType: commands.changeBookingDocType,
    claimCurrentMemberToAccount: commands.claimCurrentMemberToAccount,
    clearPendingItineraryImport: commands.clearPendingItineraryImport,
    createBookingDoc: commands.createBookingDoc,
    createExpense: commands.createExpense,
    createItineraryNote: planning.createItineraryNote,
    createStop: commands.createStop,
    createStopNote: planning.createStopNote,
    deleteExpense: commands.deleteExpense,
    deleteSelectedStop: commands.deleteSelectedStop,
    deleteStop: commands.deleteStop,
    deleteStopNote: planning.deleteStopNote,
    dismissWorkspaceToast: setup.dismissWorkspaceToast,
    editItem: commands.editItem,
    importItineraryError: commands.importItineraryError,
    leaveParticipantSession: commands.leaveParticipantSession,
    navigateWorkspaceView: setup.navigateWorkspaceView,
    onAccountSessionChange: setup.changeAccountSession,
    onAddBookingForItem: commands.createItineraryBookingDraft,
    onAddStop: commands.addStop,
    onAddSubActivity: commands.addSubActivity,
    onChangeDayPath: setup.changeDayPath,
    onChangeMemberAccessStatus: commands.changeMemberAccessStatus,
    onChangeMemberPassword: commands.changeMemberPassword,
    onChangeMemberRole: commands.changeMemberRole,
    onChangeTripPlan: planning.selectTripPlan,
    onChangeTripPlanStatus: planning.updateTripPlanStatus,
    onClearDayPath: setup.clearDayPath,
    onCockpitLoaded: planning.replaceCockpitFromApi,
    onCreateExpense: commands.createExpense,
    onCreateMember: commands.createMember,
    onCreatePhotoAlbum: setup.createPhotoAlbum,
    onCreateTask: planning.createTask,
    onCreateTripPlan: planning.createTripPlan,
    onDeleteBookingDoc: commands.deleteBookingDoc,
    onDeleteExpense: commands.deleteExpense,
    onDeleteItem: commands.deleteStop,
    onDeletePhotoAlbum: setup.deletePhotoAlbum,
    onDuplicateExpenseAsEstimate: commands.duplicateExpenseAsEstimate,
    onEditItem: commands.editItem,
    onMoveItemToPath: commands.moveItemToPath,
    onOpenExpenses: setup.openExpensesWorkspace,
    onOpenItemDetails: commands.openItemDetails,
    onRecordPaybackReminder: commands.recordPaybackReminder,
    onRenameTripPlan: planning.renameTripPlan,
    onResetMemberClaim: commands.resetMemberClaim,
    onSaveDailyBriefingOverrides: setup.saveDailyBriefingOverrides,
    onSaveItineraryBookingTicket: commands.saveItineraryBookingTicket,
    onSaveTripSettings: commands.saveTripSettings,
    onSelectItem: commands.selectItem,
    onSetMainTripPlan: planning.setMainTripPlan,
    onToggleContextRail: setup.toggleContextRail,
    onToggleShowAllPaths: setup.toggleShowAllPaths,
    onToggleTaskStatus: planning.toggleTaskStatus,
    onUnlinkBookingForItem: commands.unlinkBookingFromItineraryItem,
    onUpdateBookingDoc: commands.updateBookingDoc,
    onUpdateExpense: commands.updateExpense,
    onUpdateItemInline: commands.updateItineraryItemInline,
    onUpdatePhotoAlbum: setup.updatePhotoAlbum,
    pendingItineraryImport: commands.pendingItineraryImport,
    promoteFoodRecommendation: commands.promoteFoodRecommendation,
    replaceTripFromJoin: commands.replaceTripFromJoin,
    resolveMissingMapCoordinates: commands.resolveMissingMapCoordinates,
    reviewSuggestion: planning.reviewSuggestion,
    rotateJoinInviteToken: commands.rotateJoinInviteToken,
    saveDailyBriefingOverrides: setup.saveDailyBriefingOverrides,
    setContextRailVisibility: setup.setContextRailVisibility,
    setCurrentMemberId: setup.setCurrentMemberId,
    setDialogDeleteItem: setup.setDialogDeleteItem,
    setDialogState: setup.setDialogState,
    setStopPlaceResolution: setup.setStopPlaceResolution,
    suggestSelectedStop: planning.suggestSelectedStop,
    transferOwnerToAccountMember: commands.transferOwnerToAccountMember,
    toggleContextRailCollapsed: setup.toggleSidebarCollapsed,
    toggleTaskStatus: planning.toggleTaskStatus,
    updateExpense: commands.updateExpense,
    updateSelectedStop: commands.updateSelectedStop,
    updateStopNote: planning.updateStopNote,
  };
}
