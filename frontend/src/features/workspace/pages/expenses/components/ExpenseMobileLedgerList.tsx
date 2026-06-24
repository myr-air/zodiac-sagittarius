import { findItineraryItemById } from "@/src/trip/itinerary-items";
import type { Expense, Member, Trip } from "@/src/trip/types";
import { IconButton } from "@/src/ui";
import { Icon } from "@/src/ui/icons";
import { useState } from "react";
import * as expenseStyles from "../TripExpensesPage.styles";
import {
  expenseLedgerPayerDisplay,
  expenseLedgerRowDisplay,
} from "../model/expense-ledger-display";
import type { ExpenseLedgerDayGroup } from "../model/expense-page-filters";
import type { DuplicateExpenseAsEstimateHandler } from "../model/expense-page-types";
import { ExpenseCategoryBadge } from "./ExpenseCategoryBadge";
import { ExpenseMemberLine } from "./ExpenseMemberLine";

interface ExpenseMobileLedgerListProps {
  canEditExpenses: boolean;
  dayGroups: ExpenseLedgerDayGroup[];
  displayCurrency: string;
  displayExchangeRate: number;
  members: Member[];
  onDeleteExpense: (expenseId: string) => void;
  onDuplicateExpenseAsEstimate?: DuplicateExpenseAsEstimateHandler;
  onEditExpense: (expense: Expense) => void;
  onRecordRefund: (expense: Expense) => void;
  pendingRefundExpenseIds: Set<string>;
  settlementCurrency: string;
  tableCopy: {
    actions: {
      cancelExpense(input: { title: string }): string;
      duplicateAsEstimate(input: { title: string }): string;
      editExpense(input: { title: string }): string;
      recordRefund(input: { title: string }): string;
    };
    details: {
      calculation: string;
      hideDetails(input: { title: string }): string;
      memberMath: string;
      originalAmount: string;
      showDetails(input: { title: string }): string;
      source: string;
      sourceAndMath: string;
    };
    empty: string;
    uncategorizedStop: string;
  };
  trip: Trip;
}

export function ExpenseMobileLedgerList({
  canEditExpenses,
  dayGroups,
  displayCurrency,
  displayExchangeRate,
  members,
  onDeleteExpense,
  onDuplicateExpenseAsEstimate,
  onEditExpense,
  onRecordRefund,
  pendingRefundExpenseIds,
  settlementCurrency,
  tableCopy,
  trip,
}: ExpenseMobileLedgerListProps) {
  const [expandedExpenseId, setExpandedExpenseId] = useState<string | null>(null);

  return (
    <div className={expenseStyles.mobileLedgerListClassName}>
      {dayGroups.map((group) => (
        <section className="grid gap-2" key={group.id} aria-label={group.label}>
          <div className={expenseStyles.mobileDayGroupClassName}>
            <span>{group.label}</span>
            <strong>{group.totalLabel}</strong>
          </div>
          {group.expenses.map((expense) => {
            const payer = expenseLedgerPayerDisplay({
              members,
              paidBy: expense.paidBy,
            });
            const linkedItem = findItineraryItemById(
              trip.itineraryItems,
              expense.itineraryItemId,
            );
            const display = expenseLedgerRowDisplay(
              expense,
              settlementCurrency,
              {
                displayCurrency,
                displayExchangeRate,
                members,
              },
            );
            const hasSourceDetails = Boolean(display.sourceLabel || display.calculationLabel || display.memberBreakdown?.length);
            const expanded = expandedExpenseId === expense.id;
            const detailId = `expense-mobile-ledger-detail-${expense.id}`;

            return (
              <article className={expenseStyles.mobileLedgerCardClassName} key={expense.id}>
                <div className={expenseStyles.mobileLedgerCardTopClassName}>
                  <div className={expenseStyles.mobileLedgerCardTitleClassName}>
                    <strong className={expenseStyles.ledgerTitleClassName}>{expense.title}</strong>
                    <ExpenseCategoryBadge category={expense.category} />
                  </div>
                  <span className={expenseStyles.mobileLedgerCardAmountClassName}>
                    {display.displayAmountLabel ?? display.amountLabel}
                  </span>
                </div>
                <div className={expenseStyles.mobileLedgerMetaClassName}>
                  {payer ? (
                    <ExpenseMemberLine color={payer.color} name={payer.name} />
                  ) : (
                    <span>{expense.paidBy}</span>
                  )}
                  <span className={expenseStyles.ledgerSplitCellClassName}>{display.splitTotalLabel}</span>
                </div>
                <span className={expenseStyles.ledgerStopPillClassName}>
                  {linkedItem?.activity ?? tableCopy.uncategorizedStop}
                </span>
                {expanded && hasSourceDetails ? (
                  <div className={expenseStyles.ledgerDetailPanelClassName} id={detailId}>
                    <strong>{tableCopy.details.sourceAndMath}</strong>
                    {display.sourceLabel ? (
                      <span>{tableCopy.details.source}: {display.sourceLabel}</span>
                    ) : null}
                    {display.calculationLabel ? (
                      <span>{tableCopy.details.calculation}: {display.calculationLabel}</span>
                    ) : null}
                    {display.memberBreakdown?.length ? (
                      <span>{tableCopy.details.memberMath}: {display.memberBreakdown.join(", ")}</span>
                    ) : null}
                  </div>
                ) : null}
                <div className={expenseStyles.mobileLedgerActionsClassName}>
                  <IconButton
                    type="button"
                    aria-controls={hasSourceDetails ? detailId : undefined}
                    aria-expanded={hasSourceDetails ? expanded : undefined}
                    aria-label={expanded ? tableCopy.details.hideDetails({ title: expense.title }) : tableCopy.details.showDetails({ title: expense.title })}
                    disabled={!hasSourceDetails}
                    onClick={() => setExpandedExpenseId((current) => current === expense.id ? null : expense.id)}
                  >
                    <Icon name={expanded ? "eyeOff" : "eye"} />
                  </IconButton>
                  <span className="inline-flex items-center gap-1.5">
                    <IconButton type="button" aria-label={tableCopy.actions.editExpense({ title: expense.title })} disabled={!canEditExpenses} onClick={() => onEditExpense(expense)}>
                      <Icon name="edit" />
                    </IconButton>
                    <IconButton
                      type="button"
                      aria-label={tableCopy.actions.duplicateAsEstimate({ title: expense.title })}
                      disabled={!canEditExpenses || !onDuplicateExpenseAsEstimate}
                      onClick={() => void onDuplicateExpenseAsEstimate?.(expense)}
                    >
                      <Icon name="copy" />
                    </IconButton>
                    <IconButton
                      type="button"
                      aria-label={tableCopy.actions.recordRefund({ title: expense.title })}
                      disabled={!canEditExpenses || !display.canRecordRefund || pendingRefundExpenseIds.has(expense.id)}
                      onClick={() => void onRecordRefund(expense)}
                    >
                      <Icon name="wallet" />
                    </IconButton>
                    <IconButton type="button" aria-label={tableCopy.actions.cancelExpense({ title: expense.title })} disabled={!canEditExpenses} onClick={() => onDeleteExpense(expense.id)}>
                      <Icon name="trash" />
                    </IconButton>
                  </span>
                </div>
              </article>
            );
          })}
        </section>
      ))}
      {!dayGroups.length ? <p className={expenseStyles.balanceMetaClassName}>{tableCopy.empty}</p> : null}
    </div>
  );
}
