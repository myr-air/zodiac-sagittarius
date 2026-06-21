import { useCallback } from "react";
import type { TripApiClient } from "@/src/trip/api-client";
import {
  appendExpensesToTrip,
  appendLocalExpensesToTrip,
  buildCreateExpenseRequest,
  buildExpenseCreateDrafts,
  buildExpenseUpdateDraft,
  buildPatchExpenseRequest,
  removeExpenseFromTrip,
  replaceExpenseInTrip,
  resolveExpenseCreateDraftTripPlanId,
  updateLocalExpenseInTrip,
  type ExpenseInputLike,
  type ExpenseUpdateInputLike,
} from "@/src/trip/expenses";
import { nextClientMutationId, nextLocalExpenseId } from "@/src/trip/identity";
import type {
  Expense,
  ExpenseSummary,
  Trip,
  TripParticipantSession,
} from "@/src/trip/types";
import { tripPlanIdForRecord } from "@/src/trip/workspace/trip-plan-records";

interface UseWorkspaceExpenseMutationCommandsOptions {
  apiClient?: TripApiClient;
  canEditExpenses: boolean;
  commitTrip: (updater: (current: Trip) => Trip) => void;
  isApiMode: boolean;
  participantSession: TripParticipantSession | null;
  refreshBackendExpenseSummary: () => Promise<ExpenseSummary | null>;
  selectedTripPlanId: string;
  trip: Trip;
  updateApiTrip: (updater: (current: Trip) => Trip) => void;
}

export function useWorkspaceExpenseMutationCommands({
  apiClient,
  canEditExpenses,
  commitTrip,
  isApiMode,
  participantSession,
  refreshBackendExpenseSummary,
  selectedTripPlanId,
  trip,
  updateApiTrip,
}: UseWorkspaceExpenseMutationCommandsOptions) {
  const createExpense = useCallback(async (input: ExpenseInputLike) => {
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

  const deleteExpense = useCallback(async (expenseId: string) => {
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

  const updateExpense = useCallback(async (input: ExpenseUpdateInputLike) => {
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

  return {
    createExpense,
    deleteExpense,
    updateExpense,
  };
}
