import { tripPlanOptions } from "@/src/trip/trip-plans";
import type {
  BuildWorkspaceShellPropsInput,
  WorkspaceShellProps,
} from "./workspace-shell-props";

type BuildWorkspaceDialogsPropsInput = Pick<
  BuildWorkspaceShellPropsInput,
  | "applyPendingItineraryImport"
  | "clearPendingItineraryImport"
  | "createStop"
  | "currentMember"
  | "deleteSelectedStop"
  | "deleteStop"
  | "dialogDeleteItem"
  | "dialogState"
  | "pathOptions"
  | "pendingItineraryImport"
  | "promoteFoodRecommendation"
  | "selectedDay"
  | "selectedTripPathId"
  | "selectedTripPlanId"
  | "setDialogDeleteItem"
  | "setDialogState"
  | "setStopPlaceResolution"
  | "stopPlaceResolution"
  | "t"
  | "trip"
  | "updateSelectedStop"
>;

export function buildWorkspaceDialogsProps({
  applyPendingItineraryImport,
  clearPendingItineraryImport,
  createStop,
  currentMember,
  deleteSelectedStop,
  deleteStop,
  dialogDeleteItem,
  dialogState,
  pathOptions,
  pendingItineraryImport,
  promoteFoodRecommendation,
  selectedDay,
  selectedTripPathId,
  selectedTripPlanId,
  setDialogDeleteItem,
  setDialogState,
  setStopPlaceResolution,
  stopPlaceResolution,
  t,
  trip,
  updateSelectedStop,
}: BuildWorkspaceDialogsPropsInput): WorkspaceShellProps["dialogsProps"] {
  return {
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
    tripPlanOptions: tripPlanOptions(trip),
    updateSelectedStop,
    deleteCancelLabel: t.itinerary.row.confirmDeleteNo,
    deleteConfirmLabel: t.itinerary.row.confirmDeleteYes,
    deleteTitleForActivity: (activity) =>
      t.itinerary.row.confirmDeleteTitle({ activity }),
    deleteBodyForActivity: (activity) =>
      t.itinerary.row.confirmDeleteBody({ activity }),
  };
}
