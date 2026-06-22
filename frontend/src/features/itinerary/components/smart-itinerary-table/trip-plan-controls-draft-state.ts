import type { PlanVariant } from "@/src/trip/types";

interface TripPlanNameDraft {
  name: string;
  planId: string;
}

export interface TripPlanControlDraftState {
  createError: string | null;
  editedNameDraft: TripPlanNameDraft | null;
  isCreating: boolean;
  newName: string;
}

export const initialTripPlanControlDraftState: TripPlanControlDraftState = {
  createError: null,
  editedNameDraft: null,
  isCreating: false,
  newName: "",
};

export function closeTripPlanCreateMode(
  state: TripPlanControlDraftState,
): TripPlanControlDraftState {
  return {
    ...state,
    createError: null,
    isCreating: false,
    newName: "",
  };
}

export function resetTripPlanSelectionDraft(
  state: TripPlanControlDraftState,
): TripPlanControlDraftState {
  return {
    ...state,
    createError: null,
    editedNameDraft: null,
  };
}

export function changeTripPlanEditedNameDraft(
  state: TripPlanControlDraftState,
  planId: string,
  name: string,
): TripPlanControlDraftState {
  return {
    ...state,
    createError: null,
    editedNameDraft: {
      name,
      planId,
    },
  };
}

export function changeTripPlanNewNameDraft(
  state: TripPlanControlDraftState,
  name: string,
): TripPlanControlDraftState {
  return {
    ...state,
    createError: null,
    newName: name,
  };
}

export function setTripPlanCreateMode(
  state: TripPlanControlDraftState,
  isCreating: boolean,
): TripPlanControlDraftState {
  return {
    ...state,
    isCreating,
  };
}

export function failTripPlanDraft(
  state: TripPlanControlDraftState,
  createError: string,
): TripPlanControlDraftState {
  return {
    ...state,
    createError,
  };
}

export function clearTripPlanDraftError(
  state: TripPlanControlDraftState,
): TripPlanControlDraftState {
  return {
    ...state,
    createError: null,
  };
}

export function markTripPlanRenamed(
  state: TripPlanControlDraftState,
  planId: string,
  name: string,
): TripPlanControlDraftState {
  return {
    ...state,
    editedNameDraft: { name, planId },
  };
}

export function resolveEditedTripPlanName(
  state: TripPlanControlDraftState,
  selectedTripPlan: PlanVariant | null | undefined,
): string {
  if (
    state.editedNameDraft &&
    selectedTripPlan &&
    state.editedNameDraft.planId === selectedTripPlan.id
  ) {
    return state.editedNameDraft.name;
  }

  return selectedTripPlan?.name ?? "";
}
