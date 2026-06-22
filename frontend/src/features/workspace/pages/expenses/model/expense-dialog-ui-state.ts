import type { Expense, Trip } from "@/src/trip/types";
import { initialExpenseTripPlanId } from "./expense-dialog-initial-state";

export interface ExpenseDialogUiState {
  isSaving: boolean;
  tripPlanId: string;
}

export function initialExpenseDialogUiState({
  expense,
  selectedTripPlanId,
  trip,
}: {
  expense: Expense | null;
  selectedTripPlanId?: string | null;
  trip: Trip;
}): ExpenseDialogUiState {
  return {
    isSaving: false,
    tripPlanId: initialExpenseTripPlanId({ expense, selectedTripPlanId, trip }),
  };
}

export function updateExpenseDialogTripPlanId(
  state: ExpenseDialogUiState,
  tripPlanId: string,
): ExpenseDialogUiState {
  return { ...state, tripPlanId };
}

export function setExpenseDialogSaving(
  state: ExpenseDialogUiState,
  isSaving: boolean,
): ExpenseDialogUiState {
  return { ...state, isSaving };
}
