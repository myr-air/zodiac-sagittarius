import { describe, expect, it } from "vitest";
import { enExpensesMessages } from "@/src/i18n/messages/en.expenses";
import { seedTrip } from "@/src/trip/seed";
import {
  personalStatementDayGroups,
  personalStatementRows,
} from "../expense-personal-statement-display";

const copy = {
  accountContext: enExpensesMessages.statement.personal.accountContext,
  dateFallback: enExpensesMessages.statement.dateFallback,
  flow: enExpensesMessages.statement.personal.flow,
  includedLineItems: enExpensesMessages.statement.personal.includedLineItems,
  noDirectAllocation: enExpensesMessages.statement.personal.noDirectAllocation,
  paymentMethod: enExpensesMessages.statement.personal.paymentMethod,
  relatedMember: enExpensesMessages.statement.personal.relatedMember,
};

describe("personal statement display", () => {
  it("breaks the current member statement down by owed spend and payback records", () => {
    const rows = personalStatementRows({
      copy,
      currentMemberId: "member-beam",
      displayCurrency: "THB",
      displayExchangeRate: 4.62,
      locale: "en",
      settlementCurrency: "HKD",
      trip: seedTrip,
    });

    expect(rows.find((row) => row.id === "spend-expense-airport-express-member-beam")).toMatchObject({
      amountLabel: "-HK$115.00",
      amountTone: "outflow",
      contextLabel: "Your share HK$115.00 · Group bill HK$460.00",
      flow: "paidForGroup",
      paidWithLabel: "Paid at source",
      relatedMemberLabel: "You paid",
    });
    expect(rows.find((row) => row.id === "spend-expense-luk-yu-dinner-member-beam")).toMatchObject({
      amountLabel: "-HK$380.00",
      amountTone: "outflow",
      flow: "friendPaid",
      paidWithLabel: "Not paid back yet",
      relatedMemberLabel: "Paid for you by Explorer Friend",
    });
    expect(rows.find((row) => row.id === "settlement-sent-expense-beam-paid-aom")).toMatchObject({
      amountLabel: "-HK$650.00",
      amountTone: "outflow",
      flow: "paybackSent",
      includedLabel: "Tsim Sha Tsui hotel deposit, Dim Dim Sum brunch",
      relatedMemberLabel: "Sent to Demo Traveler",
    });
    expect(rows.some((row) => row.includedLabel.includes("Adult tickets"))).toBe(true);
    expect(rows.find((row) => row.id === "settlement-sent-expense-beam-paid-aom")).toMatchObject({
      dateLabel: "Day 3 · 2026-06-20",
    });
  });

  it("groups personal statement rows under day headers", () => {
    const rows = personalStatementRows({
      copy,
      currentMemberId: "member-beam",
      displayCurrency: "HKD",
      displayExchangeRate: 1,
      locale: "en",
      settlementCurrency: "HKD",
      trip: seedTrip,
    });

    const groups = personalStatementDayGroups(rows);

    expect(groups[0]).toMatchObject({
      dateLabel: "Day 1 · 2026-06-18",
    });
    expect(groups.find((group) => group.dateLabel === "Day 3 · 2026-06-20")?.rows.map((row) => row.title)).toContain("Aom received Beam payback");
    expect(groups.some((group) => group.dateLabel === "No linked day")).toBe(false);
  });

  it("uses spentOn as the statement day when no itinerary item is linked", () => {
    const rows = personalStatementRows({
      copy,
      currentMemberId: "member-beam",
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

  it("uses the inferred source receipt day for lump paybacks without explicit allocations", () => {
    const rows = personalStatementRows({
      copy,
      currentMemberId: "member-beam",
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

    const groups = personalStatementDayGroups(rows);

    expect(rows.find((row) => row.id === "settlement-sent-lump-payback")).toMatchObject({
      dateLabel: "Day 2 · 2026-06-19",
      includedLabel: "Friend dinner",
    });
    expect(groups).toHaveLength(1);
    expect(groups[0]).toMatchObject({ dateLabel: "Day 2 · 2026-06-19" });
  });

  it("marks friend-paid expenses covered when a payback to that payer exists", () => {
    const rows = personalStatementRows({
      copy,
      currentMemberId: "member-beam",
      displayCurrency: "HKD",
      displayExchangeRate: 1,
      locale: "en",
      settlementCurrency: "HKD",
      trip: seedTrip,
    });

    expect(rows.find((row) => row.id === "spend-expense-dimsum-member-beam")).toMatchObject({
      flow: "friendPaid",
      paidWithLabel: "Partly paid back · Aom received Beam payback",
      settlementState: "partial",
    });
    expect(rows.find((row) => row.id === "spend-expense-hotel-deposit-member-beam")).toMatchObject({
      flow: "friendPaid",
      paidWithLabel: "Paid back · Aom received Beam payback",
      settlementState: "covered",
    });
  });

  it("marks received paybacks as positive account money", () => {
    const rows = personalStatementRows({
      copy,
      currentMemberId: "member-aom",
      displayCurrency: "HKD",
      displayExchangeRate: 1,
      locale: "en",
      settlementCurrency: "HKD",
      trip: seedTrip,
    });

    expect(rows.find((row) => row.id === "settlement-received-expense-beam-paid-aom-member-aom")).toMatchObject({
      amountLabel: "+HK$650.00",
      amountTone: "inflow",
      flow: "paybackReceived",
      relatedMemberLabel: "Received from Travel Mate",
    });
  });

  it("uses explicit settlement allocations instead of guessing from expense order", () => {
    const rows = personalStatementRows({
      copy,
      currentMemberId: "member-beam",
      displayCurrency: "HKD",
      displayExchangeRate: 1,
      locale: "en",
      settlementCurrency: "HKD",
      trip: {
        ...seedTrip,
        expenses: [
          {
            id: "older-dinner",
            title: "Older dinner",
            amount: 100,
            paidBy: "member-aom",
            splits: { "member-beam": 100 },
            category: "food",
          },
          {
            id: "newer-taxi",
            title: "Newer taxi",
            amount: 100,
            paidBy: "member-aom",
            splits: { "member-beam": 100 },
            category: "transport",
          },
          {
            id: "beam-payback-specific",
            title: "Beam paid taxi only",
            amount: 100,
            paidBy: "member-beam",
            splits: { "member-aom": 100 },
            settlementAllocations: [{
              expenseId: "newer-taxi",
              memberId: "member-beam",
              amount: 100,
            }],
            category: "settlement",
          },
        ],
      },
    });

    expect(rows.find((row) => row.id === "spend-older-dinner-member-beam")).toMatchObject({
      settlementState: "unpaid",
    });
    expect(rows.find((row) => row.id === "spend-newer-taxi-member-beam")).toMatchObject({
      settlementState: "covered",
      paidWithLabel: "Paid back · Beam paid taxi only",
    });
  });

  it("auto-matches an unallocated lump settlement back to the payer receipts", () => {
    const rows = personalStatementRows({
      copy,
      currentMemberId: "member-beam",
      displayCurrency: "HKD",
      displayExchangeRate: 1,
      locale: "en",
      settlementCurrency: "HKD",
      trip: {
        ...seedTrip,
        expenses: [
          {
            id: "aom-breakfast",
            title: "Aom breakfast",
            amount: 90,
            paidBy: "member-aom",
            splits: { "member-beam": 90 },
            category: "food",
          },
          {
            id: "aom-taxi",
            title: "Aom taxi",
            amount: 80,
            paidBy: "member-aom",
            splits: { "member-beam": 80 },
            category: "transport",
          },
          {
            id: "beam-paid-aom-lump",
            title: "Beam paid Aom back",
            amount: 120,
            paidBy: "member-beam",
            splits: { "member-aom": 120 },
            category: "settlement",
          },
        ],
      },
    });

    expect(rows.find((row) => row.id === "spend-aom-breakfast-member-beam")).toMatchObject({
      settlementState: "covered",
      paidWithLabel: "Paid back · Beam paid Aom back",
    });
    expect(rows.find((row) => row.id === "spend-aom-taxi-member-beam")).toMatchObject({
      settlementState: "partial",
      paidWithLabel: "Partly paid back · Beam paid Aom back",
    });
    expect(rows.find((row) => row.id === "settlement-sent-beam-paid-aom-lump")).toMatchObject({
      includedLabel: "Aom breakfast, Aom taxi",
    });
  });

  it("marks indirect net-cleared debt as unallocated instead of unpaid", () => {
    const rows = personalStatementRows({
      copy,
      currentMemberId: "member-beam",
      displayCurrency: "HKD",
      displayExchangeRate: 1,
      locale: "en",
      settlementCurrency: "HKD",
      trip: {
        ...seedTrip,
        expenses: [
          {
            id: "aom-dinner",
            title: "Aom dinner",
            amount: 100,
            paidBy: "member-aom",
            splits: { "member-beam": 100 },
            category: "food",
          },
          {
            id: "nam-ticket",
            title: "Nam ticket",
            amount: 50,
            paidBy: "member-nam",
            splits: { "member-beam": 50 },
            category: "tickets",
          },
          {
            id: "nam-covered-aom-taxi",
            title: "Nam covered Aom taxi",
            amount: 100,
            paidBy: "member-nam",
            splits: { "member-aom": 100 },
            category: "transport",
          },
          {
            id: "beam-paid-nam-net",
            title: "Beam paid Nam net balance",
            amount: 150,
            paidBy: "member-beam",
            splits: { "member-nam": 150 },
            category: "settlement",
          },
        ],
      },
    });

    expect(rows.find((row) => row.id === "spend-aom-dinner-member-beam")).toMatchObject({
      paidWithLabel: "Cleared in net balance, not linked to this bill · Beam paid Nam net balance",
      settlementState: "netClearedUnallocated",
    });
    expect(rows.find((row) => row.id === "spend-nam-ticket-member-beam")).toMatchObject({
      paidWithLabel: "Paid back · Beam paid Nam net balance",
      settlementState: "covered",
    });
  });

  it("does not mark an indirectly cleared debt as unpaid when another debt remains open", () => {
    const rows = personalStatementRows({
      copy,
      currentMemberId: "member-beam",
      displayCurrency: "HKD",
      displayExchangeRate: 1,
      locale: "en",
      settlementCurrency: "HKD",
      trip: {
        ...seedTrip,
        members: [
          ...seedTrip.members,
          { id: "member-family", displayName: "Family", role: "traveler", presence: "offline", color: "#64748b" },
        ],
        expenses: [
          {
            id: "aom-paid-beam",
            title: "Aom paid Beam",
            amount: 100,
            paidBy: "member-aom",
            splits: { "member-beam": 100 },
            category: "food",
          },
          {
            id: "nam-paid-aom",
            title: "Nam paid Aom",
            amount: 100,
            paidBy: "member-nam",
            splits: { "member-aom": 100 },
            category: "transport",
          },
          {
            id: "beam-paid-nam-for-aom",
            title: "Beam paid Nam for Aom",
            amount: 100,
            paidBy: "member-beam",
            splits: { "member-nam": 100 },
            category: "settlement",
          },
          {
            id: "family-paid-beam",
            title: "Family paid Beam",
            amount: 20,
            paidBy: "member-family",
            splits: { "member-beam": 20 },
            category: "food",
          },
        ],
      },
    });

    expect(rows.find((row) => row.id === "spend-aom-paid-beam-member-beam")).toMatchObject({
      paidWithLabel: "Cleared in net balance, not linked to this bill · Beam paid Nam for Aom",
      settlementState: "netClearedUnallocated",
    });
    expect(rows.find((row) => row.id === "spend-family-paid-beam-member-beam")).toMatchObject({
      paidWithLabel: "Not paid back yet",
      settlementState: "unpaid",
    });
  });

  it("treats a closed statement snapshot as settled even when paid amount is lower than debt", () => {
    const rows = personalStatementRows({
      copy,
      currentMemberId: "member-beam",
      displayCurrency: "HKD",
      displayExchangeRate: 1,
      locale: "en",
      settlementCurrency: "HKD",
      trip: {
        ...seedTrip,
        expenses: [
          {
            id: "hotel",
            title: "Hotel",
            amount: 600,
            paidBy: "member-aom",
            splits: { "member-beam": 600 },
            category: "stay",
          },
          {
            id: "brunch",
            title: "Brunch",
            amount: 50,
            paidBy: "member-aom",
            splits: { "member-beam": 50 },
            category: "food",
          },
          {
            id: "beam-paid-aom-accepted",
            title: "Beam paid Aom accepted amount",
            amount: 640,
            paidBy: "member-beam",
            splits: { "member-aom": 640 },
            settlementAllocations: [
              {
                expenseId: "hotel",
                memberId: "member-beam",
                amount: 600,
                closedAmount: 600,
                closedAt: "2026-06-25T04:00:00.000Z",
                lockedCurrency: "HKD",
                lockedExchangeRate: 1,
                statementStatus: "closed",
              },
              {
                expenseId: "brunch",
                memberId: "member-beam",
                amount: 40,
                closedAmount: 50,
                closedAt: "2026-06-25T04:00:00.000Z",
                lockedCurrency: "HKD",
                lockedExchangeRate: 1,
                statementStatus: "closed",
              },
            ],
            category: "settlement",
          },
        ],
      },
    });

    expect(rows.find((row) => row.id === "spend-brunch-member-beam")).toMatchObject({
      paidWithLabel: "Closed with locked rate · Beam paid Aom accepted amount",
      settlementState: "closed",
    });
    expect(rows.find((row) => row.id === "settlement-sent-beam-paid-aom-accepted")).toMatchObject({
      amountLabel: "-HK$640.00",
      includedLabel: "Hotel, Brunch",
    });
  });

  it("keeps closed statement rows closed after the source exchange rate changes", () => {
    const rows = personalStatementRows({
      copy,
      currentMemberId: "member-beam",
      displayCurrency: "HKD",
      displayExchangeRate: 1,
      locale: "en",
      settlementCurrency: "HKD",
      trip: {
        ...seedTrip,
        expenses: [
          {
            id: "cny-hotel",
            title: "Shenzhen hotel balance",
            amount: 650,
            currency: "CNY",
            exchangeRateToSettlementCurrency: 1.2,
            paidBy: "member-aom",
            splits: { "member-beam": 650 },
            category: "stay",
          },
          {
            id: "beam-paid-aom-locked-rate",
            title: "Beam paid Aom locked rate",
            amount: 640,
            paidBy: "member-beam",
            splits: { "member-aom": 640 },
            settlementAllocations: [
              {
                expenseId: "cny-hotel",
                memberId: "member-beam",
                amount: 640,
                closedAmount: 650,
                closedAt: "2026-06-25T04:00:00.000Z",
                lockedCurrency: "HKD",
                lockedExchangeRate: 1,
                statementStatus: "closed",
              },
            ],
            category: "settlement",
          },
        ],
      },
    });

    expect(rows.find((row) => row.id === "spend-cny-hotel-member-beam")).toMatchObject({
      paidWithLabel: "Closed with locked rate · Beam paid Aom locked rate",
      settlementState: "closed",
    });
  });

  it("keeps inferred settlement labels aligned across multiple lump paybacks", () => {
    const rows = personalStatementRows({
      copy,
      currentMemberId: "member-beam",
      displayCurrency: "HKD",
      displayExchangeRate: 1,
      locale: "en",
      settlementCurrency: "HKD",
      trip: {
        ...seedTrip,
        expenses: [
          {
            id: "aom-breakfast",
            title: "Aom breakfast",
            amount: 90,
            paidBy: "member-aom",
            splits: { "member-beam": 90 },
            category: "food",
          },
          {
            id: "aom-taxi",
            title: "Aom taxi",
            amount: 80,
            paidBy: "member-aom",
            splits: { "member-beam": 80 },
            category: "transport",
          },
          {
            id: "beam-paid-aom-first",
            title: "Beam paid Aom first",
            amount: 90,
            paidBy: "member-beam",
            splits: { "member-aom": 90 },
            category: "settlement",
          },
          {
            id: "beam-paid-aom-second",
            title: "Beam paid Aom second",
            amount: 80,
            paidBy: "member-beam",
            splits: { "member-aom": 80 },
            category: "settlement",
          },
        ],
      },
    });

    expect(rows.find((row) => row.id === "settlement-sent-beam-paid-aom-first")).toMatchObject({
      includedLabel: "Aom breakfast",
    });
    expect(rows.find((row) => row.id === "settlement-sent-beam-paid-aom-second")).toMatchObject({
      includedLabel: "Aom taxi",
    });
  });

  it("lists payer-only advances even when the current member has no personal split", () => {
    const rows = personalStatementRows({
      copy,
      currentMemberId: "member-beam",
      displayCurrency: "HKD",
      displayExchangeRate: 1,
      locale: "en",
      settlementCurrency: "HKD",
      trip: {
        ...seedTrip,
        expenses: [{
          id: "advance-for-friends",
          title: "Taxi advanced for friends",
          amount: 300,
          paidBy: "member-beam",
          splits: {
            "member-aom": 150,
            "member-nam": 150,
          },
          category: "transport",
        }],
      },
    });

    expect(rows.find((row) => row.id === "spend-advance-for-friends-member-beam")).toMatchObject({
      amountLabel: "-HK$300.00",
      amountTone: "outflow",
      contextLabel: "Advance for group HK$300.00",
      flow: "paidForGroup",
      relatedMemberLabel: "You paid",
    });
  });
});
