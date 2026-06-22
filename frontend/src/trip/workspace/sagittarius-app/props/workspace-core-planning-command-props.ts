import type {
  WorkspaceCorePlanningCommandProps,
  WorkspacePlanningContext,
} from "./workspace-core-command-props.types";

export function buildWorkspaceCorePlanningCommandProps(
  planning: WorkspacePlanningContext,
): WorkspaceCorePlanningCommandProps {
  return {
    createItineraryNote: planning.createItineraryNote,
    createStopNote: planning.createStopNote,
    deleteStopNote: planning.deleteStopNote,
    onChangeTripPlan: planning.selectTripPlan,
    onChangeTripPlanStatus: planning.updateTripPlanStatus,
    onCockpitLoaded: planning.replaceCockpitFromApi,
    onCreateTask: planning.createTask,
    onCreateTripPlan: planning.createTripPlan,
    onRenameTripPlan: planning.renameTripPlan,
    onSetMainTripPlan: planning.setMainTripPlan,
    onToggleTaskStatus: planning.toggleTaskStatus,
    reviewSuggestion: planning.reviewSuggestion,
    suggestSelectedStop: planning.suggestSelectedStop,
    toggleTaskStatus: planning.toggleTaskStatus,
    updateStopNote: planning.updateStopNote,
  };
}
