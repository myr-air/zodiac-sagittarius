import { describe, expect, it } from "vitest";
import { buildExpenseSummary } from "./expenses";
import * as expenseHelpers from "./expenses";
import type { Trip } from "./types";

describe("expense statement exports", () => {
  it("builds a shareable trip money statement with balances, paybacks, and ledger lines", () => {
    const trip = {
      name: "Weekend food crawl",
      members: [
        { id: "member-aom", displayName: "Aom", role: "owner", presence: "online", color: "#0f766e" },
        { id: "member-beam", displayName: "Beam", role: "traveler", presence: "online", color: "#2563eb" },
        { id: "member-nam", displayName: "Nam", role: "traveler", presence: "online", color: "#9333ea" },
      ],
      itineraryItems: [
        { id: "item-dinner", activity: "Dinner stop" },
      ],
      expenses: [
        {
          id: "expense-dinner",
          title: "Dinner",
          amount: 90,
          paidBy: "member-aom",
          splits: { "member-aom": 30, "member-beam": 30, "member-nam": 30 },
          category: "food",
          itineraryItemId: "item-dinner",
        },
      ],
    } as unknown as Pick<Trip, "name" | "members" | "itineraryItems" | "expenses">;
    const summary = buildExpenseSummary(trip.expenses, "member-beam");

    const statement = expenseHelpers.buildExpenseStatement({ trip, expenseSummary: summary });

    expect(statement).toContain("Trip money - Weekend food crawl");
    expect(statement).toContain("Trip spend: HK$90.00");
    expect(statement).toContain("- Aom: owed HK$60.00");
    expect(statement).toContain("- Beam: owes HK$30.00");
    expect(statement).toContain("- Beam pays Aom HK$30.00");
    expect(statement).toContain("- Nam pays Aom HK$30.00");
    expect(statement).toContain("- Dinner: HK$90.00 paid by Aom, split HK$90.00, linked to Dinner stop");
  });

  it("keeps original currency and converted settlement value visible in statements", () => {
    const trip = {
      name: "Cross-border weekend",
      members: [
        { id: "member-aom", displayName: "Aom", role: "owner", presence: "online", color: "#0f766e" },
        { id: "member-beam", displayName: "Beam", role: "traveler", presence: "online", color: "#2563eb" },
      ],
      itineraryItems: [],
      expenses: [
        {
          id: "expense-taxi",
          title: "Shenzhen taxi",
          amount: 100,
          currency: "CNY",
          exchangeRateToSettlementCurrency: 1.1,
          paidBy: "member-beam",
          splits: { "member-aom": 50, "member-beam": 50 },
          category: "transport",
        },
      ],
    } as unknown as Pick<Trip, "name" | "members" | "itineraryItems" | "expenses">;
    const summary = buildExpenseSummary(trip.expenses, "member-aom", [], { settlementCurrency: "HKD" });

    const statement = expenseHelpers.buildExpenseStatement({ trip, expenseSummary: summary });

    expect(statement).toContain("Trip spend: HK$110.00");
    expect(statement).toContain("- Aom pays Beam HK$55.00");
    expect(statement).toContain("- Shenzhen taxi: CN¥100.00 (HK$110.00 settle value) paid by Beam, split CN¥100.00");
  });

  it("includes receipt links and itemized lines in shareable statements", () => {
    const trip = {
      name: "Weekend food crawl",
      members: [
        { id: "member-aom", displayName: "Aom", role: "owner", presence: "online", color: "#0f766e" },
        { id: "member-beam", displayName: "Beam", role: "traveler", presence: "online", color: "#2563eb" },
      ],
      itineraryItems: [],
      expenses: [
        {
          id: "expense-receipt",
          title: "Night market receipt",
          amount: 90,
          currency: "HKD",
          notes: "Beam paid cash for dessert later.",
          receiptUrl: "https://receipts.example/night-market.jpg",
          comments: [
            {
              id: "comment-dessert",
              authorId: "member-beam",
              body: "I covered dessert in cash.",
              createdAt: "2026-06-05T12:00:00.000Z",
            },
          ],
          lineItems: [
            { id: "line-noodles", title: "Noodles", amount: 60, participantIds: ["member-aom", "member-beam"] },
            { id: "line-tea", title: "Milk tea", amount: 30, participantIds: ["member-beam"] },
          ],
          paidBy: "member-aom",
          splits: { "member-aom": 30, "member-beam": 60 },
          category: "food",
        },
      ],
    } as unknown as Pick<Trip, "name" | "members" | "itineraryItems" | "expenses">;
    const summary = buildExpenseSummary(trip.expenses, "member-beam");

    const statement = expenseHelpers.buildExpenseStatement({ trip, expenseSummary: summary });

    expect(statement).toContain("receipt https://receipts.example/night-market.jpg");
    expect(statement).toContain("  note: Beam paid cash for dessert later.");
    expect(statement).toContain("  comment Beam: I covered dessert in cash.");
    expect(statement).toContain("  - Noodles: HK$60.00 shared by Aom, Beam");
    expect(statement).toContain("  - Milk tea: HK$30.00 shared by Beam");
  });

  it("builds an audit-friendly CSV export with escaped ledger and settlement rows", () => {
    const trip = {
      name: "Weekend food crawl",
      members: [
        { id: "member-aom", displayName: "Aom", role: "owner", presence: "online", color: "#0f766e" },
        { id: "member-beam", displayName: "Beam", role: "traveler", presence: "online", color: "#2563eb" },
      ],
      itineraryItems: [
        { id: "item-dinner", activity: "Dinner, Central" },
      ],
      expenses: [
        {
          id: "expense-dinner",
          title: "Dinner \"round 1\"",
          amount: 80,
          currency: "HKD",
          notes: "Use the promo voucher.",
          comments: [
            {
              id: "comment-voucher",
              authorId: "member-beam",
              body: "Voucher is in the shared folder.",
              createdAt: "2026-06-05T12:00:00.000Z",
            },
          ],
          paidBy: "member-aom",
          splits: { "member-aom": 40, "member-beam": 40 },
          category: "food",
          itineraryItemId: "item-dinner",
        },
        {
          id: "expense-payback",
          title: "Beam paid Aom back",
          amount: 40,
          currency: "HKD",
          paidBy: "member-beam",
          splits: { "member-aom": 40 },
          category: "settlement",
        },
      ],
    } as unknown as Pick<Trip, "name" | "members" | "itineraryItems" | "expenses">;
    const summary = buildExpenseSummary(trip.expenses, "member-beam");

    const csv = expenseHelpers.buildExpenseCsv({ trip, expenseSummary: summary });

    expect(csv.split("\n")[0]).toBe("section,type,title,amount,currency,paid_by,member,share,category,linked_stop,notes,comments");
    expect(csv).toContain("\"expenses\",\"expense\",\"Dinner \"\"round 1\"\"\",\"80.00\",\"HKD\",\"Aom\",\"Beam\",\"40.00\",\"food\",\"Dinner, Central\",\"Use the promo voucher.\",\"Beam: Voucher is in the shared folder.\"");
    expect(csv).toContain("\"expenses\",\"settlement\",\"Beam paid Aom back\",\"40.00\",\"HKD\",\"Beam\",\"Aom\",\"40.00\",\"settlement\",\"\",\"\",\"\"");
    expect(csv).toContain("\"balances\",\"balance\",\"Weekend food crawl\",\"0.00\",\"HKD\",\"\",\"Aom\",\"0.00\",\"settled\",\"\",\"\",\"\"");
    expect(csv).toContain("\"paybacks\",\"payback\",\"Everyone is settled\",\"0.00\",\"HKD\",\"\",\"\",\"0.00\",\"settled\",\"\",\"\",\"\"");
  });
});
