import type { ItineraryItem } from "@/src/trip/types";

export interface ActivityCellUiState {
  actionsExpanded: boolean;
  noteTarget: ItineraryItem | null;
  subActivitiesExpanded: boolean;
  subActivityModalOpen: boolean;
}

export function initialActivityCellUiState(): ActivityCellUiState {
  return {
    actionsExpanded: false,
    noteTarget: null,
    subActivitiesExpanded: false,
    subActivityModalOpen: false,
  };
}

export function activityCellActionsExpandedState(
  state: ActivityCellUiState,
  actionsExpanded: boolean | ((current: boolean) => boolean),
): ActivityCellUiState {
  return {
    ...state,
    actionsExpanded:
      typeof actionsExpanded === "function"
        ? actionsExpanded(state.actionsExpanded)
        : actionsExpanded,
  };
}

export function activityCellNoteTargetState(
  state: ActivityCellUiState,
  noteTarget: ItineraryItem | null,
  compact = false,
): ActivityCellUiState {
  return {
    ...state,
    actionsExpanded: compact ? false : state.actionsExpanded,
    noteTarget,
  };
}

export function activityCellSubActivityModalState(
  state: ActivityCellUiState,
  subActivityModalOpen: boolean,
  compact = false,
): ActivityCellUiState {
  return {
    ...state,
    actionsExpanded: compact ? false : state.actionsExpanded,
    subActivityModalOpen,
  };
}

export function activityCellSubActivitiesToggledState(
  state: ActivityCellUiState,
  compact = false,
): ActivityCellUiState {
  return {
    ...state,
    actionsExpanded: compact ? false : state.actionsExpanded,
    subActivitiesExpanded: !state.subActivitiesExpanded,
  };
}
