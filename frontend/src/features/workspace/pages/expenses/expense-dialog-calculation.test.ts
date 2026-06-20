import { describe, expect, it } from "vitest";
import { seedTrip } from "@/src/trip/seed";
import {
  calculateExpenseDialogState,
  canSubmitExpenseDialog,
} from "./expense-dialog-support";

const members = seedTrip.members.filter((member) => member.id !== "member-viewer").slice(0, 2);

describe("expense dialog calculated state", () => {
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
