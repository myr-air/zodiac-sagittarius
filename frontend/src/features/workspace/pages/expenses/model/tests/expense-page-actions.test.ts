import { describe, expect, it } from "vitest";
import { seedTrip } from "@/src/trip/seed";
import type { Expense } from "@/src/trip/types";
import {
  buildRefundExpenseInput,
  buildSettlementExpenseInput,
} from "../expense-page-actions";

describe("expense page action builders", () => {
  it("builds a settlement expense input from a payback suggestion", () => {
    expect(
      buildSettlementExpenseInput({
        members: seedTrip.members,
        settlementCurrency: "HKD",
        suggestion: {
          from: "member-beam",
          to: "member-aom",
          amount: 42.5,
        },
        trip: seedTrip,
      }),
    ).toMatchObject({
      itemId: null,
      title: "Travel Mate paid Demo Traveler back",
      amount: 42.5,
      currency: "HKD",
      paidBy: "member-beam",
      category: "settlement",
      splits: { "member-aom": 42.5 },
      settlementAllocations: [{
        expenseId: "expense-dimsum",
        memberId: "member-beam",
        amount: 42.5,
      }],
    });
  });

  it("builds refund settlement input from positive non-payer shares", () => {
    const expense = {
      id: "expense-refundable",
      itineraryItemId: "item-dinner",
      title: "Dinner",
      amount: 80,
      currency: "CNY",
      exchangeRateToSettlementCurrency: 1.1,
      paidBy: "member-aom",
      category: "food",
      splits: {
        "member-aom": 40,
        "member-beam": 20.125,
        "member-nam": 0,
      },
    } satisfies Expense;

    expect(
      buildRefundExpenseInput({
        expense,
        selectedTripPlanId: "plan-rain",
        settlementCurrency: "HKD",
      }),
    ).toEqual({
      itemId: "item-dinner",
      tripPlanId: "plan-rain",
      title: "Refund: Dinner",
      amount: 20.13,
      currency: "CNY",
      exchangeRateToSettlementCurrency: 1.1,
      notes: "Refund settlement for actual expense: Dinner",
      paidBy: "member-aom",
      category: "settlement",
      splits: { "member-beam": 20.125 },
      settlementAllocations: [{
        expenseId: "expense-refundable",
        memberId: "member-beam",
        amount: 20.125,
      }],
    });
  });

  it("does not allocate a new settlement to already-covered expenses", () => {
    expect(
      buildSettlementExpenseInput({
        members: seedTrip.members,
        settlementCurrency: "HKD",
        suggestion: {
          from: "member-beam",
          to: "member-aom",
          amount: 78,
        },
        trip: seedTrip,
      }).settlementAllocations,
    ).toEqual([{
      expenseId: "expense-dimsum",
      memberId: "member-beam",
      amount: 78,
    }]);
  });

  it("returns null when there is no refundable share", () => {
    expect(
      buildRefundExpenseInput({
        expense: {
          id: "expense-paid-only",
          title: "Deposit",
          amount: 40,
          paidBy: "member-aom",
          category: "stay",
          splits: { "member-aom": 40 },
        },
        settlementCurrency: "HKD",
      }),
    ).toBeNull();
  });
});
