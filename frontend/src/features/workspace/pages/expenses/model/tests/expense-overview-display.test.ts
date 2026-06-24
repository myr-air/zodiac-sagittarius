import { describe, expect, it } from "vitest";
import {
  categorySpendDisplay,
  categorySpendAmountLabel,
  type ExpenseBalanceCopy,
  type ExpenseReminderCopy,
  expenseMemberBalanceDisplay,
  settlementReminderLabel,
  settlementSuggestionDisplay,
  settlementSuggestionLabel,
  scopeAuditExpenseDisplay,
} from "../expense-overview-display";

const balanceCopy: ExpenseBalanceCopy = {
  owed: ({ amount, name }) => `${name} is owed ${amount}`,
  owes: ({ amount, name }) => `${name} owes ${amount}`,
  payback: ({ amount, from, to }) => `${from} pays ${to} ${amount}`,
  settled: ({ name }) => `${name} is settled`,
};
const reminderCopy: ExpenseReminderCopy = {
  lastSent: ({ date }) => `Last sent ${date}`,
};

describe("expense overview display", () => {
  it("builds member balance descriptions and amount tone", () => {
    expect(
      expenseMemberBalanceDisplay({
        balanceCopy,
        memberName: "Aom",
        net: 120,
        settlementCurrency: "HKD",
      }),
    ).toEqual({
      amountLabel: "HK$120.00",
      description: "Aom is owed HK$120.00",
      tone: "positive",
    });
    expect(
      expenseMemberBalanceDisplay({
        balanceCopy,
        memberName: "Beam",
        net: -45,
        settlementCurrency: "HKD",
      }),
    ).toEqual({
      amountLabel: "-HK$45.00",
      description: "Beam owes HK$45.00",
      tone: "negative",
    });
    expect(
      expenseMemberBalanceDisplay({
        balanceCopy,
        memberName: "Nam",
        net: 0,
        settlementCurrency: "HKD",
      }),
    ).toEqual({
      amountLabel: "HK$0.00",
      description: "Nam is settled",
      tone: "neutral",
    });
  });

  it("builds settlement labels with suggestion currency fallback", () => {
    expect(
      settlementSuggestionLabel({
        balanceCopy,
        fromName: "Beam",
        settlementCurrency: "HKD",
        suggestion: { amount: 20, currency: "CNY" },
        toName: "Aom",
      }),
    ).toBe("Beam pays Aom CN¥20.00");
    expect(
      settlementSuggestionLabel({
        balanceCopy,
        fromName: "Beam",
        settlementCurrency: "HKD",
        suggestion: { amount: 20 },
        toName: "Aom",
      }),
    ).toBe("Beam pays Aom HK$20.00");
  });

  it("builds settlement row display from members with id fallbacks", () => {
    expect(settlementSuggestionDisplay({
      balanceCopy,
      locale: "en",
      members: [
        { color: "#0f766e", displayName: "Aom", id: "member-aom", presence: "online", role: "owner" },
      ],
      reminderCopy,
      settlementCurrency: "HKD",
      suggestion: {
        amount: 35,
        currency: "CNY",
        from: "member-beam",
        lastRemindedAt: "2025-06-01T00:00:00.000Z",
        to: "member-aom",
      },
    })).toEqual({
      label: "member-beam pays Aom CN¥35.00",
      lastReminderLabel: "Last sent Jun 1, 2025, 07:00 AM",
    });
  });

  it("formats category spend and reminder labels", () => {
    expect(categorySpendAmountLabel({
      amount: 48,
      settlementCurrency: "HKD",
    })).toBe("HK$48.00");
    expect(settlementReminderLabel({
      locale: "en",
      remindedAt: "2025-06-01T00:00:00.000Z",
      reminderCopy,
    })).toBe("Last sent Jun 1, 2025, 07:00 AM");
  });

  it("builds category spend row display with the shared category tone", () => {
    expect(categorySpendDisplay({
      amount: 48,
      category: "food",
      settlementCurrency: "HKD",
    })).toEqual({
      amountLabel: "HK$48.00",
      category: "food",
      tone: {
        background: "#fff7ed",
        border: "#fed7aa",
        dot: "#f97316",
        text: "#9a3412",
      },
    });
  });

  it("builds scope audit row display from the linked trip plan", () => {
    expect(scopeAuditExpenseDisplay({
      expense: {
        amount: 10,
        category: "transport",
        id: "expense-taxi",
        itineraryItemId: null,
        paidBy: "member-aom",
        splits: {},
        title: "Taxi",
        tripId: "trip-demo",
        tripPlanId: "plan-b",
      },
      trip: {
        activePlanVariantId: "plan-b",
        destinationLabel: "Hong Kong",
        endDate: "2026-06-21",
        expenses: [],
        id: "trip-demo",
        itineraryItems: [],
        joinId: "TRIP",
        joinPasswordHash: "hash",
        members: [],
        name: "Demo trip",
        planVariants: [
          { description: "Backup route", id: "plan-b", kind: "backup", name: "Plan B", tripId: "trip-demo" },
        ],
        startDate: "2026-06-20",
        tripPlans: [
          { description: "Backup route", id: "plan-b", kind: "backup", name: "Plan B", tripId: "trip-demo" },
        ],
      },
    })).toEqual({
      id: "expense-taxi",
      title: "Taxi",
      tripPlanName: "Plan B",
    });
  });
});
