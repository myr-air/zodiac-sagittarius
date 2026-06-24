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
      dateLabel: "No linked day",
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
