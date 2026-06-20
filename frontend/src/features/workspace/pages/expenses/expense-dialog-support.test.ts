import { afterEach, describe, expect, it, vi } from "vitest";
import { seedTrip } from "@/src/trip/seed";
import type { Expense } from "@/src/trip/types";
import {
  calculateExpenseDialogState,
  canSubmitExpenseDialog,
  emptyExpenseLineItem,
  expenseSplitValuesForMode,
  initialExpenseLineItems,
  initialExpenseSplitValues,
  initialExpenseTripPlanId,
  parseExpenseLineItems,
  validExpenseLineItems,
} from "./expense-dialog-support";

const members = seedTrip.members.filter((member) => member.id !== "member-viewer").slice(0, 2);

describe("expense dialog support helpers", () => {
  afterEach(() => {
    vi.restoreAllMocks();
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
    vi.spyOn(Date, "now").mockReturnValue(123456);

    expect(emptyExpenseLineItem(members, 2)).toEqual({
      id: "line-2n9c-2",
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

  it("parses and filters itemized lines for split calculations", () => {
    const parsed = parseExpenseLineItems([
      { id: "", title: "  Taxi  ", amount: "15.5", participantIds: [members[0].id] },
      { id: "line-empty", title: "  ", amount: "10", participantIds: [members[0].id] },
      { id: "line-zero", title: "Snack", amount: "0", participantIds: [members[0].id] },
      { id: "line-none", title: "Tea", amount: "4", participantIds: [] },
    ]);

    expect(parsed[0]).toEqual({
      id: "line-1",
      title: "Taxi",
      amount: 15.5,
      participantIds: [members[0].id],
    });
    expect(validExpenseLineItems(parsed)).toEqual([parsed[0]]);
  });

  it("calculates split totals and mismatches from editable split values", () => {
    const calculated = calculateExpenseDialogState({
      amount: "30",
      currency: "hkd",
      exchangeRate: "1",
      expense: null,
      lineItems: [],
      members,
      repeatCount: "1",
      settlementCurrency: "HKD",
      splitMode: "exact",
      splitValues: {
        [members[0].id]: "10",
        [members[1].id]: "15",
      },
    });

    expect(calculated.normalizedCurrency).toBe("HKD");
    expect(calculated.splitTotal).toBe(25);
    expect(calculated.splitMismatch).toBe(true);
    expect(calculated.splits).toEqual({
      [members[0].id]: 10,
      [members[1].id]: 15,
    });
  });

  it("validates foreign exchange rates and repeat counts", () => {
    const calculated = calculateExpenseDialogState({
      amount: "10",
      currency: "CNY",
      exchangeRate: "0",
      expense: null,
      lineItems: [],
      members,
      repeatCount: "32",
      settlementCurrency: "HKD",
      splitMode: "equal",
      splitValues: {},
    });

    expect(calculated.needsExchangeRate).toBe(true);
    expect(calculated.hasValidExchangeRate).toBe(false);
    expect(calculated.hasValidRepeatCount).toBe(false);
  });

  it("flags invalid itemized lines while keeping valid line-item splits", () => {
    const calculated = calculateExpenseDialogState({
      amount: "12",
      currency: "HKD",
      exchangeRate: "1",
      expense: null,
      lineItems: [
        { id: "line-tea", title: "Tea", amount: "12", participantIds: members.map((member) => member.id) },
        { id: "line-empty", title: "", amount: "4", participantIds: [members[0].id] },
      ],
      members,
      repeatCount: "1",
      settlementCurrency: "HKD",
      splitMode: "itemized",
      splitValues: {},
    });

    expect(calculated.validLineItems).toHaveLength(1);
    expect(calculated.invalidItemizedLines).toBe(true);
    expect(calculated.splitMismatch).toBe(false);
    expect(calculated.splits).toEqual({
      [members[0].id]: 6,
      [members[1].id]: 6,
    });
  });

  it("uses one guard for submit readiness", () => {
    const state = calculateExpenseDialogState({
      amount: "20",
      currency: "HKD",
      exchangeRate: "1",
      expense: null,
      lineItems: [],
      members,
      repeatCount: "1",
      settlementCurrency: "HKD",
      splitMode: "equal",
      splitValues: {},
    });

    expect(canSubmitExpenseDialog({ isSaving: false, state, title: "Hotel" })).toBe(true);
    expect(canSubmitExpenseDialog({ isSaving: true, state, title: "Hotel" })).toBe(false);
    expect(canSubmitExpenseDialog({ isSaving: false, state, title: " " })).toBe(false);
  });

});
