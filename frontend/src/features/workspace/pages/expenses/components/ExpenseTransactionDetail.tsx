import { findItineraryItemById } from "@/src/trip/itinerary-items";
import type { Expense, Member, Trip } from "@/src/trip/types";
import { Button, IconButton } from "@/src/ui";
import { Icon } from "@/src/ui/icons";
import * as expenseStyles from "../TripExpensesPage.styles";
import {
  expenseLedgerPayerDisplay,
  expenseLedgerRowDisplay,
} from "../model/expense-ledger-display";
import type { DuplicateExpenseAsEstimateHandler } from "../model/expense-page-types";
import { ExpenseCategoryBadge } from "./ExpenseCategoryBadge";
import { ExpenseMemberLine } from "./ExpenseMemberLine";

interface ExpenseTransactionDetailProps {
  canEditExpenses: boolean;
  displayCurrency: string;
  displayExchangeRate: number;
  expense: Expense | null;
  isMobile: boolean;
  members: Member[];
  onClose: () => void;
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
      close: string;
      empty: string;
      memberMath: string;
      originalAmount: string;
      paidBy: string;
      split: string;
      source: string;
      sourceAndMath: string;
    };
    uncategorizedStop: string;
  };
  trip: Trip;
}

export function ExpenseTransactionDetail({
  canEditExpenses,
  displayCurrency,
  displayExchangeRate,
  expense,
  isMobile,
  members,
  onClose,
  onDeleteExpense,
  onDuplicateExpenseAsEstimate,
  onEditExpense,
  onRecordRefund,
  pendingRefundExpenseIds,
  settlementCurrency,
  tableCopy,
  trip,
}: ExpenseTransactionDetailProps) {
  if (!expense) {
    if (isMobile) return null;
    return (
      <aside className={expenseStyles.transactionDetailClassName} aria-label={tableCopy.details.sourceAndMath}>
        <div className={expenseStyles.transactionDetailEmptyClassName}>
          <Icon name="wallet" />
          <p>{tableCopy.details.empty}</p>
        </div>
      </aside>
    );
  }

  const payer = expenseLedgerPayerDisplay({ members, paidBy: expense.paidBy });
  const linkedItem = findItineraryItemById(trip.itineraryItems, expense.itineraryItemId);
  const display = expenseLedgerRowDisplay(expense, settlementCurrency, {
    displayCurrency,
    displayExchangeRate,
    members,
  });
  const memberBreakdown = display.memberBreakdown ?? [];

  return (
    <>
      {isMobile ? (
        <button
          type="button"
          aria-label={tableCopy.details.close}
          className={expenseStyles.transactionDetailBackdropClassName}
          onClick={onClose}
        />
      ) : null}
      <aside className={expenseStyles.transactionDetailClassName} aria-label={expense.title}>
      <div className={expenseStyles.transactionDetailHeaderClassName}>
        <div className="grid min-w-0 gap-2">
          <span className={expenseStyles.ledgerStopPillClassName}>
            {linkedItem?.activity ?? tableCopy.uncategorizedStop}
          </span>
          <h2>{expense.title}</h2>
          <ExpenseCategoryBadge category={expense.category} />
        </div>
        <IconButton type="button" aria-label={tableCopy.details.close} onClick={onClose}>
          <Icon name="x" />
        </IconButton>
      </div>

      <div className={expenseStyles.transactionDetailAmountClassName}>
        <strong>{display.displayAmountLabel ?? display.amountLabel}</strong>
        {display.displayAmountLabel && display.displayAmountLabel !== display.amountLabel ? (
          <span>{tableCopy.details.originalAmount}: {display.amountLabel}</span>
        ) : null}
      </div>

      <dl className={expenseStyles.transactionDetailListClassName}>
        <div>
          <dt>{tableCopy.details.paidBy}</dt>
          <dd>{payer ? <ExpenseMemberLine color={payer.color} name={payer.name} /> : expense.paidBy}</dd>
        </div>
        <div>
          <dt>{tableCopy.details.split}</dt>
          <dd>{display.splitTotalLabel}</dd>
        </div>
        {display.sourceLabel ? (
          <div>
            <dt>{tableCopy.details.source}</dt>
            <dd>{display.sourceLabel}</dd>
          </div>
        ) : null}
        {display.calculationLabel ? (
          <div>
            <dt>{tableCopy.details.calculation}</dt>
            <dd>{display.calculationLabel}</dd>
          </div>
        ) : null}
        {memberBreakdown.length ? (
          <div>
            <dt>{tableCopy.details.memberMath}</dt>
            <dd>
              <ul className={expenseStyles.ledgerMemberListClassName}>
                {memberBreakdown.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            </dd>
          </div>
        ) : null}
      </dl>

      <div className={expenseStyles.transactionDetailActionsClassName}>
        <Button type="button" disabled={!canEditExpenses} onClick={() => onEditExpense(expense)}>
          <Icon name="edit" /> {tableCopy.actions.editExpense({ title: expense.title })}
        </Button>
        <Button
          type="button"
          variant="ghost"
          disabled={!canEditExpenses || !display.canRecordRefund || pendingRefundExpenseIds.has(expense.id)}
          onClick={() => void onRecordRefund(expense)}
        >
          <Icon name="wallet" /> {tableCopy.actions.recordRefund({ title: expense.title })}
        </Button>
        <Button
          type="button"
          variant="ghost"
          disabled={!canEditExpenses || !onDuplicateExpenseAsEstimate}
          onClick={() => void onDuplicateExpenseAsEstimate?.(expense)}
        >
          <Icon name="copy" /> {tableCopy.actions.duplicateAsEstimate({ title: expense.title })}
        </Button>
        <Button type="button" variant="ghost" disabled={!canEditExpenses} onClick={() => onDeleteExpense(expense.id)}>
          <Icon name="trash" /> {tableCopy.actions.cancelExpense({ title: expense.title })}
        </Button>
      </div>
      </aside>
    </>
  );
}
