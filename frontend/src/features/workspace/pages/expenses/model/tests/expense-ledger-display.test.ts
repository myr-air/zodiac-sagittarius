import { describe, expect, it } from "vitest";
import type { Expense, Member } from "@/src/trip/types";
import {
  expenseLedgerPayerDisplay,
  expenseLedgerRowDisplay,
} from "../expense-ledger-display";

function buildExpense(overrides: Partial<Expense> = {}): Expense {
  return {
    amount: 90,
    category: "food",
    currency: "HKD",
    id: "expense-food",
    itineraryItemId: null,
    paidBy: "member-aom",
    splits: {
      "member-aom": 30,
      "member-beam": 30,
      "member-nam": 30,
    },
    title: "Dinner",
    tripId: "trip",
    ...overrides,
  };
}

const members: Member[] = [
  {
    color: "#2563eb",
    displayName: "Aom",
    id: "member-aom",
    presence: "online",
    role: "owner",
  },
  {
    color: "#0f766e",
    displayName: "Beam",
    id: "member-beam",
    presence: "online",
    role: "organizer",
  },
  {
    color: "#f97316",
    displayName: "Nam",
    id: "member-nam",
    presence: "away",
    role: "traveler",
  },
];

describe("expense ledger display", () => {
  it("formats row amount and split total with expense currency", () => {
    expect(
      expenseLedgerRowDisplay(
        buildExpense({
          splits: {
            "member-aom": 90,
          },
        }),
        "THB",
      ),
    ).toEqual({
      amountLabel: "HK$90.00",
      canRecordRefund: false,
      splitTotalLabel: "HK$90.00",
    });
  });

  it("falls back to settlement currency and enables refunds only for positive refundable expenses", () => {
    expect(
      expenseLedgerRowDisplay(
        buildExpense({
          currency: undefined,
          splits: {
            "member-aom": 20,
            "member-beam": 20,
          },
        }),
        "THB",
      ),
    ).toEqual({
      amountLabel: "฿90.00",
      canRecordRefund: true,
      splitTotalLabel: "฿40.00",
    });
    expect(
      expenseLedgerRowDisplay(
        buildExpense({
          category: "settlement",
          splits: {
            "member-aom": 20,
          },
        }),
        "HKD",
      ).canRecordRefund,
    ).toBe(false);
  });

  it("builds payer display details from trip members", () => {
    expect(expenseLedgerPayerDisplay({
      members,
      paidBy: "member-aom",
    })).toEqual({
      color: "#2563eb",
      name: "Aom",
    });
    expect(expenseLedgerPayerDisplay({
      members,
      paidBy: "member-missing",
    })).toBeNull();
  });

  it("shows original, settlement, display-currency, source, and per-member math", () => {
    expect(
      expenseLedgerRowDisplay(
        buildExpense({
          amount: 100,
          currency: "HKD",
          exchangeRateToSettlementCurrency: 4.5,
          lineItems: [
            {
              id: "line-noodles",
              title: "Noodles",
              amount: 60,
              participantIds: ["member-aom", "member-beam"],
            },
          ],
          paidBy: "member-aom",
          splits: {
            "member-aom": 40,
            "member-beam": 60,
          },
        }),
        "THB",
        {
          displayCurrency: "USD",
          displayExchangeRate: 0.03,
          members,
        },
      ),
    ).toEqual(expect.objectContaining({
      amountLabel: "HK$100.00",
      calculationLabel: "Paid in HKD. Trip amount is ฿450.00. Shown as US$13.50.",
      displayAmountLabel: "US$13.50",
      memberBreakdown: [
        "Aom gets back ฿270.00",
        "Beam pays ฿270.00",
        "Nam is settled",
      ],
      settlementAmountLabel: "฿450.00",
      sourceLabel: "Built from receipt items: Noodles",
    }));
  });
});
