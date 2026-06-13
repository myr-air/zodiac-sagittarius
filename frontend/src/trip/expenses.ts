import type { Expense, ExpenseComment, ExpenseLineItem, ExpenseReminder, ExpenseSummary, Member, SettlementSuggestion, Trip } from "./types";

export type ExpenseSplitMode = "equal" | "exact" | "shares" | "percentage" | "itemized";

interface BuildExpenseSplitsInput {
  amount: number;
  memberIds: string[];
  mode: ExpenseSplitMode;
  valuesByMember?: Record<string, number>;
}

interface BuildItemizedExpenseSplitsInput {
  lineItems: ExpenseLineItem[];
  memberIds: string[];
}

interface BuildExpenseStatementInput {
  trip: Pick<Trip, "name" | "members" | "itineraryItems" | "expenses">;
  expenseSummary: ExpenseSummary;
}

interface BuildPaybackReminderInput {
  trip: Pick<Trip, "name" | "members">;
  suggestion: SettlementSuggestion;
}

interface BuildExpenseSummaryOptions {
  exchangeRates?: Record<string, number>;
  settlementCurrency?: string;
}

export function buildExpenseSplits({ amount, memberIds, mode, valuesByMember = {} }: BuildExpenseSplitsInput): Record<string, number> {
  const participantIds = memberIds.length ? memberIds : ["unknown-member"];
  const amountCents = Math.round(amount * 100);

  if (mode === "exact") {
    return Object.fromEntries(participantIds.map((memberId) => [memberId, roundMoney(valuesByMember[memberId] ?? 0)]));
  }

  if (mode === "percentage") {
    const rawCents = participantIds.map((memberId) => (amountCents * Math.max(0, valuesByMember[memberId] ?? 0)) / 100);
    return allocateCentsByRawShares(participantIds, rawCents);
  }

  if (mode === "shares") {
    const weights = participantIds.map((memberId) => Math.max(0, valuesByMember[memberId] ?? 0));
    return allocateCentsByWeight(participantIds, amountCents, weights);
  }

  return allocateCentsByWeight(participantIds, amountCents, participantIds.map(() => 1));
}

export function buildItemizedExpenseSplits({ lineItems, memberIds }: BuildItemizedExpenseSplitsInput): Record<string, number> {
  const memberIdSet = new Set(memberIds);
  const centsByMember = Object.fromEntries(memberIds.map((memberId) => [memberId, 0]));

  for (const lineItem of lineItems) {
    const participantIds = Array.from(new Set(lineItem.participantIds.filter((memberId) => memberIdSet.has(memberId))));
    if (!participantIds.length) continue;
    const lineCents = Math.round(lineItem.amount * 100);
    const lineSplits = allocateCentsByWeight(participantIds, lineCents, participantIds.map(() => 1));
    for (const [memberId, share] of Object.entries(lineSplits)) {
      centsByMember[memberId] = (centsByMember[memberId] ?? 0) + Math.round(share * 100);
    }
  }

  return Object.fromEntries(memberIds.map((memberId) => [memberId, roundMoney((centsByMember[memberId] ?? 0) / 100)]));
}

export function expenseSplitsToMinor(splits: Record<string, number>): Record<string, number> {
  return Object.fromEntries(Object.entries(splits).map(([memberId, share]) => [memberId, Math.round(share * 100)]));
}

export function normalizeExpenseSplitsFromMinor(splits: Record<string, number>): Record<string, number> {
  return Object.fromEntries(Object.entries(splits).map(([memberId, shareMinor]) => [memberId, roundMoney(shareMinor / 100)]));
}

export function buildExpenseSummary(
  expenses: Expense[],
  currentMemberId: string,
  reminders: ExpenseReminder[] = [],
  options: BuildExpenseSummaryOptions = {},
): ExpenseSummary {
  const settlementCurrency = normalizeCurrency(options.settlementCurrency ?? "HKD");
  const memberIds = Array.from(new Set(expenses.flatMap((expense) => [expense.paidBy, ...Object.keys(expense.splits)])));
  const netByMember = Object.fromEntries(memberIds.map((id) => [id, 0]));
  let groupSpend = 0;

  for (const expense of expenses) {
    const exchangeRate = expenseExchangeRate(expense, settlementCurrency, options.exchangeRates);
    const settlementAmount = convertToSettlementCurrency(expense.amount, exchangeRate);
    if (expense.category !== "settlement") groupSpend += settlementAmount;
    netByMember[expense.paidBy] = roundMoney(netByMember[expense.paidBy] + settlementAmount);
    for (const [memberId, share] of Object.entries(expense.splits)) {
      netByMember[memberId] = roundMoney(netByMember[memberId] - convertToSettlementCurrency(share, exchangeRate));
    }
  }

  const currentNet = roundMoney(netByMember[currentMemberId] ?? 0);
  return {
    groupSpend: roundMoney(groupSpend),
    settlementCurrency,
    netByMember,
    currentUserNetLabel:
      currentNet > 0 ? `You are owed ${formatMoney(currentNet, settlementCurrency)}` : currentNet < 0 ? `You owe ${formatMoney(Math.abs(currentNet), settlementCurrency)}` : "You are settled",
    settlementSuggestions: attachReminderHistory(buildSettlementSuggestions(netByMember, settlementCurrency), reminders),
  };
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

export function upsertExpenseReminder(reminders: ExpenseReminder[], reminder: ExpenseReminder): ExpenseReminder[] {
  const reminderKey = expenseReminderKey(reminder);
  const nextReminders = reminders.filter((candidate) => expenseReminderKey(candidate) !== reminderKey);
  return [...nextReminders, reminder];
}

export function filterExpenseRemindersForTripPlan(
  reminders: ExpenseReminder[],
  tripPlanId: string | null | undefined,
  mainTripPlanId: string | null | undefined,
): ExpenseReminder[] {
  if (!tripPlanId) return reminders;
  return reminders.filter((reminder) => {
    const reminderTripPlanId = reminder.tripPlanId ?? mainTripPlanId ?? null;
    return reminderTripPlanId === tripPlanId;
  });
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

export function expenseAmountInSettlementCurrency(expense: Expense, settlementCurrency = "HKD", exchangeRates?: Record<string, number>): number {
  return convertToSettlementCurrency(expense.amount, expenseExchangeRate(expense, settlementCurrency, exchangeRates));
}

function buildSettlementSuggestions(netByMember: Record<string, number>, settlementCurrency: string): SettlementSuggestion[] {
  const creditors = Object.entries(netByMember)
    .map(([id, net]) => ({ id, cents: Math.round(net * 100) }))
    .filter((entry) => entry.cents > 0)
    .sort((a, b) => b.cents - a.cents);
  const debtors = Object.entries(netByMember)
    .map(([id, net]) => ({ id, cents: Math.round(-net * 100) }))
    .filter((entry) => entry.cents > 0)
    .sort((a, b) => b.cents - a.cents);
  const suggestions: SettlementSuggestion[] = [];

  let debtorIndex = 0;
  let creditorIndex = 0;
  while (debtorIndex < debtors.length && creditorIndex < creditors.length) {
    const cents = Math.min(debtors[debtorIndex].cents, creditors[creditorIndex].cents);
    suggestions.push({ from: debtors[debtorIndex].id, to: creditors[creditorIndex].id, amount: cents / 100, currency: settlementCurrency });
    debtors[debtorIndex].cents -= cents;
    creditors[creditorIndex].cents -= cents;
    if (debtors[debtorIndex].cents === 0) debtorIndex += 1;
    if (creditors[creditorIndex].cents === 0) creditorIndex += 1;
  }

  return suggestions;
}

function attachReminderHistory(suggestions: SettlementSuggestion[], reminders: ExpenseReminder[]): SettlementSuggestion[] {
  const remindersByKey = new Map(reminders.map((reminder) => [expenseReminderKey(reminder), reminder]));
  return suggestions.map((suggestion) => {
    const reminder = remindersByKey.get(expenseReminderKey(suggestion));
    return reminder ? { ...suggestion, lastRemindedAt: reminder.lastRemindedAt } : suggestion;
  });
}

function expenseReminderKey(input: Pick<ExpenseReminder, "tripPlanId" | "from" | "to" | "amount">): string {
  return `${input.tripPlanId ?? ""}|${input.from}|${input.to}|${Math.round(input.amount * 100)}`;
}

function formatExpenseComments(comments: ExpenseComment[], members: Member[]): string[] {
  const memberNames = new Map(members.map((member) => [member.id, member.displayName]));
  return comments
    .filter((comment) => comment.body.trim())
    .map((comment) => `${memberName(memberNames, comment.authorId)}: ${comment.body.trim()}`);
}

function expenseExchangeRate(expense: Expense, settlementCurrency: string, exchangeRates?: Record<string, number>): number {
  const currency = normalizeCurrency(expense.currency ?? settlementCurrency);
  if (currency === settlementCurrency) return 1;
  const directRate = expense.exchangeRateToSettlementCurrency;
  if (typeof directRate === "number" && Number.isFinite(directRate) && directRate > 0) return directRate;
  const configuredRate = exchangeRates?.[currency];
  return typeof configuredRate === "number" && Number.isFinite(configuredRate) && configuredRate > 0 ? configuredRate : 1;
}

function convertToSettlementCurrency(amount: number, exchangeRate: number): number {
  return roundMoney(amount * exchangeRate);
}

function allocateCentsByWeight(memberIds: string[], totalCents: number, weights: number[]): Record<string, number> {
  const weightTotal = weights.reduce((sum, weight) => sum + weight, 0);
  if (weightTotal <= 0 || totalCents <= 0) return Object.fromEntries(memberIds.map((memberId) => [memberId, 0]));

  const rawShares = memberIds.map((memberId, index) => {
    const raw = totalCents * (weights[index] / weightTotal);
    const cents = Math.floor(raw);
    return { memberId, cents, remainder: raw - cents };
  });
  let remaining = totalCents - rawShares.reduce((sum, share) => sum + share.cents, 0);
  const byRemainder = [...rawShares].sort((a, b) => b.remainder - a.remainder);
  for (const share of byRemainder) {
    if (remaining <= 0) break;
    share.cents += 1;
    remaining -= 1;
  }

  return Object.fromEntries(rawShares.map((share) => [share.memberId, roundMoney(share.cents / 100)]));
}

function allocateCentsByRawShares(memberIds: string[], rawCentsByMember: number[]): Record<string, number> {
  const rawShares = memberIds.map((memberId, index) => {
    const rawCents = Math.max(0, rawCentsByMember[index] ?? 0);
    const cents = Math.floor(rawCents);
    return { memberId, cents, remainder: rawCents - cents };
  });
  let remaining = Math.round(rawCentsByMember.reduce((sum, rawCents) => sum + Math.max(0, rawCents), 0)) - rawShares.reduce((sum, share) => sum + share.cents, 0);
  const byRemainder = [...rawShares].sort((a, b) => b.remainder - a.remainder);
  for (const share of byRemainder) {
    if (remaining <= 0) break;
    share.cents += 1;
    remaining -= 1;
  }

  return Object.fromEntries(rawShares.map((share) => [share.memberId, roundMoney(share.cents / 100)]));
}

function memberName(memberNames: Map<string, string>, memberId: string): string {
  return memberNames.get(memberId) ?? memberId;
}

function sumSplits(splits: Record<string, number>): number {
  return roundMoney(Object.values(splits).reduce((sum, split) => sum + split, 0));
}

function formatMoney(amount: number, currency = "HKD"): string {
  const normalizedCurrency = normalizeCurrency(currency);
  const prefixByCurrency: Record<string, string> = {
    CNY: "CN¥",
    HKD: "HK$",
    THB: "฿",
    USD: "US$",
  };
  const prefix = prefixByCurrency[normalizedCurrency] ?? `${normalizedCurrency} `;
  const sign = amount < 0 ? "-" : "";
  return `${sign}${prefix}${Math.abs(roundMoney(amount)).toLocaleString("en-US", { maximumFractionDigits: 2, minimumFractionDigits: 2 })}`;
}

function csvCell(value: string): string {
  return `"${value.replaceAll("\"", "\"\"")}"`;
}

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

function normalizeCurrency(currency: string): string {
  const normalized = currency.trim().toUpperCase();
  return /^[A-Z]{3}$/.test(normalized) ? normalized : "HKD";
}
