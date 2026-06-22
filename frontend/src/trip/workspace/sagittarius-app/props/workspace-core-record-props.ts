import type { useWorkspacePlanningContext } from "../hooks";
import type { BuildWorkspaceFramePropsInput } from "./workspace-frame-props";

type WorkspacePlanningContext = ReturnType<typeof useWorkspacePlanningContext>;

type WorkspaceCoreRecordProps = Pick<
  BuildWorkspaceFramePropsInput,
  | "bookingDocs"
  | "expenseSummary"
  | "itineraryView"
  | "mainItineraryView"
  | "scopedSuggestions"
  | "scopedTripForRecords"
  | "scopedTripPlanRecords"
  | "selectedDay"
  | "selectedItem"
  | "selectedItemIdForView"
  | "tasks"
>;

export function buildWorkspaceCoreRecordProps(
  planning: WorkspacePlanningContext,
): WorkspaceCoreRecordProps {
  return {
    bookingDocs: planning.scopedTripPlanRecords.bookingDocs,
    expenseSummary: planning.expenseSummary,
    itineraryView: planning.itineraryView,
    mainItineraryView: planning.mainItineraryView,
    scopedSuggestions: planning.scopedSuggestions,
    scopedTripForRecords: planning.scopedTripForRecords,
    scopedTripPlanRecords: planning.scopedTripPlanRecords,
    selectedDay: planning.selectedDay,
    selectedItem: planning.selectedItem,
    selectedItemIdForView: planning.selectedItemIdForView,
    tasks: planning.scopedTripPlanRecords.tasks,
  };
}
