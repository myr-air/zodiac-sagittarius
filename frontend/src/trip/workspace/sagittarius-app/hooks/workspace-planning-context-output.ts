import type { TripCockpit } from "@/src/trip/api-client";
import type { WorkspacePlanningRecordsContext } from "./use-workspace-planning-records-context";
import type { WorkspaceTripPlanCommands } from "./use-workspace-trip-plans";

interface BuildWorkspacePlanningContextOutputParams {
  records: WorkspacePlanningRecordsContext;
  replaceCockpitFromApi: (cockpit: TripCockpit) => void;
  tripPlanCommands: WorkspaceTripPlanCommands;
}

export function buildWorkspacePlanningContextOutput({
  records,
  replaceCockpitFromApi,
  tripPlanCommands,
}: BuildWorkspacePlanningContextOutputParams) {
  return {
    createItineraryNote: records.createItineraryNote,
    createStopNote: records.createStopNote,
    createTask: records.createTask,
    createTripPlan: tripPlanCommands.createTripPlan,
    deleteStopNote: records.deleteStopNote,
    expenseSummary: records.expenseSummary,
    itineraryView: records.itineraryView,
    mainItineraryView: records.mainItineraryView,
    renameTripPlan: tripPlanCommands.renameTripPlan,
    replaceCockpitFromApi,
    reviewSuggestion: records.reviewSuggestion,
    scopedSuggestions: records.scopedSuggestions,
    scopedTripForRecords: records.scopedTripForRecords,
    scopedTripPlanRecords: records.scopedTripPlanRecords,
    selectTripPlan: tripPlanCommands.selectTripPlan,
    selectedDay: records.selectedDay,
    selectedItem: records.selectedItem,
    selectedItemIdForView: records.selectedItemIdForView,
    setMainTripPlan: tripPlanCommands.setMainTripPlan,
    setStopNotes: records.setStopNotes,
    setTasks: records.setTasks,
    stopNotes: records.stopNotes,
    suggestSelectedStop: records.suggestSelectedStop,
    tasks: records.tasks,
    toggleTaskStatus: records.toggleTaskStatus,
    updateStopNote: records.updateStopNote,
    updateTripPlanStatus: tripPlanCommands.updateTripPlanStatus,
  };
}

export type WorkspacePlanningContextOutput = ReturnType<
  typeof buildWorkspacePlanningContextOutput
>;
