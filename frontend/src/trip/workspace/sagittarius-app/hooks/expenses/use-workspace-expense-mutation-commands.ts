import { useCreateWorkspaceExpenseCommand } from "./use-create-workspace-expense-command";
import { useDeleteWorkspaceExpenseCommand } from "./use-delete-workspace-expense-command";
import { useUpdateWorkspaceExpenseCommand } from "./use-update-workspace-expense-command";
import type { UseWorkspaceExpenseMutationCommandsOptions } from "./workspace-expense-mutation-command-types";

export function useWorkspaceExpenseMutationCommands({
  apiClient,
  canCreateExpenses,
  canEditExpenses,
  commitTrip,
  isApiMode,
  participantSession,
  refreshBackendExpenseSummary,
  selectedTripPlanId,
  trip,
  updateApiTrip,
}: UseWorkspaceExpenseMutationCommandsOptions) {
  const createExpense = useCreateWorkspaceExpenseCommand({
    apiClient,
    canCreateExpenses,
    canEditExpenses,
    commitTrip,
    isApiMode,
    participantSession,
    refreshBackendExpenseSummary,
    selectedTripPlanId,
    trip,
    updateApiTrip,
  });
  const deleteExpense = useDeleteWorkspaceExpenseCommand({
    apiClient,
    canCreateExpenses,
    canEditExpenses,
    commitTrip,
    isApiMode,
    participantSession,
    refreshBackendExpenseSummary,
    trip,
    updateApiTrip,
  });
  const updateExpense = useUpdateWorkspaceExpenseCommand({
    apiClient,
    canCreateExpenses,
    canEditExpenses,
    commitTrip,
    isApiMode,
    participantSession,
    refreshBackendExpenseSummary,
    selectedTripPlanId,
    trip,
    updateApiTrip,
  });

  return {
    createExpense,
    deleteExpense,
    updateExpense,
  };
}
