import { useCallback } from "react";
import {
  buildExpenseUpdateDraft,
  buildPatchExpenseRequest,
  replaceExpenseInTrip,
  updateLocalExpenseInTrip,
} from "@/src/trip/expenses";
import { nextClientMutationId } from "@/src/trip/identity";
import { tripPlanIdForRecord } from "@/src/trip/workspace/trip-plan-records";
import type {
  UpdateWorkspaceExpenseCommand,
  UseWorkspaceExpenseMutationCommandsOptions,
} from "./workspace-expense-mutation-command-types";

type UseUpdateWorkspaceExpenseCommandOptions =
  UseWorkspaceExpenseMutationCommandsOptions;

export function useUpdateWorkspaceExpenseCommand({
  apiClient,
  canEditExpenses,
  commitTrip,
  isApiMode,
  participantSession,
  refreshBackendExpenseSummary,
  selectedTripPlanId,
  trip,
  updateApiTrip,
}: UseUpdateWorkspaceExpenseCommandOptions): UpdateWorkspaceExpenseCommand {
  return useCallback(async (input) => {
    if (!canEditExpenses) return;
    const existing = trip.expenses.find(
      (expense) => expense.id === input.expenseId,
    );
    if (!existing) return;
    const expenseDraft = buildExpenseUpdateDraft(trip, existing, input, {
      selectedTripPlanId,
      resolveTripPlanId: tripPlanIdForRecord,
    });
    if (isApiMode && apiClient && participantSession) {
      const expense = await apiClient.patchExpense(
        trip.id,
        input.expenseId,
        participantSession.sessionToken,
        buildPatchExpenseRequest(expenseDraft, {
          clientMutationId: nextClientMutationId("expense-patch"),
          expectedVersion: existing.version ?? 1,
        }),
      );
      updateApiTrip((current) => replaceExpenseInTrip(current, expense));
      await refreshBackendExpenseSummary();
      return;
    }
    commitTrip((current) => updateLocalExpenseInTrip(current, expenseDraft));
  }, [
    apiClient,
    canEditExpenses,
    commitTrip,
    isApiMode,
    participantSession,
    refreshBackendExpenseSummary,
    selectedTripPlanId,
    trip,
    updateApiTrip,
  ]);
}
