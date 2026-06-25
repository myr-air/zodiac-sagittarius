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
  canCreateExpenses: true,
  canEditExpenses: true,
  onCreateExpense: noop,
  onUpdateExpense: noop,
  onDeleteExpense: noop,
} satisfies TripExpensesPageStoryArgs;

export const expensesTravelerStoryArgs = {
  ...expensesOwnerStoryArgs,
  currentMember: travelerStoryMember,
  expenseSummary: storyExpenseSummaries.traveler,
  canCreateExpenses: true,
  canEditExpenses: false,
} satisfies TripExpensesPageStoryArgs;

export const expensesViewerStoryArgs = {
  ...expensesOwnerStoryArgs,
  currentMember: viewerStoryMember,
  expenseSummary: storyExpenseSummaries.viewer,
  canCreateExpenses: false,
  canEditExpenses: false,
} satisfies TripExpensesPageStoryArgs;

export const denseExpenseSummary = buildExpenseSummary(
  denseTrip.expenses,
  denseTrip.members[0].id,
);

export const longNameMobileTrip = {
  ...storyTrip,
  members: storyTrip.members.map((member, index) => ({
    ...member,
    displayName: [
      "Nattaporn Sirirattanakul Long Passport Name",
      "Benjamin Alexander Montgomery-Wong",
      "ศศิธร วงศ์วัฒนากุล ชื่อยาวมาก",
      "Family viewer with extra long label",
    ][index] ?? member.displayName,
  })),
};

export const longExpenseOverflowTrip = {
  ...storyTrip,
  expenses: storyTrip.expenses.map((expense, index) => index === 0
    ? {
        ...expense,
        title: "Airport Express family pass plus Octopus reload reimbursement with extremely long receipt title",
        amount: 1234567.89,
      }
    : expense),
};

export const itemizedHeavyTrip = {
  ...longNameMobileTrip,
  expenses: [
    {
      ...longNameMobileTrip.expenses[0],
      title: "Night market itemized receipt with many friends",
      lineItems: Array.from({ length: 8 }, (_, index) => ({
        id: `heavy-line-${index + 1}`,
        title: `Shared snack bundle ${index + 1}`,
        amount: 80 + index * 12,
        participantIds: longNameMobileTrip.members
          .filter((member) => member.role !== "viewer")
          .map((member) => member.id),
      })),
    },
    ...longNameMobileTrip.expenses.slice(1),
  ],
};

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

export const denseLongNamesMobileStoryArgs = {
  ...expensesOwnerStoryArgs,
  trip: longNameMobileTrip,
  currentMember: longNameMobileTrip.members[0],
  expenseSummary: buildExpenseSummary(
    longNameMobileTrip.expenses,
    longNameMobileTrip.members[0].id,
  ),
} satisfies TripExpensesPageStoryArgs;

export const longExpenseOverflowStoryArgs = {
  ...expensesOwnerStoryArgs,
  trip: longExpenseOverflowTrip,
  expenseSummary: buildExpenseSummary(
    longExpenseOverflowTrip.expenses,
    ownerStoryMember.id,
  ),
} satisfies TripExpensesPageStoryArgs;

export const itemizedHeavyStoryArgs = {
  ...expensesOwnerStoryArgs,
  trip: itemizedHeavyTrip,
  currentMember: itemizedHeavyTrip.members[0],
  expenseSummary: buildExpenseSummary(
    itemizedHeavyTrip.expenses,
    itemizedHeavyTrip.members[0].id,
  ),
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
  const accountTab = canvas.queryByRole("tab", { name: /Statement & tools|รายการและเครื่องมือ/i });
  if (accountTab) {
    await userEvent.click(accountTab);
    const statementTable = canvas.queryByRole("table", { name: /Detailed trip money statement|รายการเงินทริปแบบละเอียด/i });
    if (statementTable) {
      await expect(statementTable).toHaveClass("expense-statement-table");
    } else {
      await expect(canvasElement.querySelector(".expense-statement")).not.toBeNull();
    }
  }
  const spendingTab = canvas.queryByRole("tab", { name: /Manage expenses|จัดการค่าใช้จ่าย/i });
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
