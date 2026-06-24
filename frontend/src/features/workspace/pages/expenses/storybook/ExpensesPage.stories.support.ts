import { expect, fn, userEvent, within } from "storybook/test";
import { noop } from "@/src/testing/storybook-actions";
import { buildExpenseSummary } from "@/src/trip/expenses";
import {
  denseStoryTrip,
  emptyStoryTrip,
  ownerStoryMember,
  storyExpenseSummaries,
  storyTrip,
  travelerStoryMember,
  viewerStoryMember,
} from "@/src/trip/testing/fixtures/trip-story-fixtures";
import type { TripExpensesPageProps } from "../TripExpensesPage";

type TripExpensesPageStoryArgs = TripExpensesPageProps;

export const onStoryUpdateExpense = fn();
export const denseTrip = denseStoryTrip;
export const emptyTrip = emptyStoryTrip;

export const inferredScopeTrip = {
  ...storyTrip,
  expenses: [
    {
      ...storyTrip.expenses[0],
      tripPlanId: "plan-rain",
      itineraryItemId: null,
    },
  ],
};

export const expensesOwnerStoryArgs = {
  trip: storyTrip,
  currentMember: ownerStoryMember,
  expenseSummary: storyExpenseSummaries.owner,
  canEditExpenses: true,
  onCreateExpense: noop,
  onUpdateExpense: noop,
  onDeleteExpense: noop,
} satisfies TripExpensesPageStoryArgs;

export const expensesTravelerStoryArgs = {
  ...expensesOwnerStoryArgs,
  currentMember: travelerStoryMember,
  expenseSummary: storyExpenseSummaries.traveler,
} satisfies TripExpensesPageStoryArgs;

export const expensesViewerStoryArgs = {
  ...expensesOwnerStoryArgs,
  currentMember: viewerStoryMember,
  expenseSummary: storyExpenseSummaries.viewer,
  canEditExpenses: false,
} satisfies TripExpensesPageStoryArgs;

export const denseExpenseSummary = buildExpenseSummary(
  denseTrip.expenses,
  denseTrip.members[0].id,
);

export const emptyExpenseSummary = buildExpenseSummary(
  emptyTrip.expenses,
  ownerStoryMember.id,
);

export const inferredScopeExpenseSummary = buildExpenseSummary(
  inferredScopeTrip.expenses,
  ownerStoryMember.id,
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
  await expect(canvas.getByRole("tablist", { name: /Trip money sections|ส่วนการเงินของทริป/i })).toHaveClass("expense-finance-tabs");
  await expect(canvas.getByRole("region", { name: /Money summary|สรุปเงิน/i })).toBeVisible();
  await expect(canvasElement.querySelector(".expense-finance-tabs")).not.toBeNull();
  const statementTab = canvas.queryByRole("tab", { name: /Statement|รายการละเอียด/i });
  if (statementTab) {
    await userEvent.click(statementTab);
    const statementTable = canvas.queryByRole("table", { name: /Detailed trip money statement|รายการเงินทริปแบบละเอียด/i });
    if (statementTable) {
      await expect(statementTable).toHaveClass("expense-statement-table");
    } else {
      await expect(canvasElement.querySelector(".expense-statement")).not.toBeNull();
    }
  }
  const spendingTab = canvas.queryByRole("tab", { name: /Spending|รายการใช้จ่าย/i });
  if (spendingTab) {
    await userEvent.click(spendingTab);
  }
  const spendingLog = canvas.queryByRole("table", { name: /Spending log|บันทึกใช้จ่าย/i });
  if (spendingLog) {
    await expect(spendingLog).toHaveClass("expense-ledger-table");
  } else {
    const mobileLedger = canvasElement.querySelector(".expense-mobile-ledger");
    await expect(mobileLedger).not.toBeNull();
    if (mobileLedger) {
      await expect(mobileLedger).toBeVisible();
      const firstMobileExpense = mobileLedger.querySelector("button");
      if (firstMobileExpense) {
        await userEvent.click(firstMobileExpense);
        await expect(canvasElement.querySelector(".expense-transaction-detail")).toBeVisible();
        const detail = canvas.getByRole("dialog");
        await expect(within(detail).getByRole("button", { name: /Edit|แก้ไข/i })).toBeVisible();
        await userEvent.click(within(detail).getByRole("button", { name: /Close expense details|ปิดรายละเอียด/i }));
        await expect(canvasElement.querySelector(".expense-transaction-detail")).toBeNull();
      }
    }
  }
  await expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(document.documentElement.clientWidth);
}
