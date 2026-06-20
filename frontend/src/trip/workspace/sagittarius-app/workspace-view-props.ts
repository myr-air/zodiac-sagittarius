import type { ComponentProps } from "react";
import type { TripWorkspaceViews } from "@/src/trip/workspace/TripWorkspaceViews";

type WorkspaceViewsProps = ComponentProps<typeof TripWorkspaceViews>;

interface BuildWorkspaceViewsPropsInput {
  activePlanItems: WorkspaceViewsProps["itineraryProps"]["graphItems"];
  apiBaseUrl: WorkspaceViewsProps["expensesProps"]["apiBaseUrl"];
  bookingDocs: WorkspaceViewsProps["bookingsProps"]["bookingDocs"];
  canEdit: WorkspaceViewsProps["itineraryProps"]["canRestructure"];
  canEditBookings: WorkspaceViewsProps["bookingsProps"]["canEditBookings"];
  canEditExpenses: WorkspaceViewsProps["expensesProps"]["canEditExpenses"];
  canEditPhotoAlbums: WorkspaceViewsProps["photosProps"]["canEditPhotoAlbums"];
  canManagePeople: WorkspaceViewsProps["membersProps"]["canManagePeople"];
  contextRailOpen: WorkspaceViewsProps["timelineProps"]["contextRailOpen"];
  currentMember: WorkspaceViewsProps["settingsProps"]["currentMember"];
  currentView: WorkspaceViewsProps["currentView"];
  dailyBriefings: WorkspaceViewsProps["itineraryProps"]["dailyBriefings"];
  dayPathOverrides: WorkspaceViewsProps["itineraryProps"]["dayPathOverrides"];
  expenseSummary: WorkspaceViewsProps["overviewProps"]["expenseSummary"];
  itineraryView: WorkspaceViewsProps["itineraryProps"]["itineraryView"];
  joinInviteToken: WorkspaceViewsProps["membersProps"]["joinInviteToken"];
  mainItineraryView: WorkspaceViewsProps["mapProps"]["itineraryView"];
  mainPlanItems: WorkspaceViewsProps["mapProps"]["items"];
  onAddBookingForItem: WorkspaceViewsProps["itineraryProps"]["onAddBookingForItem"];
  onAddNoteForItem: WorkspaceViewsProps["itineraryProps"]["onAddNoteForItem"];
  onAddStop: WorkspaceViewsProps["itineraryProps"]["onAddStop"];
  onAddSubActivity: WorkspaceViewsProps["itineraryProps"]["onAddSubActivity"];
  onChangeDayPath: WorkspaceViewsProps["itineraryProps"]["onChangeDayPath"];
  onChangeMemberAccessStatus: WorkspaceViewsProps["membersProps"]["onChangeMemberAccessStatus"];
  onChangeMemberPassword: WorkspaceViewsProps["membersProps"]["onChangeMemberPassword"];
  onChangeMemberRole: WorkspaceViewsProps["membersProps"]["onChangeMemberRole"];
  onChangeTripPlan: WorkspaceViewsProps["itineraryProps"]["onChangeTripPlan"];
  onChangeTripPlanStatus: WorkspaceViewsProps["itineraryProps"]["onChangeTripPlanStatus"];
  onClearDayPath: WorkspaceViewsProps["itineraryProps"]["onClearDayPath"];
  onCreateBookingDoc: WorkspaceViewsProps["bookingsProps"]["onCreateBookingDoc"];
  onCreateExpense: WorkspaceViewsProps["expensesProps"]["onCreateExpense"];
  onCreateMember: WorkspaceViewsProps["membersProps"]["onCreateMember"];
  onCreatePhotoAlbum: WorkspaceViewsProps["photosProps"]["onCreatePhotoAlbum"];
  onCreateTask: WorkspaceViewsProps["overviewProps"]["onCreateTask"];
  onCreateTripPlan: WorkspaceViewsProps["itineraryProps"]["onCreateTripPlan"];
  onDeleteBookingDoc: WorkspaceViewsProps["bookingsProps"]["onDeleteBookingDoc"];
  onDeleteExpense: WorkspaceViewsProps["expensesProps"]["onDeleteExpense"];
  onDeleteItem: WorkspaceViewsProps["itineraryProps"]["onDeleteItem"];
  onDeletePhotoAlbum: WorkspaceViewsProps["photosProps"]["onDeletePhotoAlbum"];
  onDuplicateExpenseAsEstimate: WorkspaceViewsProps["expensesProps"]["onDuplicateExpenseAsEstimate"];
  onEditItem: WorkspaceViewsProps["itineraryProps"]["onEditItem"];
  onMoveItemToPath: WorkspaceViewsProps["itineraryProps"]["onMoveItemToPath"];
  onOpenExpenses: WorkspaceViewsProps["overviewProps"]["onOpenExpenses"];
  onOpenItemDetails: WorkspaceViewsProps["itineraryProps"]["onOpenItemDetails"];
  onRecordPaybackReminder: WorkspaceViewsProps["expensesProps"]["onRecordPaybackReminder"];
  onRenameTripPlan: WorkspaceViewsProps["itineraryProps"]["onRenameTripPlan"];
  onResetMemberClaim: WorkspaceViewsProps["membersProps"]["onResetMemberClaim"];
  onResolveMissingCoordinates: WorkspaceViewsProps["mapProps"]["onResolveMissingCoordinates"];
  onRotateJoinInviteToken: WorkspaceViewsProps["membersProps"]["onRotateJoinInviteToken"];
  onSaveDailyBriefingOverrides: WorkspaceViewsProps["overviewProps"]["onSaveDailyBriefingOverrides"];
  onSaveDayTitle: WorkspaceViewsProps["itineraryProps"]["onSaveDayTitle"];
  onSaveItineraryBookingTicket: WorkspaceViewsProps["itineraryProps"]["onSaveBookingForItem"];
  onSaveTripSettings: WorkspaceViewsProps["settingsProps"]["onSave"];
  onSelectItem: WorkspaceViewsProps["itineraryProps"]["onSelectItem"];
  onSetMainTripPlan: WorkspaceViewsProps["itineraryProps"]["onSetMainTripPlan"];
  onToggleContextRail: WorkspaceViewsProps["timelineProps"]["onToggleContextRail"];
  onToggleShowAllPaths: WorkspaceViewsProps["itineraryProps"]["onToggleShowAllPaths"];
  onToggleTaskStatus: WorkspaceViewsProps["overviewProps"]["onToggleTaskStatus"];
  onTransferOwnership: WorkspaceViewsProps["membersProps"]["onTransferOwnership"];
  onUnlinkBookingForItem: WorkspaceViewsProps["itineraryProps"]["onUnlinkBookingForItem"];
  onUpdateBookingDoc: WorkspaceViewsProps["bookingsProps"]["onUpdateBookingDoc"];
  onUpdateExpense: WorkspaceViewsProps["expensesProps"]["onUpdateExpense"];
  onUpdateItemInline: WorkspaceViewsProps["itineraryProps"]["onUpdateItemInline"];
  onUpdatePhotoAlbum: WorkspaceViewsProps["photosProps"]["onUpdatePhotoAlbum"];
  pathOptions: WorkspaceViewsProps["itineraryProps"]["pathOptions"];
  photoAlbumLinks: WorkspaceViewsProps["photosProps"]["photoAlbumLinks"];
  planItems: WorkspaceViewsProps["itineraryProps"]["items"];
  scopedSuggestions: WorkspaceViewsProps["overviewProps"]["suggestions"];
  scopedTripForRecords: WorkspaceViewsProps["overviewProps"]["trip"];
  selectedItemIdForView: WorkspaceViewsProps["itineraryProps"]["selectedItemId"];
  selectedTripPlanId: WorkspaceViewsProps["itineraryProps"]["selectedTripPlanId"];
  showAllPaths: WorkspaceViewsProps["itineraryProps"]["showAllPaths"];
  tasks: WorkspaceViewsProps["bookingsProps"]["tasks"];
  trip: WorkspaceViewsProps["settingsProps"]["trip"];
  tripPlanError: WorkspaceViewsProps["itineraryProps"]["tripPlanError"];
  isTripPlanBusy: WorkspaceViewsProps["itineraryProps"]["isTripPlanBusy"];
}

export function buildWorkspaceViewsProps({
  activePlanItems,
  apiBaseUrl,
  bookingDocs,
  canEdit,
  canEditBookings,
  canEditExpenses,
  canEditPhotoAlbums,
  canManagePeople,
  contextRailOpen,
  currentMember,
  currentView,
  dailyBriefings,
  dayPathOverrides,
  expenseSummary,
  itineraryView,
  joinInviteToken,
  mainItineraryView,
  mainPlanItems,
  onAddBookingForItem,
  onAddNoteForItem,
  onAddStop,
  onAddSubActivity,
  onChangeDayPath,
  onChangeMemberAccessStatus,
  onChangeMemberPassword,
  onChangeMemberRole,
  onChangeTripPlan,
  onChangeTripPlanStatus,
  onClearDayPath,
  onCreateBookingDoc,
  onCreateExpense,
  onCreateMember,
  onCreatePhotoAlbum,
  onCreateTask,
  onCreateTripPlan,
  onDeleteBookingDoc,
  onDeleteExpense,
  onDeleteItem,
  onDeletePhotoAlbum,
  onDuplicateExpenseAsEstimate,
  onEditItem,
  onMoveItemToPath,
  onOpenExpenses,
  onOpenItemDetails,
  onRecordPaybackReminder,
  onRenameTripPlan,
  onResetMemberClaim,
  onResolveMissingCoordinates,
  onRotateJoinInviteToken,
  onSaveDailyBriefingOverrides,
  onSaveDayTitle,
  onSaveItineraryBookingTicket,
  onSaveTripSettings,
  onSelectItem,
  onSetMainTripPlan,
  onToggleContextRail,
  onToggleShowAllPaths,
  onToggleTaskStatus,
  onTransferOwnership,
  onUnlinkBookingForItem,
  onUpdateBookingDoc,
  onUpdateExpense,
  onUpdateItemInline,
  onUpdatePhotoAlbum,
  pathOptions,
  photoAlbumLinks,
  planItems,
  scopedSuggestions,
  scopedTripForRecords,
  selectedItemIdForView,
  selectedTripPlanId,
  showAllPaths,
  tasks,
  trip,
  tripPlanError,
  isTripPlanBusy,
}: BuildWorkspaceViewsPropsInput): WorkspaceViewsProps {
  return {
    currentView,
    settingsProps: {
      canEdit: canManagePeople,
      currentMember,
      trip,
      onSave: onSaveTripSettings,
    },
    membersProps: {
      trip,
      currentMember,
      canManagePeople,
      joinInviteToken,
      onChangeMemberAccessStatus,
      onChangeMemberPassword,
      onChangeMemberRole,
      onCreateMember,
      onRotateJoinInviteToken,
      onResetMemberClaim,
      onTransferOwnership,
    },
    bookingsProps: {
      trip: scopedTripForRecords,
      tasks,
      currentMember,
      bookingDocs,
      canEditBookings,
      onCreateBookingDoc,
      onUpdateBookingDoc,
      onDeleteBookingDoc,
    },
    photosProps: {
      trip,
      currentMember,
      photoAlbumLinks,
      canEditPhotoAlbums,
      onCreatePhotoAlbum,
      onUpdatePhotoAlbum,
      onDeletePhotoAlbum,
    },
    expensesProps: {
      trip: scopedTripForRecords,
      currentMember,
      expenseSummary,
      canEditExpenses,
      selectedTripPlanId,
      apiBaseUrl,
      onCreateExpense,
      onUpdateExpense,
      onDeleteExpense,
      onDuplicateExpenseAsEstimate,
      onRecordPaybackReminder,
    },
    overviewProps: {
      trip: scopedTripForRecords,
      currentMemberId: currentMember.id,
      expenseSummary,
      items: planItems,
      itineraryView,
      suggestions: scopedSuggestions,
      tasks,
      dailyBriefings,
      onOpenExpenses,
      onCreateTask,
      onSaveDailyBriefingOverrides,
      onToggleTaskStatus,
    },
    itineraryProps: {
      canRestructure: canEdit,
      endDate: trip.endDate,
      graphItems: activePlanItems,
      items: planItems,
      dailyBriefings,
      itineraryView,
      pathOptions,
      tripPlans: trip.tripPlans ?? trip.planVariants,
      selectedTripPlanId,
      mainTripPlanId: trip.mainTripPlanId || trip.activePlanVariantId,
      onChangeTripPlan,
      onSetMainTripPlan,
      onChangeTripPlanStatus,
      onCreateTripPlan,
      onRenameTripPlan,
      onSaveDayTitle,
      tripPlanError,
      isTripPlanBusy,
      role: currentMember.role,
      startDate: trip.startDate,
      selectedItemId: selectedItemIdForView,
      dayPathOverrides,
      showAllPaths,
      tripName: trip.name,
      bookingDocs,
      onAddBookingForItem,
      onSaveBookingForItem: onSaveItineraryBookingTicket,
      onUnlinkBookingForItem,
      onAddStop,
      onAddSubActivity,
      onAddNoteForItem,
      onOpenItemDetails,
      onSelectItem,
      onMoveItemToPath,
      onUpdateItemInline,
      onEditItem,
      onDeleteItem,
      onChangeDayPath,
      onClearDayPath,
      onToggleShowAllPaths,
    },
    mapProps: {
      countries: trip.countries ?? [],
      destinationLabel: trip.destinationLabel,
      endDate: trip.endDate,
      items: mainPlanItems,
      itineraryView: mainItineraryView,
      startDate: trip.startDate,
      tripName: trip.name,
      onResolveMissingCoordinates,
    },
    timelineProps: {
      contextRailOpen,
      endDate: trip.endDate,
      items: planItems,
      itineraryView,
      selectedItemId: selectedItemIdForView,
      startDate: trip.startDate,
      tripName: trip.name,
      onSelectItem,
      onToggleContextRail,
    },
  };
}
