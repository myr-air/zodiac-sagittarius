import { useCallback } from "react";
import { removeExpenseFromTrip } from "@/src/trip/expenses";
import type {
  DeleteWorkspaceExpenseCommand,
  UseWorkspaceExpenseMutationCommandsOptions,
} from "./workspace-expense-mutation-command-types";

type UseDeleteWorkspaceExpenseCommandOptions = Omit<
  UseWorkspaceExpenseMutationCommandsOptions,
  "selectedTripPlanId"
>;

export function useDeleteWorkspaceExpenseCommand({
  apiClient,
  canEditExpenses,
  commitTrip,
  isApiMode,
  participantSession,
  refreshBackendExpenseSummary,
  trip,
  updateApiTrip,
}: UseDeleteWorkspaceExpenseCommandOptions): DeleteWorkspaceExpenseCommand {
  return useCallback(async (expenseId) => {
    if (!canEditExpenses) return;
    if (isApiMode && apiClient && participantSession) {
      await apiClient.deleteExpense(
        trip.id,
        expenseId,
        participantSession.sessionToken,
      );
      updateApiTrip((current) => removeExpenseFromTrip(current, expenseId));
      await refreshBackendExpenseSummary();
      return;
    }
    commitTrip((current) => removeExpenseFromTrip(current, expenseId));
  }, [
    apiClient,
    canEditExpenses,
    commitTrip,
    isApiMode,
    participantSession,
    refreshBackendExpenseSummary,
    trip.id,
    updateApiTrip,
  ]);
}
