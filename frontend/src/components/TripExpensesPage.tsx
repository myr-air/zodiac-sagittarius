import { type FormEvent, useEffect, useMemo, useState } from "react";
import { useI18n } from "@/src/i18n/I18nProvider";
import { cn } from "@/src/lib/cn";
import {
  buildExpenseCsv,
  buildExpenseStatement,
  buildExpenseSplits,
  buildItemizedExpenseSplits,
  buildPaybackReminder,
  expenseAmountInSettlementCurrency,
  type ExpenseSplitMode,
} from "@/src/trip/expenses";
import { fetchMajorExchangeRate, majorCurrencyOptions, normalizeCurrencyCode } from "@/src/trip/currencies";
import type { Expense, ExpenseComment, ExpenseLineItem, ExpenseSummary, Member, SettlementSuggestion, Trip } from "@/src/trip/types";
import { Icon } from "./icons";
import { TravelMotif } from "./motifs";
import { formatTripRange, PageHeader, PageUserCard } from "./PageHeader";
import { Button, IconButton } from "./ui";

interface TripExpensesPageProps {
  trip: Trip;
  currentMember: Member;
  expenseSummary: ExpenseSummary;
  canEditExpenses: boolean;
  selectedTripPlanId?: string | null;
  apiBaseUrl?: string;
  onCreateExpense: (input: ExpenseInput) => void | Promise<void>;
  onUpdateExpense: (input: ExpenseUpdateInput) => void | Promise<void>;
  onDeleteExpense: (expenseId: string) => void;
  onDuplicateExpenseAsEstimate?: (expense: Expense) => void | Promise<void>;
  onRecordPaybackReminder?: (suggestion: SettlementSuggestion) => void | Promise<void>;
}

export interface ExpenseInput {
  itemId: string | null;
  tripPlanId?: string | null;
  title: string;
  amount: number;
  currency: string;
  exchangeRateToSettlementCurrency?: number;
  notes?: string;
  receiptUrl?: string | null;
  lineItems?: ExpenseLineItem[];
  comments?: ExpenseComment[];
  repeatCount?: number;
  paidBy: string;
  category: Expense["category"];
  splits: Record<string, number>;
}

export interface ExpenseUpdateInput extends ExpenseInput {
  expenseId: string;
}

const categories = ["food", "transport", "tickets", "stay", "shopping", "settlement"] satisfies Expense["category"][];
const splitModes = ["equal", "exact", "shares", "percentage", "itemized"] satisfies ExpenseSplitMode[];

const expensesPageClassName = "expenses-page grid min-h-full min-w-0 grid-rows-[auto_minmax(0,1fr)] gap-3 bg-transparent px-6 py-[22px] pb-7 max-[767px]:px-3 max-[767px]:py-4";
const expensesSummaryClassName = "expenses-summary grid grid-cols-4 gap-3 max-[1199px]:grid-cols-2 max-[767px]:grid-cols-1";
const statClassName = "expense-stat grid min-h-[104px] gap-1 rounded-(--radius-md) border border-[color-mix(in_srgb,var(--color-primary-border)_52%,var(--color-border))] bg-[linear-gradient(145deg,rgb(255_255_255)_0%,color-mix(in_srgb,var(--color-primary-soft)_42%,var(--color-surface))_100%)] p-3.5 shadow-[0_1px_0_rgb(15_23_42_/_0.04)] [&_.icon]:text-(--color-primary) [&>span]:text-xs [&>span]:font-bold [&>span]:text-(--color-text-muted) [&>strong]:text-2xl [&>strong]:font-extrabold [&>strong]:tabular-nums [&>strong]:text-(--color-text)";
const contentGridClassName = "expenses-content grid min-h-0 grid-cols-[332px_minmax(0,1fr)] gap-3 max-[1199px]:grid-cols-1";
const panelClassName = "expenses-panel grid min-h-0 gap-3 rounded-(--radius-lg) border border-[color-mix(in_srgb,var(--color-route-border)_48%,var(--color-border))] bg-[linear-gradient(180deg,rgb(255_255_255)_0%,color-mix(in_srgb,var(--color-route-soft)_30%,var(--color-surface))_100%)] p-3.5 shadow-[0_1px_0_rgb(15_23_42_/_0.04)]";
const panelHeadingClassName = "m-0 flex items-center gap-2 text-[14px] font-extrabold leading-5 text-(--color-text)";
const balanceListClassName = "grid gap-2";
const balanceRowClassName = "grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 rounded-(--radius-md) border border-[color-mix(in_srgb,var(--color-border)_78%,var(--color-route-border))] bg-[rgb(255_255_255_/_0.84)] px-2.5 py-2 text-xs shadow-[0_1px_0_rgb(15_23_42_/_0.035)]";
const settlementRowClassName = "grid grid-cols-1 items-start gap-2 rounded-(--radius-md) border border-(--color-warning-border) bg-(--color-warning-soft) px-2.5 py-2 text-xs";
const balanceActionsClassName = "inline-flex flex-wrap items-center justify-start gap-1.5";
const balanceNameClassName = "font-extrabold text-(--color-text)";
const balanceMetaClassName = "text-(--color-text-muted)";
const amountClassName = "font-extrabold tabular-nums";
const positiveClassName = "text-[#15803d]";
const negativeClassName = "text-[#b91c1c]";
const commandBarClassName = "expenses-command-bar grid content-start gap-3 rounded-(--radius-lg) border border-[color-mix(in_srgb,var(--color-primary-border)_52%,var(--color-border))] bg-[linear-gradient(135deg,rgb(255_255_255)_0%,color-mix(in_srgb,var(--color-route-soft)_54%,var(--color-surface))_100%)] p-3.5 shadow-[0_1px_0_rgb(15_23_42_/_0.04)] max-[767px]:p-3";
const filterGridClassName = "grid grid-cols-[minmax(180px,1fr)_minmax(150px,220px)_minmax(150px,220px)_auto] items-end gap-2 max-[1199px]:grid-cols-2 max-[767px]:grid-cols-1";
const commandActionsClassName = "expenses-command-actions flex flex-wrap items-center gap-2 max-[767px]:[&>*]:flex-[1_1_180px]";
const copyFeedbackClassName = "expense-copy-feedback inline-flex min-h-9 items-center justify-center rounded-(--radius-sm) border border-(--color-border) bg-(--color-surface-subtle) px-3 text-xs font-extrabold leading-4 text-(--color-text-muted) data-[state=copied]:border-(--color-success-border) data-[state=copied]:bg-(--color-success-soft) data-[state=copied]:text-(--color-success) data-[state=error]:border-(--color-danger-border) data-[state=error]:bg-(--color-danger-soft) data-[state=error]:text-(--color-danger)";
const fieldClassName = "grid min-w-0 gap-1.5 [&>span]:text-[11px] [&>span]:font-extrabold [&>span]:text-(--color-text-muted) [&_input]:min-h-10 [&_input]:rounded-(--radius-md) [&_input]:border [&_input]:border-(--color-border) [&_input]:bg-(--color-surface) [&_input]:px-3 [&_input]:text-sm [&_select]:min-h-10 [&_select]:rounded-(--radius-md) [&_select]:border [&_select]:border-(--color-border) [&_select]:bg-(--color-surface) [&_select]:px-3 [&_select]:text-sm [&_textarea]:min-h-[74px] [&_textarea]:resize-y [&_textarea]:rounded-(--radius-md) [&_textarea]:border [&_textarea]:border-(--color-border) [&_textarea]:bg-(--color-surface) [&_textarea]:px-3 [&_textarea]:py-2 [&_textarea]:text-sm";
const tableWrapClassName = "expenses-table-wrap min-h-0 overflow-auto rounded-(--radius-lg) border border-[color-mix(in_srgb,var(--color-route-border)_42%,var(--color-border))] bg-(--color-surface) p-2 shadow-[0_1px_0_rgb(15_23_42_/_0.04)]";
const tableClassName = "expense-ledger-table w-full min-w-[780px] border-separate border-spacing-y-2 text-left text-sm";
const tableHeaderClassName = "sticky top-0 z-[1] bg-(--color-surface-subtle) text-[11px] font-black uppercase text-(--color-text-muted) [&_th]:px-3 [&_th]:py-2";
const tableBodyClassName = "[&_td]:border-y [&_td]:border-[rgb(15_23_42_/_0.08)] [&_td]:bg-(--color-surface) [&_td]:px-3 [&_td]:py-3 [&_td:first-child]:rounded-l-(--radius-md) [&_td:first-child]:border-l [&_td:last-child]:rounded-r-(--radius-md) [&_td:last-child]:border-r [&_tr:hover_td]:bg-(--color-surface-subtle)";
const tableTitleClassName = "grid gap-1 [&_strong]:text-(--color-text) [&_span]:text-xs [&_span]:text-(--color-text-muted)";
const actionCellClassName = "inline-flex items-center gap-1.5";
const memberLineClassName = "grid min-w-0 grid-cols-[34px_minmax(0,1fr)] items-center gap-2";
const avatarClassName = "inline-grid size-[34px] place-items-center rounded-full border border-white text-[11px] font-black text-white shadow-[0_6px_14px_rgb(15_23_42_/_0.16)]";
const categoryBadgeClassName = "inline-flex min-h-6 w-fit items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-extrabold capitalize";
const categoryDotClassName = "inline-block size-2 rounded-full";
const ledgerAmountClassName = "inline-flex min-h-8 items-center rounded-(--radius-sm) bg-(--color-primary-soft) px-2.5 text-[13px] font-black tabular-nums text-(--color-primary-strong)";
const dialogBackdropClassName = "modal-backdrop fixed inset-0 z-20 grid place-items-center bg-[rgb(15_23_42_/_0.28)] p-4";
const dialogClassName = "expense-dialog grid max-h-[min(720px,calc(100vh_-_32px))] w-full max-w-[760px] grid-rows-[auto_minmax(0,1fr)] overflow-hidden rounded-(--radius-md) border border-(--color-border) bg-(--color-surface) shadow-[0_10px_18px_rgb(15_23_42_/_0.14)]";
const dialogHeaderClassName = "grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-b border-(--color-border) px-4 py-3 [&_h2]:m-0 [&_h2]:text-lg [&_h2]:font-extrabold";
const dialogFormClassName = "grid min-h-0 gap-3 overflow-y-auto p-4";
const dialogGridClassName = "grid grid-cols-2 gap-3 max-[767px]:grid-cols-1";
const splitGridClassName = "grid grid-cols-2 gap-2 max-[767px]:grid-cols-1";
const itemizedListClassName = "grid gap-2";
const itemizedLineClassName = "grid gap-2 rounded-(--radius-sm) border border-(--color-border) bg-(--color-surface-subtle) p-2.5";
const participantChecksClassName = "grid grid-cols-3 gap-2 max-[767px]:grid-cols-1 [&_label]:inline-flex [&_label]:items-center [&_label]:gap-2 [&_label]:text-xs [&_label]:font-bold [&_input]:size-4";
const commentsClassName = "grid gap-2 rounded-(--radius-sm) border border-(--color-border) bg-(--color-surface-subtle) p-2.5";
const commentRowClassName = "grid gap-0.5 rounded-(--radius-sm) bg-(--color-surface) px-2.5 py-2 text-xs [&_strong]:text-(--color-text) [&_span]:text-(--color-text-muted)";
const warningClassName = "rounded-(--radius-sm) border border-(--color-warning-border) bg-(--color-warning-soft) px-2.5 py-2 text-xs font-bold text-(--color-warning-strong)";
const dialogActionsClassName = "flex flex-wrap items-center justify-end gap-2 border-t border-(--color-border) pt-3";

export function TripExpensesPage({
  trip,
  currentMember,
  expenseSummary,
  canEditExpenses,
  selectedTripPlanId,
  apiBaseUrl = "",
  onCreateExpense,
  onUpdateExpense,
  onDeleteExpense,
  onDuplicateExpenseAsEstimate,
  onRecordPaybackReminder,
}: TripExpensesPageProps) {
  const { locale, t } = useI18n();
  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<"all" | Expense["category"]>("all");
  const [payerFilter, setPayerFilter] = useState("all");
  const [dialogExpense, setDialogExpense] = useState<Expense | "new" | null>(null);
  const [copyState, setCopyState] = useState<"idle" | "copied" | "error">("idle");
  const settlementCurrency = expenseSummary.settlementCurrency ?? "HKD";
  const currentNet = expenseSummary.netByMember[currentMember.id] ?? 0;
  const youOwe = Math.max(0, -currentNet);
  const owedToYou = Math.max(0, currentNet);
  const statement = useMemo(() => buildExpenseStatement({ trip, expenseSummary }), [expenseSummary, trip]);
  const csv = useMemo(() => buildExpenseCsv({ trip, expenseSummary }), [expenseSummary, trip]);
  const categorySpend = useMemo(() => {
    const totals = new Map<Expense["category"], number>();
    for (const expense of trip.expenses) {
      if (expense.category === "settlement") continue;
      totals.set(expense.category, (totals.get(expense.category) ?? 0) + expenseAmountInSettlementCurrency(expense, settlementCurrency));
    }
    return Array.from(totals.entries()).sort((a, b) => b[1] - a[1]);
  }, [settlementCurrency, trip.expenses]);
  const filteredExpenses = useMemo(
    () =>
      trip.expenses.filter((expense) => {
        const normalizedQuery = query.trim().toLocaleLowerCase();
        const payer = memberById(trip.members, expense.paidBy);
        const linkedItem = expense.itineraryItemId ? trip.itineraryItems.find((item) => item.id === expense.itineraryItemId) : null;
        const matchesQuery =
          !normalizedQuery ||
          expense.title.toLocaleLowerCase().includes(normalizedQuery) ||
          payer?.displayName.toLocaleLowerCase().includes(normalizedQuery) ||
          linkedItem?.activity.toLocaleLowerCase().includes(normalizedQuery);
        const matchesCategory = categoryFilter === "all" || expense.category === categoryFilter;
        const matchesPayer = payerFilter === "all" || expense.paidBy === payerFilter;
        return matchesQuery && matchesCategory && matchesPayer;
      }),
    [categoryFilter, payerFilter, query, trip.expenses, trip.itineraryItems, trip.members],
  );

  useEffect(() => {
    if (copyState === "idle") return undefined;
    const timeout = window.setTimeout(() => setCopyState("idle"), 2500);
    return () => window.clearTimeout(timeout);
  }, [copyState]);

  function clearFilters() {
    setQuery("");
    setCategoryFilter("all");
    setPayerFilter("all");
  }

  async function copyStatement() {
    try {
      await navigator.clipboard.writeText(statement);
      setCopyState("copied");
    } catch {
      setCopyState("error");
    }
  }

  async function copyPaybackReminder(suggestion: SettlementSuggestion) {
    try {
      await navigator.clipboard.writeText(buildPaybackReminder({ trip, suggestion }));
      await onRecordPaybackReminder?.(suggestion);
      setCopyState("copied");
    } catch {
      setCopyState("error");
    }
  }

  function downloadCsv() {
    const blob = new Blob([`${csv}\n`], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = window.document.createElement("a");
    anchor.href = url;
    anchor.download = `${slugifyFilePart(trip.name)}-expenses.csv`;
    window.document.body.append(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  }

  function recordSettlement(suggestion: SettlementSuggestion) {
    const from = memberById(trip.members, suggestion.from);
    const to = memberById(trip.members, suggestion.to);
    onCreateExpense({
      itemId: null,
      title: `${from?.displayName ?? "Traveler"} paid ${to?.displayName ?? "Traveler"} back`,
      amount: suggestion.amount,
      currency: suggestion.currency ?? settlementCurrency,
      exchangeRateToSettlementCurrency: 1,
      paidBy: suggestion.from,
      category: "settlement",
      splits: { [suggestion.to]: suggestion.amount },
    });
  }

  return (
    <section className={expensesPageClassName} aria-label={t.expenses.pageLabel}>
      <PageHeader
        title={t.expenses.title}
        subtitle={trip.name}
        meta={(
          <>
            <span><Icon name="calendar" /> {formatTripRange(trip.startDate, trip.endDate, locale)}</span>
            <span><Icon name="users" /> {t.dates.memberCount({ count: trip.members.length })}</span>
          </>
        )}
        motif={<TravelMotif tone="route" />}
        aside={<PageUserCard color={currentMember.color} name={currentMember.displayName} label={canEditExpenses ? t.expenses.canEdit : t.expenses.readOnly} />}
      />

      <div className={expensesSummaryClassName} aria-label={t.expenses.summaryLabel} role="region">
        <SummaryStat icon="wallet" label={t.expenses.stats.tripSpend} value={formatMoney(expenseSummary.groupSpend, settlementCurrency)} />
        <SummaryStat icon="check" label={t.expenses.stats.yourBalance} value={expenseSummary.currentUserNetLabel} tone={currentNet < 0 ? "negative" : currentNet > 0 ? "positive" : "neutral"} />
        <SummaryStat icon="users" label={t.expenses.stats.owedToYou} value={formatMoney(owedToYou, settlementCurrency)} tone="positive" />
        <SummaryStat icon="warning" label={t.expenses.stats.youOwe} value={formatMoney(youOwe, settlementCurrency)} tone="negative" />
      </div>

      <div className={contentGridClassName}>
        <div className="grid content-start gap-3">
          <section className={panelClassName} aria-label={t.expenses.balanceLabel}>
            <h2 className={panelHeadingClassName}><Icon name="users" /> {t.expenses.panels.balances}</h2>
            <div className={balanceListClassName}>
              {trip.members.map((member) => {
                const net = expenseSummary.netByMember[member.id] ?? 0;
                return (
                  <div className={balanceRowClassName} key={member.id}>
                    <span className={memberLineClassName}>
                      <span className={avatarClassName} style={{ backgroundColor: member.color }} aria-hidden="true">{memberInitial(member.displayName)}</span>
                      <span className="min-w-0">
                        <span className={balanceNameClassName}>{member.displayName}</span>
                        <br />
                        <span className={balanceMetaClassName}>
                          {net > 0
                              ? t.expenses.balance.owed({ name: member.displayName, amount: formatMoney(net, settlementCurrency) })
                            : net < 0
                              ? t.expenses.balance.owes({ name: member.displayName, amount: formatMoney(Math.abs(net), settlementCurrency) })
                              : t.expenses.balance.settled({ name: member.displayName })}
                        </span>
                      </span>
                    </span>
                    <strong className={cn(amountClassName, net > 0 && positiveClassName, net < 0 && negativeClassName)}>{formatMoney(net, settlementCurrency)}</strong>
                  </div>
                );
              })}
            </div>
          </section>

          <section className={panelClassName} aria-label={t.expenses.panels.settle}>
            <h2 className={panelHeadingClassName}><Icon name="wallet" /> {t.expenses.panels.settle}</h2>
            {expenseSummary.settlementSuggestions.length ? (
              <div className={balanceListClassName}>
                {expenseSummary.settlementSuggestions.map((suggestion) => {
                  const from = memberById(trip.members, suggestion.from);
                  const to = memberById(trip.members, suggestion.to);
                  return (
                    <div className={settlementRowClassName} key={`${suggestion.from}-${suggestion.to}-${suggestion.amount}`}>
                      <span className={balanceMetaClassName}>
                        {t.expenses.balance.payback({
                          from: from?.displayName ?? suggestion.from,
                          to: to?.displayName ?? suggestion.to,
                          amount: formatMoney(suggestion.amount, suggestion.currency ?? settlementCurrency),
                        })}
                      </span>
                      {suggestion.lastRemindedAt ? (
                        <span className={balanceMetaClassName}>
                          {t.expenses.reminders.lastSent({ date: formatReminderDate(suggestion.lastRemindedAt, locale) })}
                        </span>
                      ) : null}
                      <span className={balanceActionsClassName}>
                        <Button type="button" variant="ghost" className="min-h-8 px-2 py-1 text-xs" onClick={() => void copyPaybackReminder(suggestion)}>
                          <Icon name="copy" /> {t.expenses.actions.copyReminder}
                        </Button>
                        <Button type="button" variant="ghost" className="min-h-8 px-2 py-1 text-xs" disabled={!canEditExpenses} onClick={() => recordSettlement(suggestion)}>
                          {t.expenses.actions.saveSettlement}
                        </Button>
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className={balanceMetaClassName}>{t.expenses.balance.noPaybacks}</p>
            )}
          </section>

          <section className={panelClassName} aria-label={t.expenses.panels.categories}>
            <h2 className={panelHeadingClassName}><Icon name="list" /> {t.expenses.panels.categories}</h2>
            <div className={balanceListClassName}>
              {categorySpend.map(([category, amount]) => {
                const tone = categoryTone(category);
                return (
                  <div className={balanceRowClassName} key={category}>
                    <span className={categoryBadgeClassName} style={{ backgroundColor: tone.background, borderColor: tone.border, color: tone.text }}>
                      <span className={categoryDotClassName} style={{ backgroundColor: tone.dot }} aria-hidden="true" />
                      {category}
                    </span>
                    <strong className={amountClassName}>{formatMoney(amount, settlementCurrency)}</strong>
                  </div>
                );
              })}
            </div>
          </section>
        </div>

        <section className="grid min-h-0 content-start gap-3" aria-label={t.expenses.ledgerLabel}>
          <div className={commandBarClassName}>
            <div className={filterGridClassName}>
              <label className={fieldClassName}>
                <span>{t.expenses.filters.search}</span>
                <input value={query} placeholder={t.expenses.filters.searchPlaceholder} onChange={(event) => setQuery(event.target.value)} />
              </label>
              <label className={fieldClassName}>
                <span>{t.expenses.filters.category}</span>
                <select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value as "all" | Expense["category"])}>
                  <option value="all">{t.expenses.filters.allCategories}</option>
                  {categories.map((category) => <option key={category} value={category}>{category}</option>)}
                </select>
              </label>
              <label className={fieldClassName}>
                <span>{t.expenses.filters.payer}</span>
                <select value={payerFilter} onChange={(event) => setPayerFilter(event.target.value)}>
                  <option value="all">{t.expenses.filters.allPayers}</option>
                  {trip.members.map((member) => <option key={member.id} value={member.id}>{member.displayName}</option>)}
                </select>
              </label>
              <Button type="button" variant="ghost" onClick={clearFilters}>{t.expenses.actions.clearFilters}</Button>
            </div>
            <div className={commandActionsClassName}>
              <Button type="button" variant="ghost" onClick={() => void copyStatement()}>
                <Icon name="copy" /> {t.expenses.actions.copyStatement}
              </Button>
              <Button type="button" variant="ghost" onClick={downloadCsv}>
                <Icon name="export" /> {t.expenses.actions.downloadCsv}
              </Button>
              <Button type="button" disabled={!canEditExpenses} onClick={() => setDialogExpense("new")}>
                <Icon name="plus" /> {t.expenses.actions.addExpense}
              </Button>
              <span className={copyFeedbackClassName} data-state={copyState} role="status" aria-label={t.expenses.copy.statusLabel}>
                {copyState === "copied" ? t.common.status.copied : copyState === "error" ? t.common.status.copyFailed : t.expenses.copy.ready}
              </span>
            </div>
          </div>

          <div className={tableWrapClassName}>
            <table className={tableClassName} aria-label={t.expenses.ledgerLabel}>
              <thead className={tableHeaderClassName}>
                <tr>
                  <th>{t.expenses.table.expense}</th>
                  <th>{t.expenses.table.amount}</th>
                  <th>{t.expenses.table.paidBy}</th>
                  <th>{t.expenses.table.split}</th>
                  <th>{t.expenses.table.linkedStop}</th>
                  <th>{t.expenses.table.actions}</th>
                </tr>
              </thead>
              <tbody className={tableBodyClassName}>
                {filteredExpenses.map((expense) => {
                  const payer = memberById(trip.members, expense.paidBy);
                  const linkedItem = expense.itineraryItemId ? trip.itineraryItems.find((item) => item.id === expense.itineraryItemId) : null;
                  const tone = categoryTone(expense.category);
                  return (
                    <tr key={expense.id}>
                      <td className={tableTitleClassName}>
                        <strong>{expense.title}</strong>
                        <span className={categoryBadgeClassName} style={{ backgroundColor: tone.background, borderColor: tone.border, color: tone.text }}>
                          <span className={categoryDotClassName} style={{ backgroundColor: tone.dot }} aria-hidden="true" />
                          {expense.category}
                        </span>
                      </td>
                      <td><span className={ledgerAmountClassName}>{formatMoney(expense.amount, expense.currency ?? settlementCurrency)}</span></td>
                      <td>
                        {payer ? (
                          <span className={memberLineClassName}>
                            <span className={avatarClassName} style={{ backgroundColor: payer.color }} aria-hidden="true">{memberInitial(payer.displayName)}</span>
                            <span className={balanceNameClassName}>{payer.displayName}</span>
                          </span>
                        ) : expense.paidBy}
                      </td>
                      <td>{formatMoney(sumShares(expense.splits), expense.currency ?? settlementCurrency)}</td>
                      <td>{linkedItem?.activity ?? t.expenses.uncategorizedStop}</td>
                      <td>
                        <span className={actionCellClassName}>
                          <IconButton type="button" aria-label={t.expenses.actions.editExpense({ title: expense.title })} disabled={!canEditExpenses} onClick={() => setDialogExpense(expense)}>
                            <Icon name="edit" />
                          </IconButton>
                          <IconButton
                            type="button"
                            aria-label={t.expenses.actions.duplicateAsEstimate({ title: expense.title })}
                            disabled={!canEditExpenses || !onDuplicateExpenseAsEstimate}
                            onClick={() => void onDuplicateExpenseAsEstimate?.(expense)}
                          >
                            <Icon name="copy" />
                          </IconButton>
                          <IconButton type="button" aria-label={t.expenses.actions.deleteExpense({ title: expense.title })} disabled={!canEditExpenses} onClick={() => onDeleteExpense(expense.id)}>
                            <Icon name="trash" />
                          </IconButton>
                        </span>
                      </td>
                    </tr>
                  );
                })}
                {!filteredExpenses.length ? (
                  <tr>
                    <td colSpan={6}>{t.expenses.empty}</td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {dialogExpense ? (
        <ExpenseDialog
          expense={dialogExpense === "new" ? null : dialogExpense}
          trip={trip}
          currentMember={currentMember}
          settlementCurrency={settlementCurrency}
          selectedTripPlanId={selectedTripPlanId}
          apiBaseUrl={apiBaseUrl}
          onClose={() => setDialogExpense(null)}
          onCreateExpense={async (input) => {
            await onCreateExpense(input);
            setDialogExpense(null);
          }}
          onUpdateExpense={async (input) => {
            await onUpdateExpense(input);
            setDialogExpense(null);
          }}
        />
      ) : null}
    </section>
  );
}

function SummaryStat({ icon, label, value, tone = "neutral" }: { icon: "wallet" | "check" | "users" | "warning"; label: string; value: string; tone?: "positive" | "negative" | "neutral" }) {
  return (
    <div className={statClassName}>
      <Icon name={icon} />
      <span>{label}</span>
      <strong className={cn(tone === "positive" && positiveClassName, tone === "negative" && negativeClassName)}>{value}</strong>
    </div>
  );
}

function ExpenseDialog({
  expense,
  trip,
  currentMember,
  settlementCurrency,
  selectedTripPlanId,
  apiBaseUrl,
  onClose,
  onCreateExpense,
  onUpdateExpense,
}: {
  expense: Expense | null;
  trip: Trip;
  currentMember: Member;
  settlementCurrency: string;
  selectedTripPlanId?: string | null;
  apiBaseUrl: string;
  onClose: () => void;
  onCreateExpense: (input: ExpenseInput) => void | Promise<void>;
  onUpdateExpense: (input: ExpenseUpdateInput) => void | Promise<void>;
}) {
  const { t } = useI18n();
  const [title, setTitle] = useState(expense?.title ?? "");
  const [amount, setAmount] = useState(expense ? String(expense.amount) : "");
  const [currency, setCurrency] = useState(normalizeCurrencyCode(expense?.currency ?? "HKD"));
  const [exchangeRate, setExchangeRate] = useState(expense?.exchangeRateToSettlementCurrency ? String(expense.exchangeRateToSettlementCurrency) : "1");
  const [exchangeRateTouched, setExchangeRateTouched] = useState(Boolean(expense?.exchangeRateToSettlementCurrency));
  const [notes, setNotes] = useState(expense?.notes ?? "");
  const [receiptUrl, setReceiptUrl] = useState(expense?.receiptUrl ?? "");
  const [comments, setComments] = useState<ExpenseComment[]>(expense?.comments ?? []);
  const [commentDraft, setCommentDraft] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [repeatCount, setRepeatCount] = useState("1");
  const [paidBy, setPaidBy] = useState(expense?.paidBy ?? currentMember.id);
  const [category, setCategory] = useState<Expense["category"]>(expense?.category ?? "transport");
  const [itemId, setItemId] = useState(expense?.itineraryItemId ?? "");
  const [tripPlanId, setTripPlanId] = useState(
    expense?.tripPlanId ??
      selectedTripPlanId ??
      trip.mainTripPlanId ??
      trip.activePlanVariantId ??
      trip.tripPlans?.[0]?.id ??
      trip.planVariants[0]?.id ??
      "",
  );
  const [splitMode, setSplitMode] = useState<ExpenseSplitMode>(expense?.lineItems?.length ? "itemized" : expense ? "exact" : "equal");
  const [splitValues, setSplitValues] = useState<Record<string, string>>(
    Object.fromEntries(trip.members.map((member) => [member.id, expense ? String(expense.splits[member.id] ?? 0) : "0"])),
  );
  const [lineItems, setLineItems] = useState<EditableExpenseLineItem[]>(
    expense?.lineItems?.length
      ? expense.lineItems.map((lineItem) => ({
          ...lineItem,
          amount: String(lineItem.amount),
          participantIds: lineItem.participantIds.filter((memberId) => trip.members.some((member) => member.id === memberId)),
        }))
      : [emptyLineItem(trip.members, 1)],
  );
  const amountNumber = Number(amount);
  const exchangeRateNumber = Number(exchangeRate);
  const repeatCountNumber = Number(repeatCount);
  const hasValidRepeatCount = Boolean(expense) || (Number.isInteger(repeatCountNumber) && repeatCountNumber >= 1 && repeatCountNumber <= 31);
  const normalizedCurrency = normalizeCurrencyCode(currency);
  const needsExchangeRate = normalizedCurrency !== normalizeCurrencyCode(settlementCurrency);
  const hasValidExchangeRate = !needsExchangeRate || (Number.isFinite(exchangeRateNumber) && exchangeRateNumber > 0);
  const parsedSplitValues = Object.fromEntries(trip.members.map((member) => [member.id, Number(splitValues[member.id] || 0)]));
  const parsedLineItems = lineItems.map((lineItem, index) => ({
    id: lineItem.id || `line-${index + 1}`,
    title: lineItem.title.trim(),
    amount: Number(lineItem.amount || 0),
    participantIds: lineItem.participantIds,
  }));
  const validLineItems = parsedLineItems.filter((lineItem) => lineItem.title && Number.isFinite(lineItem.amount) && lineItem.amount > 0 && lineItem.participantIds.length > 0);
  const splits = Number.isFinite(amountNumber) && amountNumber >= 0
    ? splitMode === "itemized"
      ? buildItemizedExpenseSplits({ lineItems: validLineItems, memberIds: trip.members.map((member) => member.id) })
      : buildExpenseSplits({ amount: amountNumber, memberIds: trip.members.map((member) => member.id), mode: splitMode, valuesByMember: parsedSplitValues })
    : {};
  const splitTotal = sumShares(splits);
  const splitMismatch = (splitMode === "exact" || splitMode === "percentage" || splitMode === "itemized") && Math.abs(splitTotal - amountNumber) > 0.01;
  const invalidItemizedLines = splitMode === "itemized" && (!validLineItems.length || validLineItems.length !== lineItems.length);
  const linkedItem = itemId ? trip.itineraryItems.find((item) => item.id === itemId) : null;
  const effectiveTripPlanId = linkedItem?.planVariantId ?? tripPlanId;
  const tripPlanOptions = trip.tripPlans ?? trip.planVariants;

  useEffect(() => {
    let cancelled = false;
    if (!needsExchangeRate || exchangeRateTouched) return;

    fetchMajorExchangeRate(normalizedCurrency, normalizeCurrencyCode(settlementCurrency), {
      backendBaseUrl: apiBaseUrl,
    })
      .then((quote) => {
        if (!cancelled && quote) {
          setExchangeRate(formatExchangeRateInput(quote.rate));
        }
      })
      .catch(() => {
        // Keep manual exchange-rate entry available when the provider is offline.
      });

    return () => {
      cancelled = true;
    };
  }, [apiBaseUrl, exchangeRateTouched, needsExchangeRate, normalizedCurrency, settlementCurrency]);

  function changeSplitMode(nextMode: ExpenseSplitMode) {
    setSplitMode(nextMode);
    if (nextMode === "exact") {
      setSplitValues(Object.fromEntries(trip.members.map((member) => [member.id, "0"])));
    } else if (nextMode === "shares") {
      setSplitValues(Object.fromEntries(trip.members.map((member) => [member.id, "1"])));
    } else if (nextMode === "percentage") {
      setSplitValues(Object.fromEntries(trip.members.map((member) => [member.id, "0"])));
    } else if (nextMode === "itemized" && !lineItems.length) {
      setLineItems([emptyLineItem(trip.members, 1)]);
    }
  }

  function updateLineItem(index: number, patch: Partial<EditableExpenseLineItem>) {
    setLineItems((current) => current.map((lineItem, candidateIndex) => (candidateIndex === index ? { ...lineItem, ...patch } : lineItem)));
  }

  function toggleLineParticipant(index: number, memberId: string) {
    setLineItems((current) => current.map((lineItem, candidateIndex) => {
      if (candidateIndex !== index) return lineItem;
      const participantIds = lineItem.participantIds.includes(memberId)
        ? lineItem.participantIds.filter((participantId) => participantId !== memberId)
        : [...lineItem.participantIds, memberId];
      return { ...lineItem, participantIds };
    }));
  }

  function addLineItem() {
    setLineItems((current) => [...current, emptyLineItem(trip.members, current.length + 1)]);
  }

  function addComment() {
    const body = commentDraft.trim();
    if (!body) return;
    setComments((current) => [
      ...current,
      {
        id: `comment-${Date.now().toString(36)}-${current.length + 1}`,
        authorId: currentMember.id,
        body,
        createdAt: new Date().toISOString(),
      },
    ]);
    setCommentDraft("");
  }

  function changeItemId(nextItemId: string) {
    setItemId(nextItemId);
    const nextLinkedItem = nextItemId ? trip.itineraryItems.find((item) => item.id === nextItemId) : null;
    if (nextLinkedItem?.planVariantId) {
      setTripPlanId(nextLinkedItem.planVariantId);
    }
  }

  async function submitExpense(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedTitle = title.trim();
    if (isSaving || !trimmedTitle || !Number.isFinite(amountNumber) || amountNumber <= 0 || splitMismatch || !hasValidExchangeRate || invalidItemizedLines || !hasValidRepeatCount) return;
    const input: ExpenseInput = {
      itemId: itemId || null,
      tripPlanId: effectiveTripPlanId || null,
      title: trimmedTitle,
      amount: amountNumber,
      currency: normalizedCurrency,
      exchangeRateToSettlementCurrency: needsExchangeRate ? exchangeRateNumber : 1,
      paidBy,
      category,
      splits,
    };
    if (notes.trim()) input.notes = notes.trim();
    if (receiptUrl.trim()) input.receiptUrl = receiptUrl.trim();
    if (splitMode === "itemized") input.lineItems = validLineItems;
    if (comments.length) input.comments = comments;
    setIsSaving(true);
    try {
      if (expense) {
        await onUpdateExpense({ ...input, expenseId: expense.id });
        return;
      }
      if (repeatCountNumber > 1) input.repeatCount = repeatCountNumber;
      await onCreateExpense(input);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className={dialogBackdropClassName}>
      <section className={dialogClassName} role="dialog" aria-modal="true" aria-label={expense ? t.expenses.dialog.editTitle : t.expenses.dialog.addTitle}>
        <div className={dialogHeaderClassName}>
          <h2>{expense ? t.expenses.dialog.editTitle : t.expenses.dialog.addTitle}</h2>
          <IconButton type="button" aria-label={t.common.actions.close} onClick={onClose}><Icon name="x" /></IconButton>
        </div>
        <form className={dialogFormClassName} onSubmit={submitExpense}>
          <div className={dialogGridClassName}>
            <label className={fieldClassName}>
              <span>{t.expenses.fields.title}</span>
              <input value={title} onChange={(event) => setTitle(event.target.value)} />
            </label>
            <label className={fieldClassName}>
              <span>{t.expenses.fields.amount}</span>
              <input inputMode="decimal" value={amount} onChange={(event) => setAmount(event.target.value)} />
            </label>
            <label className={fieldClassName}>
              <span>{t.expenses.fields.currency}</span>
              <select
                aria-label={t.expenses.fields.currency}
                value={currency}
                onChange={(event) => {
                  setCurrency(normalizeCurrencyCode(event.target.value));
                  setExchangeRateTouched(false);
                  setExchangeRate("1");
                }}
              >
                {majorCurrencyOptions.map((option) => (
                  <option key={option.code} value={option.code}>{option.code} · {option.label}</option>
                ))}
              </select>
            </label>
            <label className={fieldClassName}>
              <span>{t.expenses.fields.receiptUrl}</span>
              <input value={receiptUrl} onChange={(event) => setReceiptUrl(event.target.value)} />
            </label>
            <label className={`${fieldClassName} md:col-span-2`}>
              <span>{t.expenses.fields.notes}</span>
              <textarea value={notes} onChange={(event) => setNotes(event.target.value)} />
            </label>
            {!expense ? (
              <label className={fieldClassName}>
                <span>{t.expenses.fields.repeatCount}</span>
                <input inputMode="numeric" min={1} max={31} type="number" value={repeatCount} onChange={(event) => setRepeatCount(event.target.value)} />
              </label>
            ) : null}
            {needsExchangeRate ? (
              <label className={fieldClassName}>
                <span>{t.expenses.fields.exchangeRate({ currency: normalizedCurrency, settlementCurrency })}</span>
                <input
                  inputMode="decimal"
                  value={exchangeRate}
                  onChange={(event) => {
                    setExchangeRateTouched(true);
                    setExchangeRate(event.target.value);
                  }}
                />
              </label>
            ) : null}
            <label className={fieldClassName}>
              <span>{t.expenses.fields.paidBy}</span>
              <select value={paidBy} onChange={(event) => setPaidBy(event.target.value)}>
                {trip.members.map((member) => <option key={member.id} value={member.id}>{member.displayName}</option>)}
              </select>
            </label>
            <label className={fieldClassName}>
              <span>{t.expenses.fields.category}</span>
              <select value={category} onChange={(event) => setCategory(event.target.value as Expense["category"])}>
                {categories.map((candidate) => <option key={candidate} value={candidate}>{candidate}</option>)}
              </select>
            </label>
            <div className="grid gap-1.5">
              <label className={fieldClassName}>
                <span>{t.expenses.fields.tripPlan}</span>
                <select
                  value={effectiveTripPlanId}
                  disabled={Boolean(linkedItem)}
                  onChange={(event) => setTripPlanId(event.target.value)}
                >
                  {tripPlanOptions.map((plan) => (
                    <option key={plan.id} value={plan.id}>{plan.name}</option>
                  ))}
                </select>
              </label>
              {linkedItem ? <span className={balanceMetaClassName}>{t.expenses.dialog.planLockedToLinkedStop}</span> : null}
            </div>
            <label className={fieldClassName}>
              <span>{t.expenses.fields.linkedStop}</span>
              <select value={itemId} onChange={(event) => changeItemId(event.target.value)}>
                <option value="">{t.expenses.fields.noLinkedStop}</option>
                {trip.itineraryItems.map((item) => <option key={item.id} value={item.id}>{item.activity}</option>)}
              </select>
            </label>
            <label className={fieldClassName}>
              <span>{t.expenses.fields.splitMode}</span>
              <select value={splitMode} onChange={(event) => changeSplitMode(event.target.value as ExpenseSplitMode)}>
                {splitModes.map((mode) => <option key={mode} value={mode}>{t.expenses.splitModes[mode]}</option>)}
              </select>
            </label>
          </div>

          {splitMode === "itemized" ? (
            <div className={itemizedListClassName}>
              {lineItems.map((lineItem, index) => (
                <fieldset className={itemizedLineClassName} key={lineItem.id} role="group" aria-label={t.expenses.fields.lineGroup({ number: index + 1 })}>
                  <label className={fieldClassName}>
                    <span>{t.expenses.fields.lineTitle}</span>
                    <input value={lineItem.title} onChange={(event) => updateLineItem(index, { title: event.target.value })} />
                  </label>
                  <label className={fieldClassName}>
                    <span>{t.expenses.fields.lineAmount}</span>
                    <input inputMode="decimal" value={lineItem.amount} onChange={(event) => updateLineItem(index, { amount: event.target.value })} />
                  </label>
                  <div className={participantChecksClassName} aria-label={t.expenses.fields.lineParticipants}>
                    {trip.members.map((member) => (
                      <label key={member.id}>
                        <input
                          type="checkbox"
                          checked={lineItem.participantIds.includes(member.id)}
                          onChange={() => toggleLineParticipant(index, member.id)}
                        />
                        {member.displayName}
                      </label>
                    ))}
                  </div>
                </fieldset>
              ))}
              <Button type="button" variant="ghost" onClick={addLineItem}>{t.expenses.actions.addLineItem}</Button>
            </div>
          ) : splitMode !== "equal" ? (
            <div className={splitGridClassName}>
              {trip.members.map((member) => (
                <label className={fieldClassName} key={member.id}>
                  <span>{t.expenses.fields.memberShare({ name: member.displayName })}</span>
                  <input
                    inputMode="decimal"
                    value={splitValues[member.id] ?? ""}
                    onChange={(event) => setSplitValues((current) => ({ ...current, [member.id]: event.target.value }))}
                  />
                </label>
              ))}
            </div>
          ) : null}

          {expense ? (
            <section className={commentsClassName} aria-label={t.expenses.fields.comments}>
              <div className={balanceListClassName}>
                {comments.map((comment) => {
                  const author = memberById(trip.members, comment.authorId);
                  return (
                    <div className={commentRowClassName} key={comment.id}>
                      <strong>{author?.displayName ?? t.expenses.comment.unknownAuthor}</strong>
                      <span>{comment.body}</span>
                    </div>
                  );
                })}
                {!comments.length ? <p className={balanceMetaClassName}>{t.expenses.comment.empty}</p> : null}
              </div>
              <label className={fieldClassName}>
                <span>{t.expenses.fields.commentInput}</span>
                <textarea value={commentDraft} onChange={(event) => setCommentDraft(event.target.value)} />
              </label>
              <Button type="button" variant="ghost" onClick={addComment}>{t.expenses.actions.addComment}</Button>
            </section>
          ) : null}

          <p className={splitMismatch ? warningClassName : balanceMetaClassName}>
            {t.expenses.dialog.splitTotal({ total: formatMoney(splitTotal, normalizedCurrency), amount: formatMoney(Number.isFinite(amountNumber) ? amountNumber : 0, normalizedCurrency) })}
            {splitMismatch ? ` ${t.expenses.dialog.mismatch}` : ""}
            {invalidItemizedLines ? ` ${t.expenses.dialog.itemizedRequired}` : ""}
            {needsExchangeRate && hasValidExchangeRate ? ` ${t.expenses.dialog.settleValue({ amount: formatMoney(amountNumber * exchangeRateNumber, settlementCurrency) })}` : ""}
            {needsExchangeRate && !hasValidExchangeRate ? ` ${t.expenses.dialog.exchangeRateRequired}` : ""}
          </p>

          <div className={dialogActionsClassName}>
            <Button type="button" variant="ghost" onClick={onClose}>{t.common.actions.cancel}</Button>
            <Button type="submit" disabled={isSaving || !title.trim() || !Number.isFinite(amountNumber) || amountNumber <= 0 || splitMismatch || !hasValidExchangeRate || invalidItemizedLines || !hasValidRepeatCount}>
              {t.expenses.actions.saveExpense}
            </Button>
          </div>
        </form>
      </section>
    </div>
  );
}

interface EditableExpenseLineItem {
  id: string;
  title: string;
  amount: string;
  participantIds: string[];
}

function emptyLineItem(members: Member[], index: number): EditableExpenseLineItem {
  return {
    id: `line-${Date.now().toString(36)}-${index}`,
    title: "",
    amount: "",
    participantIds: members.map((member) => member.id),
  };
}

function memberById(members: Member[], memberId: string): Member | undefined {
  return members.find((member) => member.id === memberId);
}

function memberInitial(name: string): string {
  return name.trim().slice(0, 1).toLocaleUpperCase() || "?";
}

function categoryTone(category: Expense["category"]): { background: string; border: string; dot: string; text: string } {
  const tones: Record<Expense["category"], { background: string; border: string; dot: string; text: string }> = {
    food: { background: "#fff7ed", border: "#fed7aa", dot: "#f97316", text: "#9a3412" },
    transport: { background: "#eff6ff", border: "#bfdbfe", dot: "#2563eb", text: "#1d4ed8" },
    tickets: { background: "#fdf2f8", border: "#fbcfe8", dot: "#db2777", text: "#9d174d" },
    stay: { background: "#fff8e6", border: "#f8d78f", dot: "#b45309", text: "#92400e" },
    shopping: { background: "#fefce8", border: "#fde68a", dot: "#ca8a04", text: "#854d0e" },
    settlement: { background: "#f0fdf4", border: "#bbf7d0", dot: "#16a34a", text: "#166534" },
  };
  return tones[category];
}

function sumShares(splits: Record<string, number>): number {
  return Math.round(Object.values(splits).reduce((sum, share) => sum + share, 0) * 100) / 100;
}

function slugifyFilePart(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "trip";
}

function formatReminderDate(value: string, locale: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString(locale === "th" ? "th-TH-u-ca-gregory" : "en-US", {
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatMoney(amount: number, currency = "HKD"): string {
  const normalizedCurrency = normalizeCurrencyCode(currency);
  const prefixByCurrency: Record<string, string> = {
    CNY: "CN¥",
    EUR: "€",
    GBP: "£",
    HKD: "HK$",
    JPY: "¥",
    KRW: "₩",
    SGD: "S$",
    THB: "฿",
    TWD: "NT$",
    USD: "US$",
  };
  const prefix = prefixByCurrency[normalizedCurrency] ?? `${normalizedCurrency} `;
  const sign = amount < 0 ? "-" : "";
  return `${sign}${prefix}${Math.abs(amount).toLocaleString("en-HK", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatExchangeRateInput(rate: number): string {
  return Number.isInteger(rate) ? String(rate) : Number(rate.toFixed(6)).toString();
}
