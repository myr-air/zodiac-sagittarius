import { useState } from "react";
import type { Expense, Trip } from "@/src/trip/types";
import {
  expenseDialogEffectiveTripPlanId,
  expenseDialogItemSelectionFields,
  expenseDialogLinkedItem,
  expenseDialogTripPlanOptions,
} from "../model/expense-dialog-linking";
import {
  initialExpenseDialogUiState,
  setExpenseDialogSaving,
  updateExpenseDialogTripPlanId,
} from "../model/expense-dialog-ui-state";

interface ExpenseDialogLinkingStateInput {
  expense: Expense | null;
  itemId: string;
  selectedTripPlanId?: string | null;
  setItemId: (itemId: string) => void;
  trip: Trip;
}

export function useExpenseDialogLinkingState({
  expense,
  itemId,
  selectedTripPlanId,
  setItemId,
  trip,
}: ExpenseDialogLinkingStateInput) {
  const [uiState, setUiState] = useState(() =>
    initialExpenseDialogUiState({ expense, selectedTripPlanId, trip }),
  );
  const linkedItem = expenseDialogLinkedItem(trip, itemId);
  const effectiveTripPlanId = expenseDialogEffectiveTripPlanId({
    linkedItem,
    tripPlanId: uiState.tripPlanId,
  });
  const tripPlanOptions = expenseDialogTripPlanOptions(trip);

  function changeItemId(nextItemId: string) {
    const nextFields = expenseDialogItemSelectionFields({
      currentTripPlanId: uiState.tripPlanId,
      itemId: nextItemId,
      trip,
    });
    setItemId(nextFields.itemId);
    setUiState((current) =>
      updateExpenseDialogTripPlanId(current, nextFields.tripPlanId),
    );
  }

  return {
    changeItemId,
    effectiveTripPlanId,
    isSaving: uiState.isSaving,
    linkedItem,
    setSaving: (isSaving: boolean) =>
      setUiState((current) => setExpenseDialogSaving(current, isSaving)),
    setTripPlanId: (tripPlanId: string) =>
      setUiState((current) =>
        updateExpenseDialogTripPlanId(current, tripPlanId),
      ),
    tripPlanOptions,
  };
}
