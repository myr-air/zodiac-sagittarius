import { describe, expect, it } from "vitest";
import {
  buildCreateExpenseRequest,
  buildPatchExpenseRequest,
} from "../../expenses";

describe("expense API requests", () => {
  it("builds create expense API requests from expense drafts", () => {
    expect(
      buildCreateExpenseRequest(
        {
          itemId: "item-lunch",
          title: "Dim sum lunch",
          amount: 120.45,
          currency: undefined,
          exchangeRateToSettlementCurrency: undefined,
          notes: undefined,
          receiptUrl: undefined,
          lineItems: undefined,
          comments: undefined,
          spentOn: "2026-06-20",
          storedValueCardId: "octopus",
          storedValueCardName: "Octopus",
          storedValueTransactionType: "topup",
          tripPlanId: "plan-draft",
          paidBy: "member-aom",
          category: "food",
          splits: { "member-aom": 60.23, "member-beam": 60.22 },
        },
        {
          clientMutationId: "expense-create-mutation",
          tripPlanId: "plan-resolved",
        },
      ),
    ).toEqual({
      clientMutationId: "expense-create-mutation",
      title: "Dim sum lunch",
      amountMinor: 12045,
      currency: "HKD",
      exchangeRateToSettlementCurrency: 1,
      notes: "",
      receiptUrl: null,
      lineItems: undefined,
      comments: [],
      spentOn: "2026-06-20",
      storedValueCardId: "octopus",
      storedValueCardName: "Octopus",
      storedValueTransactionType: "topup",
      tripPlanId: "plan-resolved",
      paidBy: "member-aom",
      category: "food",
      splits: { "member-aom": 6023, "member-beam": 6022 },
      itineraryItemId: "item-lunch",
    });
  });

  it("builds patch expense API requests from update drafts", () => {
    expect(
      buildPatchExpenseRequest(
        {
          expenseId: "expense-lunch",
          title: "Dim sum lunch",
          amount: 120.45,
          amountMinor: 12045,
          currency: "HKD",
          exchangeRateToSettlementCurrency: 1,
          notes: "Paid at counter",
          receiptUrl: null,
          lineItems: [],
          comments: [],
          spentOn: "2026-06-21",
          storedValueCardId: "octopus",
          storedValueCardName: "Octopus",
          storedValueTransactionType: "spend",
          tripPlanId: "plan-rain",
          paidBy: "member-aom",
          category: "food",
          splits: { "member-aom": 60.23, "member-beam": 60.22 },
          itineraryItemId: "item-lunch",
        },
        {
          clientMutationId: "expense-patch-mutation",
          expectedVersion: 4,
        },
      ),
    ).toEqual({
      clientMutationId: "expense-patch-mutation",
      expectedVersion: 4,
      title: "Dim sum lunch",
      amountMinor: 12045,
      currency: "HKD",
      exchangeRateToSettlementCurrency: 1,
      notes: "Paid at counter",
      receiptUrl: null,
      lineItems: [],
      comments: [],
      spentOn: "2026-06-21",
      storedValueCardId: "octopus",
      storedValueCardName: "Octopus",
      storedValueTransactionType: "spend",
      tripPlanId: "plan-rain",
      paidBy: "member-aom",
      category: "food",
      splits: { "member-aom": 6023, "member-beam": 6022 },
      itineraryItemId: "item-lunch",
    });
  });

  it("keeps explicit stored-value nulls in patch expense API requests", () => {
    expect(
      buildPatchExpenseRequest(
        {
          expenseId: "expense-lunch",
          title: "Dim sum lunch",
          amount: 120.45,
          amountMinor: 12045,
          currency: "HKD",
          exchangeRateToSettlementCurrency: 1,
          notes: "",
          receiptUrl: null,
          lineItems: [],
          comments: [],
          spentOn: "2026-06-21",
          storedValueCardId: null,
          storedValueCardName: null,
          storedValueTransactionType: null,
          tripPlanId: "plan-rain",
          paidBy: "member-aom",
          category: "food",
          splits: { "member-aom": 120.45 },
          itineraryItemId: null,
        },
        {
          clientMutationId: "expense-patch-clear-stored-value",
          expectedVersion: 5,
        },
      ),
    ).toMatchObject({
      storedValueCardId: null,
      storedValueCardName: null,
      storedValueTransactionType: null,
    });
  });
});
