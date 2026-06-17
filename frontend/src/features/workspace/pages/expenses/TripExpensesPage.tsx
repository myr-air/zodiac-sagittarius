import { type FormEvent, useEffect, useMemo, useState } from "react";
import { useI18n } from "@/src/i18n/I18nProvider";
import { cn } from "@/src/lib/cn";
import { slugifyFilePart } from "@/src/lib/file-names";
import {
  buildExpenseCsv,
  buildExpenseStatement,
  buildExpenseSplits,
  buildItemizedExpenseSplits,
  buildPaybackReminder,
  expenseAmountInSettlementCurrency,
  formatMoney,
  type ExpenseSplitMode,
} from "@/src/trip/expenses";
import { fetchMajorExchangeRate, majorCurrencyOptions, normalizeCurrencyCode } from "@/src/trip/currencies";
import type { Expense, ExpenseComment, ExpenseLineItem, ExpenseSummary, Member, SettlementSuggestion, Trip } from "@/src/trip/types";
import { Icon } from "@/src/ui/icons";
import { formatTripRange, PageHeader } from "@/src/shared/components/page-header";
import { TravelMotif } from "@/src/shared/components/travel-motifs";
import { Button, IconButton, Select } from "@/src/ui";
import * as expenseStyles from "./TripExpensesPage.styles";
import {
  categoryTone,
  formatExchangeRateInput,
  formatReminderDate,
  memberById,
  memberInitial,
  refundAmount,
  refundSplits,
  sumShares,
  tripPlanName,
} from "./expense-page-support";

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
                  {categories.map((category) => <option key={category} value={category}>{category}</option>)}
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
    <div className={expenseStyles.dialogBackdropClassName}>
      <section className={expenseStyles.dialogClassName} role="dialog" aria-modal="true" aria-label={expense ? t.expenses.dialog.editTitle : t.expenses.dialog.addTitle}>
        <div className={expenseStyles.dialogHeaderClassName}>
          <h2>{expense ? t.expenses.dialog.editTitle : t.expenses.dialog.addTitle}</h2>
          <IconButton type="button" aria-label={t.common.actions.close} onClick={onClose}><Icon name="x" /></IconButton>
        </div>
        <form className={expenseStyles.dialogFormClassName} onSubmit={submitExpense}>
          <div className={expenseStyles.dialogGridClassName}>
            <label className={expenseStyles.fieldClassName}>
              <span>{t.expenses.fields.title}</span>
              <input value={title} onChange={(event) => setTitle(event.target.value)} />
            </label>
            <label className={expenseStyles.fieldClassName}>
              <span>{t.expenses.fields.amount}</span>
              <input inputMode="decimal" value={amount} onChange={(event) => setAmount(event.target.value)} />
            </label>
            <label className={expenseStyles.fieldClassName}>
              <span>{t.expenses.fields.currency}</span>
              <Select
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
              </Select>
            </label>
            <label className={expenseStyles.fieldClassName}>
              <span>{t.expenses.fields.receiptUrl}</span>
              <input value={receiptUrl} onChange={(event) => setReceiptUrl(event.target.value)} />
            </label>
            <label className={`${expenseStyles.fieldClassName} md:col-span-2`}>
              <span>{t.expenses.fields.notes}</span>
              <textarea value={notes} onChange={(event) => setNotes(event.target.value)} />
            </label>
            {!expense ? (
              <label className={expenseStyles.fieldClassName}>
                <span>{t.expenses.fields.repeatCount}</span>
                <input inputMode="numeric" min={1} max={31} type="number" value={repeatCount} onChange={(event) => setRepeatCount(event.target.value)} />
              </label>
            ) : null}
            {needsExchangeRate ? (
              <label className={expenseStyles.fieldClassName}>
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
            <label className={expenseStyles.fieldClassName}>
              <span>{t.expenses.fields.paidBy}</span>
              <Select value={paidBy} onChange={(event) => setPaidBy(event.target.value)}>
                {trip.members.map((member) => <option key={member.id} value={member.id}>{member.displayName}</option>)}
              </Select>
            </label>
            <label className={expenseStyles.fieldClassName}>
              <span>{t.expenses.fields.category}</span>
              <Select value={category} onChange={(event) => setCategory(event.target.value as Expense["category"])}>
                {categories.map((candidate) => <option key={candidate} value={candidate}>{candidate}</option>)}
              </Select>
            </label>
            <div className="grid gap-1.5">
              <label className={expenseStyles.fieldClassName}>
                <span>{t.expenses.fields.tripPlan}</span>
                <Select
                  value={effectiveTripPlanId}
                  disabled={Boolean(linkedItem)}
                  onChange={(event) => setTripPlanId(event.target.value)}
                >
                  {tripPlanOptions.map((plan) => (
                    <option key={plan.id} value={plan.id}>{plan.name}</option>
                  ))}
                </Select>
              </label>
              {linkedItem ? <span className={expenseStyles.balanceMetaClassName}>{t.expenses.dialog.planLockedToLinkedStop}</span> : null}
            </div>
            <label className={expenseStyles.fieldClassName}>
              <span>{t.expenses.fields.linkedStop}</span>
              <Select value={itemId} onChange={(event) => changeItemId(event.target.value)}>
                <option value="">{t.expenses.fields.noLinkedStop}</option>
                {trip.itineraryItems.map((item) => <option key={item.id} value={item.id}>{item.activity}</option>)}
              </Select>
            </label>
            <label className={expenseStyles.fieldClassName}>
              <span>{t.expenses.fields.splitMode}</span>
              <Select value={splitMode} onChange={(event) => changeSplitMode(event.target.value as ExpenseSplitMode)}>
                {splitModes.map((mode) => <option key={mode} value={mode}>{t.expenses.splitModes[mode]}</option>)}
              </Select>
            </label>
          </div>

          {splitMode === "itemized" ? (
            <div className={expenseStyles.itemizedListClassName}>
              {lineItems.map((lineItem, index) => (
                <fieldset className={expenseStyles.itemizedLineClassName} key={lineItem.id} role="group" aria-label={t.expenses.fields.lineGroup({ number: index + 1 })}>
                  <label className={expenseStyles.fieldClassName}>
                    <span>{t.expenses.fields.lineTitle}</span>
                    <input value={lineItem.title} onChange={(event) => updateLineItem(index, { title: event.target.value })} />
                  </label>
                  <label className={expenseStyles.fieldClassName}>
                    <span>{t.expenses.fields.lineAmount}</span>
                    <input inputMode="decimal" value={lineItem.amount} onChange={(event) => updateLineItem(index, { amount: event.target.value })} />
                  </label>
                  <div className={expenseStyles.participantChecksClassName} aria-label={t.expenses.fields.lineParticipants}>
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
            <div className={expenseStyles.splitGridClassName}>
              {trip.members.map((member) => (
                <label className={expenseStyles.fieldClassName} key={member.id}>
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
            <section className={expenseStyles.commentsClassName} aria-label={t.expenses.fields.comments}>
              <div className={expenseStyles.balanceListClassName}>
                {comments.map((comment) => {
                  const author = memberById(trip.members, comment.authorId);
                  return (
                    <div className={expenseStyles.commentRowClassName} key={comment.id}>
                      <strong>{author?.displayName ?? t.expenses.comment.unknownAuthor}</strong>
                      <span>{comment.body}</span>
                    </div>
                  );
                })}
                {!comments.length ? <p className={expenseStyles.balanceMetaClassName}>{t.expenses.comment.empty}</p> : null}
              </div>
              <label className={expenseStyles.fieldClassName}>
                <span>{t.expenses.fields.commentInput}</span>
                <textarea value={commentDraft} onChange={(event) => setCommentDraft(event.target.value)} />
              </label>
              <Button type="button" variant="ghost" onClick={addComment}>{t.expenses.actions.addComment}</Button>
            </section>
          ) : null}

          <p className={splitMismatch ? expenseStyles.warningClassName : expenseStyles.balanceMetaClassName}>
            {t.expenses.dialog.splitTotal({ total: formatMoney(splitTotal, normalizedCurrency), amount: formatMoney(Number.isFinite(amountNumber) ? amountNumber : 0, normalizedCurrency) })}
            {splitMismatch ? ` ${t.expenses.dialog.mismatch}` : ""}
            {invalidItemizedLines ? ` ${t.expenses.dialog.itemizedRequired}` : ""}
            {needsExchangeRate && hasValidExchangeRate ? ` ${t.expenses.dialog.settleValue({ amount: formatMoney(amountNumber * exchangeRateNumber, settlementCurrency) })}` : ""}
            {needsExchangeRate && !hasValidExchangeRate ? ` ${t.expenses.dialog.exchangeRateRequired}` : ""}
          </p>

          <div className={expenseStyles.dialogActionsClassName}>
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
