import type {
  useWorkspaceCommands,
  useWorkspacePlanningContext,
  useWorkspaceSetupContext,
} from "../hooks";
import type { BuildWorkspaceFramePropsInput } from "./workspace-frame-props";

export type WorkspaceSetupContext = ReturnType<typeof useWorkspaceSetupContext>;
export type WorkspacePlanningContext = ReturnType<typeof useWorkspacePlanningContext>;
export type WorkspaceCommands = ReturnType<typeof useWorkspaceCommands>;

export type WorkspaceCoreSetupCommandProps = Pick<
  BuildWorkspaceFramePropsInput,
  | "dismissWorkspaceToast"
  | "navigateWorkspaceView"
  | "onAccountSessionChange"
  | "onChangeDayPath"
  | "onClearDayPath"
  | "onCreatePhotoAlbum"
  | "onDeletePhotoAlbum"
  | "onOpenExpenses"
  | "onSaveDailyBriefingOverrides"
  | "onToggleContextRail"
  | "onToggleShowAllPaths"
  | "onUpdatePhotoAlbum"
  | "saveDailyBriefingOverrides"
  | "setContextRailVisibility"
  | "setCurrentMemberId"
  | "setDialogDeleteItem"
  | "setDialogState"
  | "setStopPlaceResolution"
  | "toggleContextRailCollapsed"
>;

export type WorkspaceCorePlanningCommandProps = Pick<
  BuildWorkspaceFramePropsInput,
  | "createItineraryNote"
  | "createStopNote"
  | "deleteStopNote"
  | "onChangeTripPlan"
  | "onChangeTripPlanStatus"
  | "onCockpitLoaded"
  | "onCreateTask"
  | "onCreateTripPlan"
  | "onRenameTripPlan"
  | "onSetMainTripPlan"
  | "onToggleTaskStatus"
  | "reviewSuggestion"
  | "suggestSelectedStop"
  | "toggleTaskStatus"
  | "updateStopNote"
>;

export type WorkspaceCoreAppCommandProps = Pick<
  BuildWorkspaceFramePropsInput,
  | "applyPendingItineraryImport"
  | "authenticateParticipant"
  | "changeBookingDocQuickFields"
  | "changeBookingDocType"
  | "claimCurrentMemberToAccount"
  | "clearPendingItineraryImport"
  | "createBookingDoc"
  | "createExpense"
  | "createStop"
  | "deleteExpense"
  | "deleteSelectedStop"
  | "deleteStop"
  | "editItem"
  | "importItineraryError"
  | "leaveParticipantSession"
  | "onAddBookingForItem"
  | "onAddStop"
  | "onAddSubActivity"
  | "onChangeMemberAccessStatus"
  | "onChangeMemberPassword"
  | "onChangeMemberRole"
  | "onCreateExpense"
  | "onCreateMember"
  | "onDeleteBookingDoc"
  | "onDeleteExpense"
  | "onDeleteItem"
  | "onDuplicateExpenseAsEstimate"
  | "onEditItem"
  | "onMoveItemToPath"
  | "onOpenItemDetails"
  | "onRecordPaybackReminder"
  | "onResetMemberClaim"
  | "onSaveItineraryBookingTicket"
  | "onSaveTripSettings"
  | "onSelectItem"
  | "onUnlinkBookingForItem"
  | "onUpdateBookingDoc"
  | "onUpdateExpense"
  | "onUpdateItemInline"
  | "pendingItineraryImport"
  | "promoteFoodRecommendation"
  | "replaceTripFromJoin"
  | "resolveMissingMapCoordinates"
  | "rotateJoinInviteToken"
  | "transferOwnerToAccountMember"
  | "updateExpense"
  | "updateSelectedStop"
>;

export type WorkspaceCoreCommandProps =
  WorkspaceCoreSetupCommandProps &
  WorkspaceCorePlanningCommandProps &
  WorkspaceCoreAppCommandProps;
