import { afterEach, describe, expect, it, vi } from "vitest";
import { seedTrip } from "@/src/trip/seed";
import type { Expense } from "@/src/trip/types";
import {
  emptyExpenseLineItem,
  initialExpenseLineItems,
} from "../expense-dialog-line-items";
import {
  expenseSplitValuesForMode,
  initialExpenseDialogFields,
  initialExpenseSplitValues,
  initialExpenseTripPlanId,
} from "../expense-dialog-initial-state";

const members = seedTrip.members.filter((member) => member.id !== "member-viewer").slice(0, 2);

describe("expense dialog initial state helpers", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("builds primitive form fields for a new expense", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-25T04:30:00.000Z"));

    expect(
      initialExpenseDialogFields({
        currentMemberId: members[0].id,
        expense: null,
      }),
    ).toEqual({
      amount: "",
      category: "transport",
      currency: "HKD",
      exchangeRate: "1",
      exchangeRateTouched: false,
      itemId: "",
      notes: "",
      paidBy: members[0].id,
      repeatCount: "1",
      receiptUrl: "",
      spentOn: "2026-06-25",
      title: "",
    });
  });

  it("builds primitive form fields from an existing expense", () => {
    expect(
      initialExpenseDialogFields({
        currentMemberId: members[0].id,
        expense: {
          amount: 42.5,
          category: "food",
          currency: " usd ",
          exchangeRateToSettlementCurrency: 7.82,
          id: "expense-edit",
          itineraryItemId: "item-dinner",
          notes: "Bring receipt",
          paidBy: members[1].id,
          receiptUrl: "https://receipts.example/test",
          spentOn: "2026-06-20",
          title: "Dinner",
        } as Expense,
      }),
    ).toMatchObject({
      amount: "42.5",
      category: "food",
      currency: "USD",
      exchangeRate: "7.82",
      exchangeRateTouched: true,
      itemId: "item-dinner",
      notes: "Bring receipt",
      paidBy: members[1].id,
      repeatCount: "1",
      receiptUrl: "https://receipts.example/test",
      spentOn: "2026-06-20",
      title: "Dinner",
    });
  });

  it("creates editable line items with current members only", () => {
    const expense = {
      id: "expense-line",
      lineItems: [
        {
          id: "line-1",
          title: "Bao",
          amount: 12,
          participantIds: [members[0].id, "removed-member"],
        },
      ],
      splits: {},
    } as Expense;

    expect(initialExpenseLineItems(expense, members)).toEqual([
      {
        id: "line-1",
        title: "Bao",
        amount: "12",
        participantIds: [members[0].id],
      },
    ]);
  });

  it("creates blank line item and split values from member lists", () => {
    expect(emptyExpenseLineItem(members)).toEqual({
      id: "line-local-1",
      title: "",
      amount: "",
      participantIds: members.map((member) => member.id),
    });
    expect(initialExpenseSplitValues(members, null)).toEqual({
      [members[0].id]: "0",
      [members[1].id]: "0",
    });
    expect(expenseSplitValuesForMode(members, "1")).toEqual({
      [members[0].id]: "1",
      [members[1].id]: "1",
    });
    expect(
      emptyExpenseLineItem(members, [
        { id: "line-local-1", title: "", amount: "", participantIds: [] },
        { id: "line-local-3", title: "", amount: "", participantIds: [] },
      ]),
    ).toEqual(expect.objectContaining({ id: "line-local-4" }));
  });

  it("resolves initial trip plan from expense, selected plan, and trip defaults", () => {
    expect(initialExpenseTripPlanId({
      expense: { id: "expense-plan", tripPlanId: "plan-expense" } as Expense,
      selectedTripPlanId: "plan-selected",
      trip: seedTrip,
    })).toBe("plan-expense");
    expect(initialExpenseTripPlanId({
      expense: null,
      selectedTripPlanId: "plan-selected",
      trip: seedTrip,
    })).toBe("plan-selected");
    expect(initialExpenseTripPlanId({
      expense: null,
      trip: seedTrip,
    })).toBe(seedTrip.activePlanVariantId);
  });
});
