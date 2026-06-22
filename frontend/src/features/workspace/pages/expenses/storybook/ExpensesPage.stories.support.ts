import { expect, fn, within } from "storybook/test";
import { noop } from "@/src/testing/storybook-actions";
import { buildDenseTripFixture, buildEmptyTripFixture, tripFixture } from "@/src/trip/testing/fixtures/trip-fixtures";
import { buildExpenseSummary } from "@/src/trip/expenses";
import type { TripExpensesPageProps } from "../TripExpensesPage";

type TripExpensesPageStoryArgs = TripExpensesPageProps;

export const onStoryUpdateExpense = fn();
export const denseTrip = buildDenseTripFixture();
export const emptyTrip = buildEmptyTripFixture();

export const inferredScopeTrip = {
  ...tripFixture.trip,
  expenses: [
    {
      ...tripFixture.trip.expenses[0],
      tripPlanId: "plan-rain",
      itineraryItemId: null,
    },
  ],
};

export const expensesOwnerStoryArgs = {
  trip: tripFixture.trip,
  currentMember: tripFixture.currentMembers.owner,
  expenseSummary: tripFixture.expenseSummaries.owner,
  canEditExpenses: true,
  onCreateExpense: noop,
  onUpdateExpense: noop,
  onDeleteExpense: noop,
} satisfies TripExpensesPageStoryArgs;

export const expensesTravelerStoryArgs = {
  ...expensesOwnerStoryArgs,
  currentMember: tripFixture.currentMembers.traveler,
  expenseSummary: tripFixture.expenseSummaries.traveler,
} satisfies TripExpensesPageStoryArgs;

export const expensesViewerStoryArgs = {
  ...expensesOwnerStoryArgs,
  currentMember: tripFixture.currentMembers.viewer,
  expenseSummary: tripFixture.expenseSummaries.viewer,
  canEditExpenses: false,
} satisfies TripExpensesPageStoryArgs;

export const denseExpenseSummary = buildExpenseSummary(
  denseTrip.expenses,
  denseTrip.members[0].id,
);

export const emptyExpenseSummary = buildExpenseSummary(
  emptyTrip.expenses,
  tripFixture.currentMembers.owner.id,
);

export const inferredScopeExpenseSummary = buildExpenseSummary(
  inferredScopeTrip.expenses,
  tripFixture.currentMembers.owner.id,
);

export const denseExpensesStoryArgs = {
  ...expensesOwnerStoryArgs,
  trip: denseTrip,
  currentMember: denseTrip.members[0],
  expenseSummary: denseExpenseSummary,
} satisfies TripExpensesPageStoryArgs;

export const emptyExpensesStoryArgs = {
  ...expensesOwnerStoryArgs,
  trip: emptyTrip,
  expenseSummary: emptyExpenseSummary,
} satisfies TripExpensesPageStoryArgs;

export const planScopeAuditExpensesStoryArgs = {
  ...expensesOwnerStoryArgs,
  trip: inferredScopeTrip,
  expenseSummary: inferredScopeExpenseSummary,
  onUpdateExpense: onStoryUpdateExpense,
} satisfies TripExpensesPageStoryArgs;

export async function expectExpensesResponsiveContract(canvasElement: HTMLElement) {
  const canvas = within(canvasElement);
  await expect(canvas.getByRole("region", { name: /Trip money|เงินทริป/i })).toHaveClass("expenses-page");
  await expect(canvas.getByRole("region", { name: /Money summary|สรุปเงิน/i })).toBeVisible();
  await expect(canvas.getByRole("table", { name: /Expense ledger|รายการค่าใช้จ่าย/i })).toHaveClass("expense-ledger-table");
}
