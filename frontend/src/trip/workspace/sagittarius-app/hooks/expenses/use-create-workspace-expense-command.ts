import { useCallback } from "react";
import {
  appendExpensesToTrip,
  appendLocalExpensesToTrip,
  buildCreateExpenseRequest,
  buildExpenseCreateDrafts,
  resolveExpenseCreateDraftTripPlanId,
} from "@/src/trip/expenses";
import { nextClientMutationId, nextLocalExpenseId } from "@/src/trip/identity";
import type { Expense } from "@/src/trip/types";
import { tripPlanIdForRecord } from "@/src/trip/workspace/trip-plan-records";
import type {
  CreateWorkspaceExpenseCommand,
  UseWorkspaceExpenseMutationCommandsOptions,
} from "./workspace-expense-mutation-command-types";

type UseCreateWorkspaceExpenseCommandOptions =
  UseWorkspaceExpenseMutationCommandsOptions;

export function useCreateWorkspaceExpenseCommand({
  apiClient,
  canEditExpenses,
  commitTrip,
  isApiMode,
  participantSession,
  refreshBackendExpenseSummary,
  selectedTripPlanId,
  trip,
  updateApiTrip,
}: UseCreateWorkspaceExpenseCommandOptions): CreateWorkspaceExpenseCommand {
  return useCallback(async (input) => {
    if (!canEditExpenses) return;
    const expenseDrafts = buildExpenseCreateDrafts(
      input,
      trip.members.map((member) => member.id),
    );

    if (isApiMode && apiClient && participantSession) {
      const createdExpenses: Expense[] = [];
      for (const expenseDraft of expenseDrafts) {
        const expense = await apiClient.createExpense(
          trip.id,
          participantSession.sessionToken,
          buildCreateExpenseRequest(expenseDraft, {
            clientMutationId: nextClientMutationId("expense-create"),
            tripPlanId: resolveExpenseCreateDraftTripPlanId(
              trip,
              expenseDraft,
              {
                selectedTripPlanId,
                resolveTripPlanId: tripPlanIdForRecord,
              },
            ),
          }),
        );
        createdExpenses.push(expense);
      }
      updateApiTrip((current) => appendExpensesToTrip(current, createdExpenses));
      await refreshBackendExpenseSummary();
      return;
    }

    commitTrip((current) =>
      appendLocalExpensesToTrip(current, expenseDrafts, {
        selectedTripPlanId,
        nextExpenseId: nextLocalExpenseId,
        resolveTripPlanId: tripPlanIdForRecord,
      }),
    );
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
