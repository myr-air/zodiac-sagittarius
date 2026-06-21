import { describe, expect, it } from "vitest";
import { seedTrip } from "@/src/trip/seed";
import type { Expense } from "@/src/trip/types";
import { calculateExpenseDialogState } from "./expense-dialog-calculation";
import { buildExpenseDialogSubmitInput } from "./expense-dialog-submit-input";

const members = seedTrip.members.filter((member) => member.id !== "member-viewer").slice(0, 2);

describe("expense dialog submit input", () => {
  it("builds submit input from calculated dialog state", () => {
    const calculatedState = calculateExpenseDialogState({
      amount: "40",
      currency: "CNY",
      exchangeRate: "1.08",
      expense: null,
      lineItems: [],
      members,
      repeatCount: "3",
      settlementCurrency: "HKD",
      splitMode: "equal",
      splitValues: {},
    });

    expect(
      buildExpenseDialogSubmitInput({
        calculatedState,
        category: "food",
        comments: [],
        effectiveTripPlanId: "plan-main",
        expense: null,
        itemId: "item-dinner",
        notes: "  Pay cash  ",
        paidBy: members[0].id,
        receiptUrl: "  https://receipt.example  ",
        splitMode: "equal",
        title: "  Dinner  ",
      }),
    ).toMatchObject({
      itemId: "item-dinner",
      tripPlanId: "plan-main",
      title: "Dinner",
      amount: 40,
      currency: "CNY",
      exchangeRateToSettlementCurrency: 1.08,
      notes: "Pay cash",
      receiptUrl: "https://receipt.example",
      repeatCount: 3,
      paidBy: members[0].id,
      category: "food",
      splits: {
        [members[0].id]: 20,
        [members[1].id]: 20,
      },
    });
  });

  it("keeps update submit input single-instance and includes valid itemized lines", () => {
    const calculatedState = calculateExpenseDialogState({
      amount: "12",
      currency: "HKD",
      exchangeRate: "1",
      expense: { id: "expense-existing" } as Expense,
      lineItems: [
        { id: "line-tea", title: "Tea", amount: "12", participantIds: members.map((member) => member.id) },
      ],
      members,
      repeatCount: "3",
      settlementCurrency: "HKD",
      splitMode: "itemized",
      splitValues: {},
    });

    expect(
      buildExpenseDialogSubmitInput({
        calculatedState,
        category: "food",
        comments: [{ id: "comment-1", authorId: members[0].id, body: "Shared", createdAt: "2026-06-01T00:00:00Z" }],
        effectiveTripPlanId: "",
        expense: { id: "expense-existing" } as Expense,
        itemId: "",
        notes: "",
        paidBy: members[0].id,
        receiptUrl: "",
        splitMode: "itemized",
        title: "Tea",
      }),
    ).toMatchObject({
      itemId: null,
      tripPlanId: null,
      exchangeRateToSettlementCurrency: 1,
      comments: [{ id: "comment-1" }],
      lineItems: [{ id: "line-tea", title: "Tea", amount: 12 }],
    });
  });
});
