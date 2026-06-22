import type { TripTask } from "@/src/trip/types";
import type {
  TaskScopeFilter,
  TaskStatusFilter,
} from "./overview-role-panels.types";

export interface OverviewTaskFilterState {
  scope: TaskScopeFilter;
  status: TaskStatusFilter;
}

export interface OverviewNewTaskFormState {
  assigneeId: string;
  title: string;
  visibility: TripTask["visibility"];
}

export interface OverviewTaskSubmission {
  assigneeId: string | null;
  nextFilterState: OverviewTaskFilterState;
  title: string;
  visibility: TripTask["visibility"];
}

export interface OverviewTaskUiState {
  filterState: OverviewTaskFilterState;
  isTaskDialogOpen: boolean;
  newTaskFormState: OverviewNewTaskFormState;
  undoTask: TripTask | null;
}

export const initialOverviewTaskFilterState: OverviewTaskFilterState = {
  scope: "mine",
  status: "all",
};

export const initialOverviewNewTaskFormState: OverviewNewTaskFormState = {
  assigneeId: "",
  title: "",
  visibility: "private",
};

export const initialOverviewTaskUiState: OverviewTaskUiState = {
  filterState: initialOverviewTaskFilterState,
  isTaskDialogOpen: false,
  newTaskFormState: initialOverviewNewTaskFormState,
  undoTask: null,
};

export function updateOverviewTaskFilterState<
  Field extends keyof OverviewTaskFilterState,
>(
  state: OverviewTaskFilterState,
  field: Field,
  value: OverviewTaskFilterState[Field],
): OverviewTaskFilterState {
  return { ...state, [field]: value };
}

export function updateOverviewNewTaskFormState<
  Field extends keyof OverviewNewTaskFormState,
>(
  state: OverviewNewTaskFormState,
  field: Field,
  value: OverviewNewTaskFormState[Field],
): OverviewNewTaskFormState {
  return { ...state, [field]: value };
}

export function updateOverviewTaskUiFilterState<
  Field extends keyof OverviewTaskFilterState,
>(
  state: OverviewTaskUiState,
  field: Field,
  value: OverviewTaskFilterState[Field],
): OverviewTaskUiState {
  return {
    ...state,
    filterState: updateOverviewTaskFilterState(state.filterState, field, value),
  };
}

export function updateOverviewTaskUiFormState<
  Field extends keyof OverviewNewTaskFormState,
>(
  state: OverviewTaskUiState,
  field: Field,
  value: OverviewNewTaskFormState[Field],
): OverviewTaskUiState {
  return {
    ...state,
    newTaskFormState: updateOverviewNewTaskFormState(
      state.newTaskFormState,
      field,
      value,
    ),
  };
}

export function openOverviewTaskDialog(
  state: OverviewTaskUiState,
): OverviewTaskUiState {
  return {
    ...state,
    isTaskDialogOpen: true,
  };
}

export function closeOverviewTaskDialog(
  state: OverviewTaskUiState,
): OverviewTaskUiState {
  return {
    ...state,
    isTaskDialogOpen: false,
    newTaskFormState: initialOverviewNewTaskFormState,
  };
}

export function applyOverviewTaskSubmission(
  state: OverviewTaskUiState,
  submission: OverviewTaskSubmission,
): OverviewTaskUiState {
  return {
    ...state,
    filterState: submission.nextFilterState,
    isTaskDialogOpen: false,
    newTaskFormState: initialOverviewNewTaskFormState,
  };
}

export function setOverviewUndoTask(
  state: OverviewTaskUiState,
  undoTask: TripTask | null,
): OverviewTaskUiState {
  return {
    ...state,
    undoTask,
  };
}
