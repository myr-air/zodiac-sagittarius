import type { BookingDocInputLike } from "@/src/trip/booking-docs";
import type { TripApiClient } from "@/src/trip/api-client";
import type {
  ExpenseSummary,
  Trip,
  TripParticipantSession,
} from "@/src/trip/types";
import { useWorkspaceExpenseEstimateCommand } from "./expenses/use-workspace-expense-estimate-command";
import { useWorkspaceExpenseMutationCommands } from "./expenses/use-workspace-expense-mutation-commands";
import { useWorkspaceExpenseReminderCommand } from "./expenses/use-workspace-expense-reminder-command";

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

  const duplicateExpenseAsEstimate = useWorkspaceExpenseEstimateCommand({
    canEditBookings,
    createBookingDoc,
    currentMemberId,
    selectedTripPlanId,
    trip,
  });

  const {
    createExpense,
    deleteExpense,
    updateExpense,
  } = useWorkspaceExpenseMutationCommands({
    apiClient,
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
    duplicateExpenseAsEstimate,
    recordPaybackReminder,
    updateExpense,
  };
}
