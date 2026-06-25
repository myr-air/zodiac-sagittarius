import type { TripApiClient } from "@/src/trip/api-client";
import type {
  ExpenseInputLike,
  ExpenseUpdateInputLike,
} from "@/src/trip/expenses";
import type {
  ExpenseSummary,
  Trip,
  TripParticipantSession,
} from "@/src/trip/types";

export interface UseWorkspaceExpenseMutationCommandsOptions {
  apiClient?: TripApiClient;
  canCreateExpenses: boolean;
  canEditExpenses: boolean;
  commitTrip: (updater: (current: Trip) => Trip) => void;
  isApiMode: boolean;
  participantSession: TripParticipantSession | null;
  refreshBackendExpenseSummary: () => Promise<ExpenseSummary | null>;
  selectedTripPlanId: string;
  trip: Trip;
  updateApiTrip: (updater: (current: Trip) => Trip) => void;
}

export type CreateWorkspaceExpenseCommand = (
  input: ExpenseInputLike,
) => Promise<void>;

export type DeleteWorkspaceExpenseCommand = (
  expenseId: string,
) => Promise<void>;

export type UpdateWorkspaceExpenseCommand = (
  input: ExpenseUpdateInputLike,
) => Promise<void>;
