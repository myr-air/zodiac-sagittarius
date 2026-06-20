import type {
  BuildWorkspaceShellPropsInput,
  WorkspaceShellProps,
} from "./workspace-shell-props";

type BuildWorkspaceRailPropsInput = Pick<
  BuildWorkspaceShellPropsInput,
  | "canCreateStopNote"
  | "canCreateSuggestion"
  | "canEdit"
  | "canEditExpenses"
  | "canReviewSuggestions"
  | "changeBookingDocQuickFields"
  | "changeBookingDocType"
  | "contextRailMounted"
  | "contextRailOpen"
  | "contextRailPreferredTab"
  | "createExpense"
  | "createStopNote"
  | "currentMember"
  | "deleteExpense"
  | "deleteStopNote"
  | "editSelectedItem"
  | "expenseSummary"
  | "reviewSuggestion"
  | "scopedSuggestions"
  | "scopedTripForRecords"
  | "scopedTripPlanRecords"
  | "selectedItem"
  | "setContextRailVisibility"
  | "suggestSelectedStop"
  | "supportsContextRail"
  | "toggleTaskStatus"
  | "updateExpense"
  | "updateStopNote"
>;

export function buildWorkspaceRailProps({
  canCreateStopNote,
  canCreateSuggestion,
  canEdit,
  canEditExpenses,
  canReviewSuggestions,
  changeBookingDocQuickFields,
  changeBookingDocType,
  contextRailMounted,
  contextRailOpen,
  contextRailPreferredTab,
  createExpense,
  createStopNote,
  currentMember,
  deleteExpense,
  deleteStopNote,
  editSelectedItem,
  expenseSummary,
  reviewSuggestion,
  scopedSuggestions,
  scopedTripForRecords,
  scopedTripPlanRecords,
  selectedItem,
  setContextRailVisibility,
  suggestSelectedStop,
  supportsContextRail,
  toggleTaskStatus,
  updateExpense,
  updateStopNote,
}: BuildWorkspaceRailPropsInput): WorkspaceShellProps["railProps"] {
  return {
    enabled: supportsContextRail,
    mounted: contextRailMounted,
    railProps: {
      trip: scopedTripForRecords,
      selectedItem,
      suggestions: scopedSuggestions,
      stopNotes: scopedTripPlanRecords.stopNotes,
      tasks: scopedTripPlanRecords.tasks,
      bookingDocs: scopedTripPlanRecords.bookingDocs,
      currentMember,
      expenseSummary,
      canEdit,
      canCreateNote: canCreateStopNote,
      canCreateSuggestion,
      canReviewSuggestions,
      canEditExpenses,
      open: contextRailOpen,
      preferredTab: contextRailPreferredTab,
      onChangeBookingDocType: changeBookingDocType,
      onChangeBookingDocQuickFields: changeBookingDocQuickFields,
      onCreateNote: createStopNote,
      onCreateExpense: createExpense,
      onUpdateExpense: updateExpense,
      onDeleteExpense: deleteExpense,
      onDeleteNote: deleteStopNote,
      onEditSelected: editSelectedItem,
      onReviewSuggestion: reviewSuggestion,
      onSuggestSelected: suggestSelectedStop,
      onToggleTaskStatus: toggleTaskStatus,
      onUpdateNote: updateStopNote,
      onClose: () => setContextRailVisibility(false),
    },
  };
}
