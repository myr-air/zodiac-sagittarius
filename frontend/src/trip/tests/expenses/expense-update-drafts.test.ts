import { describe, expect, it } from "vitest";
import { buildExpenseUpdateDraft } from "../../expenses";
import type { Expense, Trip } from "../../types";

describe("expense update drafts", () => {
  it("builds expense update drafts from form values and existing defaults", () => {
    const trip = {
      members: [
        { id: "member-aom", displayName: "Aom", role: "owner", presence: "online", color: "#0f766e" },
        { id: "member-beam", displayName: "Beam", role: "traveler", presence: "online", color: "#2563eb" },
      ],
      itineraryItems: [],
      mainTripPlanId: "plan-main",
      activePlanVariantId: "plan-main",
    } as Pick<Trip, "members" | "itineraryItems" | "mainTripPlanId" | "activePlanVariantId">;
    const existing: Expense = {
      id: "expense-taxi",
      title: "Taxi",
      amount: 80,
      currency: "HKD",
      exchangeRateToSettlementCurrency: 1,
      notes: "Original note",
      receiptUrl: "https://receipts.example/original.jpg",
      spentOn: "2026-06-05",
      lineItems: [{ id: "line-original", title: "Original", amount: 80, participantIds: ["member-aom"] }],
      comments: [{ id: "comment-1", authorId: "member-aom", body: "Paid cash", createdAt: "2026-06-05T12:00:00.000Z" }],
      tripPlanId: "plan-main",
      paidBy: "member-aom",
      category: "transport",
      splits: { "member-aom": 80 },
      itineraryItemId: "item-old",
      version: 3,
    };

    const draft = buildExpenseUpdateDraft(
      trip,
      existing,
      {
        expenseId: existing.id,
        title: "Airport taxi",
        amount: 99.5,
        paidBy: "member-beam",
        category: "transport",
        itemId: undefined,
      },
      {
        selectedTripPlanId: "plan-selected",
        resolveTripPlanId: (_trip, recordId, preferredTripPlanId) =>
          `${preferredTripPlanId ?? "none"}:${recordId ?? "none"}`,
      },
    );

    expect(draft).toMatchObject({
      expenseId: "expense-taxi",
      title: "Airport taxi",
      amount: 99.5,
      amountMinor: 9950,
      currency: "HKD",
      exchangeRateToSettlementCurrency: 1,
      notes: "Original note",
      receiptUrl: "https://receipts.example/original.jpg",
      spentOn: "2026-06-05",
      lineItems: existing.lineItems,
      comments: existing.comments,
      tripPlanId: "plan-main:item-old",
      paidBy: "member-beam",
      category: "transport",
      splits: { "member-aom": 49.75, "member-beam": 49.75 },
      itineraryItemId: "item-old",
    });
  });
});
