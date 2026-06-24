import type { Expense } from "../types";

function split(
  amount: number,
  memberIds = ["member-aom", "member-beam", "member-nam", "member-family"],
): Record<string, number> {
  const base = Math.round((amount / memberIds.length) * 100) / 100;
  return Object.fromEntries(memberIds.map((id) => [id, base]));
}

export function createSeedExpenses(): Expense[] {
  return [
    {
      id: "expense-dimsum",
      title: "Dim Dim Sum brunch",
      amount: 512,
      paidBy: "member-aom",
      splits: split(512),
      category: "food",
    },
    {
      id: "expense-peak-tram",
      title: "Peak Tram tickets",
      amount: 880,
      paidBy: "member-beam",
      splits: split(880),
      category: "tickets",
    },
    {
      id: "expense-octopus",
      title: "Octopus top-up",
      amount: 280,
      paidBy: "member-nam",
      splits: split(280),
      category: "transport",
    },
    {
      id: "expense-airport-express",
      title: "Airport Express group tickets",
      amount: 460,
      currency: "HKD",
      exchangeRateToSettlementCurrency: 4.62,
      notes: "Paid at the airport counter after landing.",
      paidBy: "member-beam",
      splits: split(460),
      category: "transport",
      itineraryItemId: "item-airport-express",
      lineItems: [
        {
          id: "expense-airport-express-adults",
          title: "Adult tickets",
          amount: 345,
          participantIds: ["member-aom", "member-beam", "member-nam"],
        },
        {
          id: "expense-airport-express-family",
          title: "Family add-on",
          amount: 115,
          participantIds: ["member-family"],
        },
      ],
      comments: [
        {
          id: "comment-airport-express-receipt",
          authorId: "member-beam",
          body: "Paper receipt is in the shared pouch.",
          createdAt: "2026-06-18T11:35:00.000Z",
        },
      ],
    },
    {
      id: "expense-hotel-deposit",
      title: "Tsim Sha Tsui hotel deposit",
      amount: 2400,
      currency: "HKD",
      exchangeRateToSettlementCurrency: 4.62,
      notes: "Card hold was charged before check-in.",
      receiptUrl: "https://example.com/receipts/hotel-deposit",
      paidBy: "member-aom",
      splits: split(2400),
      category: "stay",
      itineraryItemId: "item-hotel-checkin",
    },
    {
      id: "expense-luk-yu-dinner",
      title: "Luk Yu dinner",
      amount: 1380,
      currency: "HKD",
      exchangeRateToSettlementCurrency: 4.62,
      notes: "Itemized by table order.",
      paidBy: "member-nam",
      splits: {
        "member-aom": 420,
        "member-beam": 380,
        "member-nam": 320,
        "member-family": 260,
      },
      category: "food",
      itineraryItemId: "item-luk-yu",
      lineItems: [
        {
          id: "expense-luk-yu-dim-sum",
          title: "Dim sum set",
          amount: 520,
          participantIds: ["member-aom", "member-beam", "member-nam", "member-family"],
        },
        {
          id: "expense-luk-yu-tea",
          title: "Tea and service",
          amount: 180,
          participantIds: ["member-aom", "member-beam", "member-nam", "member-family"],
        },
        {
          id: "expense-luk-yu-seafood",
          title: "Seafood dishes",
          amount: 680,
          participantIds: ["member-aom", "member-beam", "member-nam"],
        },
      ],
    },
    {
      id: "expense-pacific-place-personal",
      title: "Pacific Place personal shopping",
      amount: 128,
      currency: "HKD",
      exchangeRateToSettlementCurrency: 4.62,
      notes: "Personal item, no group payback needed.",
      paidBy: "member-aom",
      splits: {
        "member-aom": 128,
      },
      category: "shopping",
      itineraryItemId: "item-pacific-place",
    },
    {
      id: "expense-shenzhen-hotel",
      title: "Shenzhen hotel balance",
      amount: 960,
      currency: "CNY",
      exchangeRateToSettlementCurrency: 5.05,
      notes: "Balance due at Shenzhen check-in.",
      paidBy: "member-family",
      splits: split(960),
      category: "stay",
      itineraryItemId: "item-shenzhen-hotel",
    },
    {
      id: "expense-beam-paid-aom",
      title: "Aom received Beam payback",
      amount: 650,
      currency: "HKD",
      exchangeRateToSettlementCurrency: 4.62,
      notes: "Payback recorded after hotel deposit review.",
      paidBy: "member-beam",
      splits: {
        "member-aom": 650,
      },
      category: "settlement",
    },
  ];
}
