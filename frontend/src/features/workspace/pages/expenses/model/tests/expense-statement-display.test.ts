import { describe, expect, it } from "vitest";
import { enExpensesMessages } from "@/src/i18n/messages/en.expenses";
import { seedTrip } from "@/src/trip/seed";
import type { Expense } from "@/src/trip/types";
import { expenseStatementRows, expenseStatementStatus } from "../expense-statement-display";

const copy = {
  categories: enExpensesMessages.categories,
  dateFallback: enExpensesMessages.statement.dateFallback,
  linkedStopFallback: enExpensesMessages.uncategorizedStop,
  recordSourceLedger: enExpensesMessages.statement.recordSource.ledger,
  recordSourceSettlement: enExpensesMessages.statement.recordSource.settlement,
  splitMembers: enExpensesMessages.statement.splitMembers,
  splitSingle: enExpensesMessages.statement.splitSingle,
  status: enExpensesMessages.statement.status,
  statusReason: enExpensesMessages.statement.statusReason,
  statusShortReason: enExpensesMessages.statement.statusShortReason,
  type: enExpensesMessages.statement.type,
};

describe("expense statement display", () => {
  it("derives readable rows without claiming unproven settlement", () => {
    const rows = expenseStatementRows({
      copy,
      displayCurrency: "THB",
      displayExchangeRate: 4.62,
      locale: "en",
      settlementCurrency: "HKD",
      trip: seedTrip,
    });

    expect(rows.find((row) => row.id === "expense-airport-express")).toMatchObject({
      dateLabel: "Day 1 · 2026-06-18",
      paidByLabel: "Travel Mate",
      recordSourceLabel: "Ledger entry",
      status: "needsReview",
      statusLabel: "Review",
      typeLabel: "Spend",
    });
    expect(rows.find((row) => row.id === "expense-beam-paid-aom")).toMatchObject({
      dateLabel: "Day 3 · 2026-06-20",
      recordSourceLabel: "Settlement record",
      status: "settlementRecorded",
      statusLabel: "Settled record",
      typeLabel: "Settlement",
    });
    expect(rows.find((row) => row.id === "expense-pacific-place-personal")).toMatchObject({
      splitLabel: "Demo Traveler only",
      status: "noPaybackNeeded",
    });
    expect(rows.find((row) => row.id === "expense-shenzhen-hotel")?.amountLabel).toBe("CN¥960.00");
    expect(rows.find((row) => row.id === "expense-shenzhen-hotel")?.displayAmountLabel).toBe("฿22,397.76");
  });

  it("uses spentOn when a ledger row is not linked to an itinerary day", () => {
    const rows = expenseStatementRows({
      copy,
      displayCurrency: "HKD",
      displayExchangeRate: 1,
      locale: "en",
      settlementCurrency: "HKD",
      trip: {
        ...seedTrip,
        expenses: [
          {
            id: "unlinked-coffee",
            title: "Unlinked coffee",
            amount: 42,
            paidBy: "member-beam",
            spentOn: "2026-06-21",
            splits: { "member-beam": 42 },
            category: "food",
          },
        ],
      },
    });

    expect(rows[0]).toMatchObject({
      dateLabel: "Day 4 · 2026-06-21",
      title: "Unlinked coffee",
    });
  });

  it("uses the inferred source receipt day for lump settlement rows without explicit allocations", () => {
    const rows = expenseStatementRows({
      copy,
      displayCurrency: "HKD",
      displayExchangeRate: 1,
      locale: "en",
      settlementCurrency: "HKD",
      trip: {
        ...seedTrip,
        expenses: [
          {
            id: "friend-dinner",
            title: "Friend dinner",
            amount: 100,
            paidBy: "member-aom",
            spentOn: "2026-06-19",
            splits: { "member-beam": 100 },
            category: "food",
          },
          {
            id: "lump-payback",
            title: "Beam lump payback",
            amount: 100,
            paidBy: "member-beam",
            splits: { "member-aom": 100 },
            category: "settlement",
          },
        ],
      },
    });

    expect(rows.find((row) => row.id === "lump-payback")).toMatchObject({
      dateLabel: "Day 2 · 2026-06-19",
      title: "Beam lump payback",
    });
  });

  it("consumes earlier inferred lump settlements before assigning later settlement days", () => {
    const rows = expenseStatementRows({
      copy,
      displayCurrency: "HKD",
      displayExchangeRate: 1,
      locale: "en",
      settlementCurrency: "HKD",
      trip: {
        ...seedTrip,
        expenses: [
          {
            id: "day-two-dinner",
            title: "Day two dinner",
            amount: 100,
            paidBy: "member-aom",
            spentOn: "2026-06-19",
            splits: { "member-beam": 100 },
            category: "food",
          },
          {
            id: "day-three-hotel",
            title: "Day three hotel",
            amount: 100,
            paidBy: "member-aom",
            spentOn: "2026-06-20",
            splits: { "member-beam": 100 },
            category: "stay",
          },
          {
            id: "first-lump-payback",
            title: "First lump payback",
            amount: 100,
            paidBy: "member-beam",
            splits: { "member-aom": 100 },
            category: "settlement",
          },
          {
            id: "second-lump-payback",
            title: "Second lump payback",
            amount: 100,
            paidBy: "member-beam",
            splits: { "member-aom": 100 },
            category: "settlement",
          },
        ],
      },
    });

    expect(rows.find((row) => row.id === "first-lump-payback")).toMatchObject({
      dateLabel: "Day 2 · 2026-06-19",
    });
    expect(rows.find((row) => row.id === "second-lump-payback")).toMatchObject({
      dateLabel: "Day 3 · 2026-06-20",
    });
  });

  it("seeds inferred settlement days from earlier explicit allocation coverage", () => {
    const rows = expenseStatementRows({
      copy,
      displayCurrency: "HKD",
      displayExchangeRate: 1,
      locale: "en",
      settlementCurrency: "HKD",
      trip: {
        ...seedTrip,
        expenses: [
          {
            id: "day-two-dinner",
            title: "Day two dinner",
            amount: 100,
            paidBy: "member-aom",
            spentOn: "2026-06-19",
            splits: { "member-beam": 100 },
            category: "food",
          },
          {
            id: "day-three-hotel",
            title: "Day three hotel",
            amount: 100,
            paidBy: "member-aom",
            spentOn: "2026-06-20",
            splits: { "member-beam": 100 },
            category: "stay",
          },
          {
            id: "explicit-payback",
            title: "Explicit payback",
            amount: 100,
            paidBy: "member-beam",
            splits: { "member-aom": 100 },
            settlementAllocations: [
              { expenseId: "day-two-dinner", memberId: "member-beam", amount: 100 },
            ],
            category: "settlement",
          },
          {
            id: "later-lump-payback",
            title: "Later lump payback",
            amount: 100,
            paidBy: "member-beam",
            splits: { "member-aom": 100 },
            category: "settlement",
          },
        ],
      },
    });

    expect(rows.find((row) => row.id === "explicit-payback")).toMatchObject({
      dateLabel: "Day 2 · 2026-06-19",
    });
    expect(rows.find((row) => row.id === "later-lump-payback")).toMatchObject({
      dateLabel: "Day 3 · 2026-06-20",
    });
  });

  it("keeps inferred lump settlement days aligned to trip expense order instead of title order", () => {
    const rows = expenseStatementRows({
      copy,
      displayCurrency: "HKD",
      displayExchangeRate: 1,
      locale: "en",
      settlementCurrency: "HKD",
      trip: {
        ...seedTrip,
        expenses: [
          {
            id: "day-two-dinner",
            title: "Day two dinner",
            amount: 100,
            paidBy: "member-aom",
            spentOn: "2026-06-19",
            splits: { "member-beam": 100 },
            category: "food",
          },
          {
            id: "day-three-hotel",
            title: "Day three hotel",
            amount: 100,
            paidBy: "member-aom",
            spentOn: "2026-06-20",
            splits: { "member-beam": 100 },
            category: "stay",
          },
          {
            id: "z-first-in-entry-order",
            title: "Z first in entry order",
            amount: 100,
            paidBy: "member-beam",
            splits: { "member-aom": 100 },
            category: "settlement",
          },
          {
            id: "a-second-in-entry-order",
            title: "A second in entry order",
            amount: 100,
            paidBy: "member-beam",
            splits: { "member-aom": 100 },
            category: "settlement",
          },
        ],
      },
    });

    expect(rows.find((row) => row.id === "z-first-in-entry-order")).toMatchObject({
      dateLabel: "Day 2 · 2026-06-19",
    });
    expect(rows.find((row) => row.id === "a-second-in-entry-order")).toMatchObject({
      dateLabel: "Day 3 · 2026-06-20",
    });
  });

  it("keeps status mapping deterministic for money rows", () => {
    const base: Expense = {
      id: "expense-test",
      title: "Test",
      amount: 100,
      paidBy: "member-aom",
      splits: {
        "member-aom": 25,
        "member-beam": 75,
      },
      category: "food",
    };

    expect(expenseStatementStatus(base)).toBe("needsReview");
    expect(expenseStatementStatus({
      ...base,
      splits: {
        "member-aom": 100,
      },
    })).toBe("noPaybackNeeded");
    expect(expenseStatementStatus({
      ...base,
      category: "settlement",
    })).toBe("settlementRecorded");
  });
});
