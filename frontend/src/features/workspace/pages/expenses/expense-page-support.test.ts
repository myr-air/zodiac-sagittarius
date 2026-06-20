import { describe, expect, it } from "vitest";
import { seedTrip } from "@/src/trip/seed";
import {
  categoryTone,
  expenseCategoryFilterValues,
  formatExchangeRateInput,
  formatReminderDate,
  memberInitial,
  tripPlanName,
} from "./expense-page-support";

describe("expense page support helpers", () => {
  it("keeps category filters aligned with expense categories", () => {
    expect(expenseCategoryFilterValues).toEqual([
      "all",
      "food",
      "transport",
      "tickets",
      "stay",
      "shopping",
      "settlement",
    ]);
  });

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
