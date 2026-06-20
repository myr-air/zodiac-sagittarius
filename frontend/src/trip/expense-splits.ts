import { roundMoney } from "./expense-money";
import type { ExpenseLineItem } from "./types";

export const expenseSplitModeValues = [
  "equal",
  "exact",
  "shares",
  "percentage",
  "itemized",
] as const;
export type ExpenseSplitMode = (typeof expenseSplitModeValues)[number];

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
