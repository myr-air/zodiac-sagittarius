import type { Expense } from "./types";

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
  ];
}
