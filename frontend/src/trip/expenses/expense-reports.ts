import {
  expenseAmountInSettlementCurrency,
  formatMoney,
  normalizeCurrency,
  roundMoney,
} from "./expense-money";
import type {
  ExpenseComment,
  ExpenseSummary,
  Member,
  SettlementSuggestion,
  Trip,
} from "../types";

interface BuildExpenseStatementInput {
  trip: Pick<Trip, "name" | "members" | "itineraryItems" | "expenses">;
  expenseSummary: ExpenseSummary;
}

interface BuildPaybackReminderInput {
  trip: Pick<Trip, "name" | "members">;
  suggestion: SettlementSuggestion;
}

export function buildExpenseStatement({ trip, expenseSummary }: BuildExpenseStatementInput): string {
  const settlementCurrency = expenseSummary.settlementCurrency ?? "HKD";
  const memberNames = new Map(trip.members.map((member) => [member.id, member.displayName]));
  const itineraryNames = new Map(trip.itineraryItems.map((item) => [item.id, item.activity]));
  const lines = [
    `Trip money - ${trip.name}`,
    `Trip spend: ${formatMoney(expenseSummary.groupSpend, settlementCurrency)}`,
    "",
    "Balances",
    ...trip.members.map((member) => {
      const net = expenseSummary.netByMember[member.id] ?? 0;
      if (net > 0) return `- ${member.displayName}: owed ${formatMoney(net, settlementCurrency)}`;
      if (net < 0) return `- ${member.displayName}: owes ${formatMoney(Math.abs(net), settlementCurrency)}`;
      return `- ${member.displayName}: settled`;
    }),
    "",
    "Paybacks",
    ...(expenseSummary.settlementSuggestions.length
      ? expenseSummary.settlementSuggestions.map(
        (suggestion) => `- ${memberName(memberNames, suggestion.from)} pays ${memberName(memberNames, suggestion.to)} ${formatMoney(suggestion.amount, suggestion.currency ?? settlementCurrency)}`,
      )
      : ["- Everyone is settled."]),
    "",
    "Expenses",
    ...(trip.expenses.length
      ? trip.expenses.flatMap((expense) => {
        const linkedStop = expense.itineraryItemId ? itineraryNames.get(expense.itineraryItemId) : null;
        const linkText = linkedStop ? `, linked to ${linkedStop}` : "";
        const currency = normalizeCurrency(expense.currency ?? settlementCurrency);
        const settlementAmount = expenseAmountInSettlementCurrency(expense, settlementCurrency);
        const conversionText = currency === settlementCurrency ? "" : ` (${formatMoney(settlementAmount, settlementCurrency)} settle value)`;
        const receiptText = expense.receiptUrl ? `, receipt ${expense.receiptUrl}` : "";
        return [
          `- ${expense.title}: ${formatMoney(expense.amount, currency)}${conversionText} paid by ${memberName(memberNames, expense.paidBy)}, split ${formatMoney(sumSplits(expense.splits), currency)}${linkText}${receiptText}`,
          ...(expense.notes?.trim() ? [`  note: ${expense.notes.trim()}`] : []),
          ...formatExpenseComments(expense.comments ?? [], trip.members).map((comment) => `  comment ${comment}`),
          ...(expense.lineItems ?? []).map((lineItem) => {
            const participantNames = lineItem.participantIds.map((memberId) => memberName(memberNames, memberId)).join(", ");
            return `  - ${lineItem.title}: ${formatMoney(lineItem.amount, currency)} shared by ${participantNames || "no one"}`;
          }),
        ];
      })
      : ["- No expenses yet."]),
  ];

  return lines.join("\n");
}

export function buildPaybackReminder({ trip, suggestion }: BuildPaybackReminderInput): string {
  const memberNames = new Map(trip.members.map((member) => [member.id, member.displayName]));
  return `${memberName(memberNames, suggestion.from)}, please pay ${memberName(memberNames, suggestion.to)} ${formatMoney(suggestion.amount, suggestion.currency ?? "HKD")} for ${trip.name}. Mark it as paid in Joii after you send it.`;
}

export function buildExpenseCsv({ trip, expenseSummary }: BuildExpenseStatementInput): string {
  const settlementCurrency = expenseSummary.settlementCurrency ?? "HKD";
  const memberNames = new Map(trip.members.map((member) => [member.id, member.displayName]));
  const itineraryNames = new Map(trip.itineraryItems.map((item) => [item.id, item.activity]));
  const rows = [
    ["section", "type", "title", "amount", "currency", "paid_by", "member", "share", "category", "linked_stop", "notes", "comments"],
    ...trip.members.map((member) => {
      const net = expenseSummary.netByMember[member.id] ?? 0;
      const category = net > 0 ? "owed" : net < 0 ? "owes" : "settled";
      return ["balances", "balance", trip.name, "0.00", settlementCurrency, "", member.displayName, Math.abs(net).toFixed(2), category, "", "", ""];
    }),
    ...(expenseSummary.settlementSuggestions.length
      ? expenseSummary.settlementSuggestions.map((suggestion) => [
        "paybacks",
        "payback",
        `${memberName(memberNames, suggestion.from)} pays ${memberName(memberNames, suggestion.to)}`,
        suggestion.amount.toFixed(2),
        suggestion.currency ?? settlementCurrency,
        memberName(memberNames, suggestion.from),
        memberName(memberNames, suggestion.to),
        suggestion.amount.toFixed(2),
        "payback",
        "",
        "",
        "",
      ])
      : [["paybacks", "payback", "Everyone is settled", "0.00", settlementCurrency, "", "", "0.00", "settled", "", "", ""]]),
    ...trip.expenses.flatMap((expense) =>
      Object.entries(expense.splits).map(([memberId, share]) => [
        "expenses",
        expense.category === "settlement" ? "settlement" : "expense",
        expense.title,
        expense.amount.toFixed(2),
        expense.currency ?? "HKD",
        memberName(memberNames, expense.paidBy),
        memberName(memberNames, memberId),
        share.toFixed(2),
        expense.category,
        expense.itineraryItemId ? itineraryNames.get(expense.itineraryItemId) ?? "" : "",
        expense.notes ?? "",
        formatExpenseComments(expense.comments ?? [], trip.members).join(" | "),
      ]),
    ),
  ];

  return rows.map((row, index) => (index === 0 ? row.join(",") : row.map(csvCell).join(","))).join("\n");
}

function formatExpenseComments(comments: ExpenseComment[], members: Member[]): string[] {
  const memberNames = new Map(members.map((member) => [member.id, member.displayName]));
  return comments
    .filter((comment) => comment.body.trim())
    .map((comment) => `${memberName(memberNames, comment.authorId)}: ${comment.body.trim()}`);
}

function memberName(memberNames: Map<string, string>, memberId: string): string {
  return memberNames.get(memberId) ?? memberId;
}

function sumSplits(splits: Record<string, number>): number {
  return roundMoney(Object.values(splits).reduce((sum, split) => sum + split, 0));
}

function csvCell(value: string): string {
  return `"${value.replaceAll("\"", "\"\"")}"`;
}
