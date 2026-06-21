import { vi } from "vitest";
import { renderWithI18n } from "@/src/i18n/test-utils";
import { buildExpenseSummary } from "@/src/trip/expenses";
import { seedTrip } from "@/src/trip/seed";
import { TripExpensesPage } from "../../TripExpensesPage";

export function renderExpenses(overrides: Partial<Parameters<typeof TripExpensesPage>[0]> = {}) {
  const props: Parameters<typeof TripExpensesPage>[0] = {
    trip: seedTrip,
    currentMember: seedTrip.members[1],
    expenseSummary: buildExpenseSummary(seedTrip.expenses, seedTrip.members[1].id),
    canEditExpenses: true,
    onCreateExpense: vi.fn(),
    onUpdateExpense: vi.fn(),
    onDeleteExpense: vi.fn(),
    onRecordPaybackReminder: vi.fn(),
    ...overrides,
  };
  renderWithI18n(<TripExpensesPage {...props} />, { locale: "th" });
  return props;
}
