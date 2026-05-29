import type { Expense, ExpenseSummary } from "./types";

export function buildExpenseSummary(expenses: Expense[], currentMemberId: string): ExpenseSummary {
  const memberIds = Array.from(new Set(expenses.flatMap((expense) => [expense.paidBy, ...Object.keys(expense.splits)])));
  const netByMember = Object.fromEntries(memberIds.map((id) => [id, 0]));
  let groupSpend = 0;

  for (const expense of expenses) {
    const splitTotal = Object.values(expense.splits).reduce((sum, share) => sum + share, 0);
    if (splitTotal > 0 && splitTotal !== expense.amount) groupSpend += expense.amount;
    if (Object.values(expense.splits).filter((share) => share > 0).length > 1) groupSpend += expense.amount;
    netByMember[expense.paidBy] = roundMoney(netByMember[expense.paidBy] + expense.amount);
    for (const [memberId, share] of Object.entries(expense.splits)) {
      netByMember[memberId] = roundMoney(netByMember[memberId] - share);
    }
  }

  const currentNet = roundMoney(netByMember[currentMemberId] ?? 0);
  return {
    groupSpend: roundMoney(groupSpend),
    netByMember,
    currentUserNetLabel:
      currentNet > 0 ? `You are owed HK$${currentNet.toFixed(2)}` : currentNet < 0 ? `You owe HK$${Math.abs(currentNet).toFixed(2)}` : "You are settled",
    settlementSuggestions: buildSettlementSuggestions(netByMember),
  };
}

function buildSettlementSuggestions(netByMember: Record<string, number>): Array<{ from: string; to: string; amount: number }> {
  const creditors = Object.entries(netByMember)
    .map(([id, net]) => ({ id, cents: Math.round(net * 100) }))
    .filter((entry) => entry.cents > 0)
    .sort((a, b) => b.cents - a.cents);
  const debtors = Object.entries(netByMember)
    .map(([id, net]) => ({ id, cents: Math.round(-net * 100) }))
    .filter((entry) => entry.cents > 0)
    .sort((a, b) => b.cents - a.cents);
  const suggestions: Array<{ from: string; to: string; amount: number }> = [];

  let debtorIndex = 0;
  let creditorIndex = 0;
  while (debtorIndex < debtors.length && creditorIndex < creditors.length) {
    const cents = Math.min(debtors[debtorIndex].cents, creditors[creditorIndex].cents);
    suggestions.push({ from: debtors[debtorIndex].id, to: creditors[creditorIndex].id, amount: cents / 100 });
    debtors[debtorIndex].cents -= cents;
    creditors[creditorIndex].cents -= cents;
    if (debtors[debtorIndex].cents === 0) debtorIndex += 1;
    if (creditors[creditorIndex].cents === 0) creditorIndex += 1;
  }

  return suggestions;
}

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}
