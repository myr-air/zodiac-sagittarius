import { useEffect, useMemo, useState } from "react";
import { useI18n } from "@/src/i18n/I18nProvider";
import { cn } from "@/src/lib/cn";
import { slugifyFilePart } from "@/src/lib/file-names";
import {
  buildExpenseCsv,
  buildExpenseStatement,
  buildPaybackReminder,
  expenseAmountInSettlementCurrency,
  formatMoney,
} from "@/src/trip/expenses";
import type { Expense, ExpenseSummary, Member, SettlementSuggestion, Trip } from "@/src/trip/types";
import { Icon } from "@/src/ui/icons";
import { formatTripRange, PageHeader } from "@/src/shared/components/page-header";
import { TravelMotif } from "@/src/shared/components/travel-motifs";
import { Button, IconButton, Select } from "@/src/ui";
import { ExpenseDialog } from "./ExpenseDialog";
import * as expenseStyles from "./TripExpensesPage.styles";
import type { ExpenseInput, ExpenseUpdateInput } from "./expense-page-types";
import {
  categoryTone,
  expenseCategories,
  formatReminderDate,
  memberById,
  memberInitial,
  refundAmount,
  refundSplits,
  sumShares,
  tripPlanName,
} from "./expense-page-support";

export type { ExpenseInput, ExpenseUpdateInput } from "./expense-page-types";

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
  const inferredScopeExpenses = useMemo(
    () =>
      trip.expenses.filter(
        (expense) =>
          expense.category !== "settlement" &&
          Boolean(expense.tripPlanId) &&
          !expense.itineraryItemId,
      ),
    [trip.expenses],
  );
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

  function recordRefund(expense: Expense) {
    const splits = refundSplits(expense);
    const amount = sumShares(splits);
    if (amount <= 0) return;
    onCreateExpense({
      itemId: expense.itineraryItemId ?? null,
      tripPlanId: expense.tripPlanId ?? selectedTripPlanId ?? null,
      title: `Refund: ${expense.title}`,
      amount,
      currency: expense.currency ?? settlementCurrency,
      exchangeRateToSettlementCurrency: expense.exchangeRateToSettlementCurrency ?? 1,
      notes: `Refund settlement for actual expense: ${expense.title}`,
      paidBy: expense.paidBy,
      category: "settlement",
      splits,
    });
  }

  return (
    <section className={expenseStyles.expensesPageClassName} aria-label={t.expenses.pageLabel}>
      <PageHeader
        title={t.expenses.title}
        subtitle={trip.name}
        meta={(
          <>
            <span><Icon name="calendar" /> {formatTripRange(trip.startDate, trip.endDate, locale)}</span>
            <span><Icon name="users" /> {t.dates.memberCount({ count: trip.members.length })}</span>
            <span><Icon name="wallet" /> {canEditExpenses ? t.expenses.canEdit : t.expenses.readOnly}</span>
          </>
        )}
        motif={<TravelMotif tone="route" />}
      />

      <div className={expenseStyles.expensesSummaryClassName} aria-label={t.expenses.summaryLabel} role="region">
        <SummaryStat icon="wallet" label={t.expenses.stats.tripSpend} value={formatMoney(expenseSummary.groupSpend, settlementCurrency)} />
        <SummaryStat icon="check" label={t.expenses.stats.yourBalance} value={expenseSummary.currentUserNetLabel} tone={currentNet < 0 ? "negative" : currentNet > 0 ? "positive" : "neutral"} />
        <SummaryStat icon="users" label={t.expenses.stats.owedToYou} value={formatMoney(owedToYou, settlementCurrency)} tone="positive" />
        <SummaryStat icon="warning" label={t.expenses.stats.youOwe} value={formatMoney(youOwe, settlementCurrency)} tone="negative" />
      </div>

      <div className={expenseStyles.contentGridClassName}>
        <div className="grid content-start gap-3">
          <section className={expenseStyles.panelClassName} aria-label={t.expenses.balanceLabel}>
            <h2 className={expenseStyles.panelHeadingClassName}><Icon name="users" /> {t.expenses.panels.balances}</h2>
            <div className={expenseStyles.balanceListClassName}>
              {trip.members.map((member) => {
                const net = expenseSummary.netByMember[member.id] ?? 0;
                return (
                  <div className={expenseStyles.balanceRowClassName} key={member.id}>
                    <span className={expenseStyles.memberLineClassName}>
                      <span className={expenseStyles.avatarClassName} style={{ backgroundColor: member.color }} aria-hidden="true">{memberInitial(member.displayName)}</span>
                      <span className="min-w-0">
                        <span className={expenseStyles.balanceNameClassName}>{member.displayName}</span>
                        <br />
                        <span className={expenseStyles.balanceMetaClassName}>
                          {net > 0
                              ? t.expenses.balance.owed({ name: member.displayName, amount: formatMoney(net, settlementCurrency) })
                            : net < 0
                              ? t.expenses.balance.owes({ name: member.displayName, amount: formatMoney(Math.abs(net), settlementCurrency) })
                              : t.expenses.balance.settled({ name: member.displayName })}
                        </span>
                      </span>
                    </span>
                    <strong className={cn(expenseStyles.amountClassName, net > 0 && expenseStyles.positiveClassName, net < 0 && expenseStyles.negativeClassName)}>{formatMoney(net, settlementCurrency)}</strong>
                  </div>
                );
              })}
            </div>
          </section>

          <section className={expenseStyles.panelClassName} aria-label={t.expenses.panels.settle}>
            <h2 className={expenseStyles.panelHeadingClassName}><Icon name="wallet" /> {t.expenses.panels.settle}</h2>
            {expenseSummary.settlementSuggestions.length ? (
              <div className={expenseStyles.balanceListClassName}>
                {expenseSummary.settlementSuggestions.map((suggestion) => {
                  const from = memberById(trip.members, suggestion.from);
                  const to = memberById(trip.members, suggestion.to);
                  return (
                    <div className={expenseStyles.settlementRowClassName} key={`${suggestion.from}-${suggestion.to}-${suggestion.amount}`}>
                      <span className={expenseStyles.balanceMetaClassName}>
                        {t.expenses.balance.payback({
                          from: from?.displayName ?? suggestion.from,
                          to: to?.displayName ?? suggestion.to,
                          amount: formatMoney(suggestion.amount, suggestion.currency ?? settlementCurrency),
                        })}
                      </span>
                      {suggestion.lastRemindedAt ? (
                        <span className={expenseStyles.balanceMetaClassName}>
                          {t.expenses.reminders.lastSent({ date: formatReminderDate(suggestion.lastRemindedAt, locale) })}
                        </span>
                      ) : null}
                      <span className={expenseStyles.balanceActionsClassName}>
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
              <p className={expenseStyles.balanceMetaClassName}>{t.expenses.balance.noPaybacks}</p>
            )}
          </section>

          <section className={expenseStyles.panelClassName} aria-label={t.expenses.panels.categories}>
            <h2 className={expenseStyles.panelHeadingClassName}><Icon name="list" /> {t.expenses.panels.categories}</h2>
            <div className={expenseStyles.balanceListClassName}>
              {categorySpend.map(([category, amount]) => {
                const tone = categoryTone(category);
                return (
                  <div className={expenseStyles.balanceRowClassName} key={category}>
                    <span className={expenseStyles.categoryBadgeClassName} style={{ backgroundColor: tone.background, borderColor: tone.border, color: tone.text }}>
                      <span className={expenseStyles.categoryDotClassName} style={{ backgroundColor: tone.dot }} aria-hidden="true" />
                      {category}
                    </span>
                    <strong className={expenseStyles.amountClassName}>{formatMoney(amount, settlementCurrency)}</strong>
                  </div>
                );
              })}
            </div>
          </section>

          {inferredScopeExpenses.length ? (
            <section className={expenseStyles.panelClassName} aria-label={t.expenses.scopeAudit.label}>
              <h2 className={expenseStyles.panelHeadingClassName}><Icon name="warning" /> {t.expenses.scopeAudit.title}</h2>
              <p className={expenseStyles.balanceMetaClassName}>{t.expenses.scopeAudit.summary({ count: inferredScopeExpenses.length })}</p>
              <div className={expenseStyles.scopeAuditListClassName}>
                {inferredScopeExpenses.map((expense) => (
                  <div className={expenseStyles.scopeAuditRowClassName} key={expense.id}>
                    <span className="min-w-0">
                      <strong className={expenseStyles.balanceNameClassName}>{expense.title}</strong>
                      <br />
                      <span className={expenseStyles.balanceMetaClassName}>
                        {t.expenses.scopeAudit.inferred}: {tripPlanName(trip, expense.tripPlanId)}
                      </span>
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      className="min-h-8 px-2 py-1 text-xs"
                      disabled={!canEditExpenses}
                      onClick={() => setDialogExpense(expense)}
                    >
                      {t.expenses.scopeAudit.review({ title: expense.title })}
                    </Button>
                  </div>
                ))}
              </div>
            </section>
          ) : null}
        </div>

        <section className="grid min-h-0 content-start gap-3" aria-label={t.expenses.ledgerLabel}>
          <div className={expenseStyles.commandBarClassName}>
            <div className={expenseStyles.filterGridClassName}>
              <label className={expenseStyles.fieldClassName}>
                <span>{t.expenses.filters.search}</span>
                <input value={query} placeholder={t.expenses.filters.searchPlaceholder} onChange={(event) => setQuery(event.target.value)} />
              </label>
              <label className={expenseStyles.fieldClassName}>
                <span>{t.expenses.filters.category}</span>
                <Select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value as "all" | Expense["category"])}>
                  <option value="all">{t.expenses.filters.allCategories}</option>
                  {expenseCategories.map((category) => <option key={category} value={category}>{category}</option>)}
                </Select>
              </label>
              <label className={expenseStyles.fieldClassName}>
                <span>{t.expenses.filters.payer}</span>
                <Select value={payerFilter} onChange={(event) => setPayerFilter(event.target.value)}>
                  <option value="all">{t.expenses.filters.allPayers}</option>
                  {trip.members.map((member) => <option key={member.id} value={member.id}>{member.displayName}</option>)}
                </Select>
              </label>
              <Button type="button" variant="ghost" onClick={clearFilters}>{t.expenses.actions.clearFilters}</Button>
            </div>
            <div className={expenseStyles.commandActionsClassName}>
              <Button type="button" variant="ghost" onClick={() => void copyStatement()}>
                <Icon name="copy" /> {t.expenses.actions.copyStatement}
              </Button>
              <Button type="button" variant="ghost" onClick={downloadCsv}>
                <Icon name="export" /> {t.expenses.actions.downloadCsv}
              </Button>
              <Button type="button" disabled={!canEditExpenses} onClick={() => setDialogExpense("new")}>
                <Icon name="plus" /> {t.expenses.actions.addExpense}
              </Button>
              <span className={expenseStyles.copyFeedbackClassName} data-state={copyState} role="status" aria-label={t.expenses.copy.statusLabel}>
                {copyState === "copied" ? t.common.status.copied : copyState === "error" ? t.common.status.copyFailed : t.expenses.copy.ready}
              </span>
            </div>
          </div>

          <div className={expenseStyles.tableWrapClassName}>
            <table className={expenseStyles.tableClassName} aria-label={t.expenses.ledgerLabel}>
              <thead className={expenseStyles.tableHeaderClassName}>
                <tr>
                  <th>{t.expenses.table.expense}</th>
                  <th>{t.expenses.table.amount}</th>
                  <th>{t.expenses.table.paidBy}</th>
                  <th>{t.expenses.table.split}</th>
                  <th>{t.expenses.table.linkedStop}</th>
                  <th>{t.expenses.table.actions}</th>
                </tr>
              </thead>
              <tbody className={expenseStyles.tableBodyClassName}>
                {filteredExpenses.map((expense) => {
                  const payer = memberById(trip.members, expense.paidBy);
                  const linkedItem = expense.itineraryItemId ? trip.itineraryItems.find((item) => item.id === expense.itineraryItemId) : null;
                  const tone = categoryTone(expense.category);
                  return (
                    <tr key={expense.id}>
                      <td className={expenseStyles.tableTitleClassName}>
                        <strong>{expense.title}</strong>
                        <span className={expenseStyles.categoryBadgeClassName} style={{ backgroundColor: tone.background, borderColor: tone.border, color: tone.text }}>
                          <span className={expenseStyles.categoryDotClassName} style={{ backgroundColor: tone.dot }} aria-hidden="true" />
                          {expense.category}
                        </span>
                      </td>
                      <td><span className={expenseStyles.ledgerAmountClassName}>{formatMoney(expense.amount, expense.currency ?? settlementCurrency)}</span></td>
                      <td>
                        {payer ? (
                          <span className={expenseStyles.memberLineClassName}>
                            <span className={expenseStyles.avatarClassName} style={{ backgroundColor: payer.color }} aria-hidden="true">{memberInitial(payer.displayName)}</span>
                            <span className={expenseStyles.balanceNameClassName}>{payer.displayName}</span>
                          </span>
                        ) : expense.paidBy}
                      </td>
                      <td>{formatMoney(sumShares(expense.splits), expense.currency ?? settlementCurrency)}</td>
                      <td>{linkedItem?.activity ?? t.expenses.uncategorizedStop}</td>
                      <td>
                        <span className={expenseStyles.actionCellClassName}>
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
                          <IconButton
                            type="button"
                            aria-label={t.expenses.actions.recordRefund({ title: expense.title })}
                            disabled={!canEditExpenses || expense.category === "settlement" || refundAmount(expense) <= 0}
                            onClick={() => recordRefund(expense)}
                          >
                            <Icon name="wallet" />
                          </IconButton>
                          <IconButton type="button" aria-label={t.expenses.actions.cancelExpense({ title: expense.title })} disabled={!canEditExpenses} onClick={() => onDeleteExpense(expense.id)}>
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
    <div className={expenseStyles.statClassName}>
      <Icon name={icon} />
      <span>{label}</span>
      <strong className={cn(tone === "positive" && expenseStyles.positiveClassName, tone === "negative" && expenseStyles.negativeClassName)}>{value}</strong>
    </div>
  );
}
