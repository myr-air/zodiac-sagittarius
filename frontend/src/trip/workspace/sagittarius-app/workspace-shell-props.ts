import type { ComponentProps } from "react";
import type { WorkspaceAppFrame } from "./WorkspaceAppFrame";

type WorkspaceShellProps = ComponentProps<typeof WorkspaceAppFrame>["shellProps"];

interface BuildWorkspaceShellPropsInput {
  accountClaimState: WorkspaceShellProps["toastProps"]["claimState"];
  accountSession: WorkspaceShellProps["toastProps"]["accountSession"];
  applyPendingItineraryImport: WorkspaceShellProps["dialogsProps"]["applyPendingItineraryImport"];
  canClaimMember: WorkspaceShellProps["toastProps"]["canClaim"];
  canCreateStopNote: WorkspaceShellProps["railProps"]["railProps"]["canCreateNote"];
  canCreateSuggestion: WorkspaceShellProps["railProps"]["railProps"]["canCreateSuggestion"];
  canEdit: WorkspaceShellProps["railProps"]["railProps"]["canEdit"];
  canEditExpenses: WorkspaceShellProps["railProps"]["railProps"]["canEditExpenses"];
  canReviewSuggestions: WorkspaceShellProps["railProps"]["railProps"]["canReviewSuggestions"];
  changeBookingDocQuickFields: WorkspaceShellProps["railProps"]["railProps"]["onChangeBookingDocQuickFields"];
  changeBookingDocType: WorkspaceShellProps["railProps"]["railProps"]["onChangeBookingDocType"];
  clearPendingItineraryImport: WorkspaceShellProps["dialogsProps"]["clearPendingItineraryImport"];
  contextRailMounted: WorkspaceShellProps["railProps"]["mounted"];
  contextRailOpen: WorkspaceShellProps["frameProps"]["contextRailOpen"];
  contextRailPreferredTab: WorkspaceShellProps["railProps"]["railProps"]["preferredTab"];
  createExpense: WorkspaceShellProps["railProps"]["railProps"]["onCreateExpense"];
  createStop: WorkspaceShellProps["dialogsProps"]["createStop"];
  createStopNote: WorkspaceShellProps["railProps"]["railProps"]["onCreateNote"];
  currentMember: WorkspaceShellProps["appShellProps"]["currentMember"];
  currentView: WorkspaceShellProps["appShellProps"]["activeView"];
  deleteExpense: WorkspaceShellProps["railProps"]["railProps"]["onDeleteExpense"];
  deleteSelectedStop: WorkspaceShellProps["dialogsProps"]["deleteSelectedStop"];
  deleteStop: WorkspaceShellProps["dialogsProps"]["deleteStop"];
  deleteStopNote: WorkspaceShellProps["railProps"]["railProps"]["onDeleteNote"];
  dialogDeleteItem: WorkspaceShellProps["dialogsProps"]["dialogDeleteItem"];
  dialogState: WorkspaceShellProps["dialogsProps"]["dialogState"];
  dismissWorkspaceToast: WorkspaceShellProps["toastProps"]["onDismiss"];
  editSelectedItem: () => void;
  expenseSummary: WorkspaceShellProps["railProps"]["railProps"]["expenseSummary"];
  importItineraryError: WorkspaceShellProps["frameProps"]["importError"];
  isToastDismissing: WorkspaceShellProps["toastProps"]["dismissing"];
  navigateWorkspaceView: WorkspaceShellProps["appShellProps"]["onNavigateView"];
  onClaimMember: WorkspaceShellProps["toastProps"]["onClaim"];
  pathOptions: WorkspaceShellProps["dialogsProps"]["importPathOptions"];
  pendingItineraryImport: WorkspaceShellProps["dialogsProps"]["pendingItineraryImport"];
  promoteFoodRecommendation: WorkspaceShellProps["dialogsProps"]["promoteFoodRecommendation"];
  requireJoin: boolean;
  reviewSuggestion: WorkspaceShellProps["railProps"]["railProps"]["onReviewSuggestion"];
  scopedSuggestions: WorkspaceShellProps["railProps"]["railProps"]["suggestions"];
  scopedTripPlanRecords: Pick<
    WorkspaceShellProps["railProps"]["railProps"],
    "bookingDocs" | "stopNotes" | "tasks"
  >;
  scopedTripForRecords: WorkspaceShellProps["railProps"]["railProps"]["trip"];
  selectedDay: WorkspaceShellProps["dialogsProps"]["selectedDay"];
  selectedItem: WorkspaceShellProps["railProps"]["railProps"]["selectedItem"];
  selectedTripPathId: WorkspaceShellProps["dialogsProps"]["selectedTripPathId"];
  selectedTripPlanId: WorkspaceShellProps["dialogsProps"]["selectedTripPlanId"];
  sessionMember: unknown;
  setContextRailVisibility: (visible: boolean) => void;
  setCurrentMemberId: WorkspaceShellProps["rolePreviewProps"]["onChangeMember"];
  setDialogDeleteItem: WorkspaceShellProps["dialogsProps"]["setDialogDeleteItem"];
  setDialogState: WorkspaceShellProps["dialogsProps"]["setDialogState"];
  setStopPlaceResolution: WorkspaceShellProps["dialogsProps"]["setStopPlaceResolution"];
  sidebarCollapsed: WorkspaceShellProps["appShellProps"]["collapsed"];
  stopPlaceResolution: WorkspaceShellProps["dialogsProps"]["stopPlaceResolution"];
  suggestSelectedStop: WorkspaceShellProps["railProps"]["railProps"]["onSuggestSelected"];
  supportsContextRail: WorkspaceShellProps["railProps"]["enabled"];
  t: {
    itinerary: {
      row: {
        confirmDeleteNo: string;
        confirmDeleteYes: string;
        confirmDeleteTitle: (input: { activity: string }) => string;
        confirmDeleteBody: (input: { activity: string }) => string;
      };
    };
  };
  toastDismissed: boolean;
  toggleContextRailCollapsed: WorkspaceShellProps["appShellProps"]["onToggleCollapsed"];
  toggleTaskStatus: WorkspaceShellProps["railProps"]["railProps"]["onToggleTaskStatus"];
  trip: WorkspaceShellProps["dialogsProps"]["trip"];
  updateExpense: WorkspaceShellProps["railProps"]["railProps"]["onUpdateExpense"];
  updateSelectedStop: WorkspaceShellProps["dialogsProps"]["updateSelectedStop"];
  updateStopNote: WorkspaceShellProps["railProps"]["railProps"]["onUpdateNote"];
  viewsProps: WorkspaceShellProps["viewsProps"];
  onLeaveParticipantSession?: WorkspaceShellProps["appShellProps"]["onLeaveParticipantSession"];
}

export function buildWorkspaceShellProps({
  accountClaimState,
  accountSession,
  applyPendingItineraryImport,
  canClaimMember,
  canCreateStopNote,
  canCreateSuggestion,
  canEdit,
  canEditExpenses,
  canReviewSuggestions,
  changeBookingDocQuickFields,
  changeBookingDocType,
  clearPendingItineraryImport,
  contextRailMounted,
  contextRailOpen,
  contextRailPreferredTab,
  createExpense,
  createStop,
  createStopNote,
  currentMember,
  currentView,
  deleteExpense,
  deleteSelectedStop,
  deleteStop,
  deleteStopNote,
  dialogDeleteItem,
  dialogState,
  dismissWorkspaceToast,
  editSelectedItem,
  expenseSummary,
  importItineraryError,
  isToastDismissing,
  navigateWorkspaceView,
  onClaimMember,
  onLeaveParticipantSession,
  pathOptions,
  pendingItineraryImport,
  promoteFoodRecommendation,
  requireJoin,
  reviewSuggestion,
  scopedSuggestions,
  scopedTripPlanRecords,
  scopedTripForRecords,
  selectedDay,
  selectedItem,
  selectedTripPathId,
  selectedTripPlanId,
  sessionMember,
  setContextRailVisibility,
  setCurrentMemberId,
  setDialogDeleteItem,
  setDialogState,
  setStopPlaceResolution,
  sidebarCollapsed,
  stopPlaceResolution,
  suggestSelectedStop,
  supportsContextRail,
  t,
  toastDismissed,
  toggleContextRailCollapsed,
  toggleTaskStatus,
  trip,
  updateExpense,
  updateSelectedStop,
  updateStopNote,
  viewsProps,
}: BuildWorkspaceShellPropsInput): WorkspaceShellProps {
  return {
    appShellProps: {
      activeView: currentView,
      collapsed: sidebarCollapsed,
      currentMember,
      onLeaveParticipantSession,
      onNavigateView: navigateWorkspaceView,
      trip,
      onToggleCollapsed: toggleContextRailCollapsed,
    },
    dialogsProps: {
      applyPendingItineraryImport,
      clearPendingItineraryImport,
      createStop,
      currentMemberId: currentMember.id,
      deleteSelectedStop,
      deleteStop,
      dialogDeleteItem,
      dialogState,
      importPathOptions: pathOptions,
      pendingItineraryImport,
      promoteFoodRecommendation,
      selectedDay,
      selectedTripPathId,
      selectedTripPlanId,
      setDialogDeleteItem,
      setDialogState,
      setStopPlaceResolution,
      stopPlaceResolution,
      trip,
      tripPlanOptions: trip.tripPlans ?? trip.planVariants,
      updateSelectedStop,
      deleteCancelLabel: t.itinerary.row.confirmDeleteNo,
      deleteConfirmLabel: t.itinerary.row.confirmDeleteYes,
      deleteTitleForActivity: (activity) =>
        t.itinerary.row.confirmDeleteTitle({ activity }),
      deleteBodyForActivity: (activity) =>
        t.itinerary.row.confirmDeleteBody({ activity }),
    },
    frameProps: {
      contextRailOpen,
      importError: importItineraryError,
      supportsContextRail,
    },
    railProps: {
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
    },
    rolePreviewProps: {
      currentMemberId: currentMember.id,
      members: trip.members,
      onChangeMember: setCurrentMemberId,
    },
    showRolePreview: !sessionMember,
    showToast: requireJoin && !toastDismissed,
    toastProps: {
      accountSession,
      memberUserId: currentMember.userId,
      claimState: accountClaimState,
      canClaim: canClaimMember,
      dismissing: isToastDismissing,
      onClaim: onClaimMember,
      onDismiss: dismissWorkspaceToast,
    },
    viewsProps,
  };
}
