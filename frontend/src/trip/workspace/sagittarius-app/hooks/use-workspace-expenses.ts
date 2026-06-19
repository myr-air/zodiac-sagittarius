import { useCallback } from "react";
import {
  type BookingDocInputLike,
  bookingDocInputForExpenseEstimate,
} from "@/src/trip/booking-docs";
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
  updateLocalExpenseInTrip,
  type ExpenseInputLike,
  type ExpenseUpdateInputLike,
} from "@/src/trip/expenses";
import { nextClientMutationId, nextLocalExpenseId } from "@/src/trip/local-ids";
import type {
  Expense,
  ExpenseSummary,
  Trip,
  TripParticipantSession,
} from "@/src/trip/types";
import { tripPlanIdForRecord } from "@/src/trip/workspace/trip-plan-records";
import { useWorkspaceExpenseReminderCommand } from "./use-workspace-expense-reminder-command";

interface UseWorkspaceExpensesOptions {
  apiClient?: TripApiClient;
  canEditBookings: boolean;
  canEditExpenses: boolean;
  commitTrip: (updater: (current: Trip) => Trip) => void;
  createBookingDoc: (input: BookingDocInputLike) => Promise<unknown>;
  currentMemberId: string;
  isApiMode: boolean;
  participantSession: TripParticipantSession | null;
  refreshBackendExpenseSummary: () => Promise<ExpenseSummary | null>;
  selectedTripPlanId: string;
  setBackendExpenseSummary: (
    summary: { tripPlanId: string; summary: ExpenseSummary } | null,
  ) => void;
  trip: Trip;
  updateApiTrip: (updater: (current: Trip) => Trip) => void;
}

export function useWorkspaceExpenses({
  apiClient,
  canEditBookings,
  canEditExpenses,
  commitTrip,
  createBookingDoc,
  currentMemberId,
  isApiMode,
  participantSession,
  refreshBackendExpenseSummary,
  selectedTripPlanId,
  setBackendExpenseSummary,
  trip,
  updateApiTrip,
}: UseWorkspaceExpensesOptions) {
  const recordPaybackReminder = useWorkspaceExpenseReminderCommand({
    apiClient,
    commitTrip,
    isApiMode,
    participantSession,
    selectedTripPlanId,
    setBackendExpenseSummary,
    trip,
  });

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
            tripPlanId: tripPlanIdForRecord(
              trip,
              expenseDraft.itemId,
              expenseDraft.tripPlanId ?? selectedTripPlanId,
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

  const duplicateExpenseAsEstimate = useCallback(async (expense: Expense) => {
    if (!canEditBookings) return;
    await createBookingDoc(
      bookingDocInputForExpenseEstimate(expense, {
        currentMemberId,
        defaultTimezone: trip.defaultTimezone,
        members: trip.members,
        itineraryItems: trip.itineraryItems,
        selectedTripPlanId,
        mainTripPlanId: trip.mainTripPlanId,
        activePlanVariantId: trip.activePlanVariantId,
      }),
    );
  }, [
    canEditBookings,
    createBookingDoc,
    currentMemberId,
    selectedTripPlanId,
    trip.activePlanVariantId,
    trip.defaultTimezone,
    trip.itineraryItems,
    trip.mainTripPlanId,
    trip.members,
  ]);

  return {
    createExpense,
    deleteExpense,
    duplicateExpenseAsEstimate,
    recordPaybackReminder,
    updateExpense,
  };
}
