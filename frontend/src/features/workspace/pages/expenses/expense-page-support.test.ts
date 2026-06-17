import { describe, expect, it } from "vitest";
import { seedTrip } from "@/src/trip/seed";
import type { Expense } from "@/src/trip/types";
import {
  categoryTone,
  formatExchangeRateInput,
  formatReminderDate,
  memberInitial,
  refundAmount,
  refundSplits,
  sumShares,
  tripPlanName,
} from "./expense-page-support";

describe("expense page support helpers", () => {
  it("formats member initials for compact avatars", () => {
    expect(memberInitial("  aom")).toBe("A");
    expect(memberInitial("")).toBe("?");
  });

  it("resolves Trip Plan names with fallbacks", () => {
    expect(tripPlanName(seedTrip, "plan-rain")).toBe("แผนฝนตก");
    expect(tripPlanName(seedTrip, "missing-plan")).toBe("missing-plan");
    expect(tripPlanName(seedTrip, null)).toBe("Unassigned");
  });

  it("keeps category tone values centralized for ledger badges", () => {
    expect(categoryTone("food")).toEqual({
      background: "#fff7ed",
      border: "#fed7aa",
      dot: "#f97316",
      text: "#9a3412",
    });
  });

  it("rounds split totals and builds refund-only splits", () => {
    const expense = {
      id: "expense-refund",
      title: "Refundable brunch",
      amount: 12.34,
      paidBy: "member-aom",
      category: "food",
      splits: {
        "member-aom": 12.34,
        "member-beam": 10.115,
        "member-nam": 0,
        "member-viewer": -5,
      },
    } satisfies Expense;

    expect(sumShares({ a: 1.005, b: 2.005 })).toBe(3.01);
    expect(refundSplits(expense)).toEqual({ "member-beam": 10.115 });
    expect(refundAmount(expense)).toBe(10.12);
  });

  it("formats reminder dates and keeps invalid values readable", () => {
    expect(formatReminderDate("not-a-date", "en")).toBe("not-a-date");
    expect(formatReminderDate("2026-06-18T12:30:00.000Z", "en")).toContain("2026");
    expect(formatReminderDate("2026-06-18T12:30:00.000Z", "th")).toContain("2026");
  });

  it("formats exchange rate inputs without noisy trailing precision", () => {
    expect(formatExchangeRateInput(1)).toBe("1");
    expect(formatExchangeRateInput(1.23456789)).toBe("1.234568");
  });
});
