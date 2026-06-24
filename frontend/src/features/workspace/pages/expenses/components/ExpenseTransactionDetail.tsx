import { findItineraryItemById } from "@/src/trip/itinerary-items";
import type { Expense, Member, Trip } from "@/src/trip/types";
import { Button, IconButton } from "@/src/ui";
import { Icon } from "@/src/ui/icons";
import { type KeyboardEvent, useEffect, useRef } from "react";
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
      cancelExpenseShort: string;
      cancelExpense(input: { title: string }): string;
      duplicateAsEstimateShort: string;
      duplicateAsEstimate(input: { title: string }): string;
      editExpenseShort: string;
      editExpense(input: { title: string }): string;
      recordRefundShort: string;
      recordRefund(input: { title: string }): string;
    };
    categories: Record<Expense["category"], string>;
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
  const detailRef = useRef<HTMLElement>(null);
  const restoreFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!isMobile || !expense) return;
    restoreFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    detailRef.current?.focus();
    return () => restoreFocusRef.current?.focus();
  }, [expense, isMobile]);

  const onDetailKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (!isMobile) return;
    if (event.key === "Escape") {
      event.preventDefault();
      onClose();
      return;
    }
    if (event.key !== "Tab" || !detailRef.current) return;
    const focusable = Array.from(
      detailRef.current.querySelectorAll<HTMLElement>(
        'button:not([disabled]), summary, [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      ),
    );
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (document.activeElement === detailRef.current) {
      event.preventDefault();
      (event.shiftKey ? last : first).focus();
    } else if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };

  if (!expense) {
    if (isMobile) return null;
    return (
      <section className={expenseStyles.transactionDetailClassName} aria-label={tableCopy.details.sourceAndMath}>
        <div className={expenseStyles.transactionDetailEmptyClassName}>
          <Icon name="wallet" />
          <p>{tableCopy.details.empty}</p>
        </div>
      </section>
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
  const canEditThisExpense = canEditExpenses && expense.category !== "settlement";

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
      <section
        ref={detailRef}
        className={expenseStyles.transactionDetailClassName}
        aria-label={expense.title}
        aria-modal={isMobile ? true : undefined}
        role={isMobile ? "dialog" : "region"}
        tabIndex={isMobile ? -1 : undefined}
        onKeyDown={onDetailKeyDown}
      >
      <div className={expenseStyles.transactionDetailHeaderClassName}>
        <div className="grid min-w-0 gap-2">
          <span className={expenseStyles.ledgerStopPillClassName}>
            {linkedItem?.activity ?? tableCopy.uncategorizedStop}
          </span>
          <h2>{expense.title}</h2>
          <ExpenseCategoryBadge category={expense.category} label={tableCopy.categories[expense.category]} />
        </div>
        {isMobile ? (
          <IconButton type="button" aria-label={tableCopy.details.close} onClick={onClose}>
            <Icon name="x" />
          </IconButton>
        ) : null}
      </div>

      <div className={expenseStyles.transactionDetailAmountClassName}>
        <strong>{display.displayAmountLabel ?? display.amountLabel}</strong>
        {display.displayAmountLabel && display.displayAmountLabel !== display.amountLabel ? (
          <span>{tableCopy.details.originalAmount}: {display.amountLabel}</span>
        ) : null}
      </div>

      <div className={expenseStyles.transactionDetailActionsClassName}>
        <Button
          type="button"
          aria-label={tableCopy.actions.editExpense({ title: expense.title })}
          className={expenseStyles.transactionDetailPrimaryActionClassName}
          disabled={!canEditThisExpense}
          onClick={() => onEditExpense(expense)}
        >
          <Icon name="edit" /> {tableCopy.actions.editExpenseShort}
        </Button>
        <div className={expenseStyles.transactionDetailSecondaryActionsClassName}>
          <Button
            type="button"
            variant="secondary"
            aria-label={tableCopy.actions.recordRefund({ title: expense.title })}
            className={expenseStyles.transactionDetailSecondaryActionClassName}
            disabled={!canEditExpenses || !display.canRecordRefund || pendingRefundExpenseIds.has(expense.id)}
            onClick={() => void onRecordRefund(expense)}
          >
            <Icon name="wallet" /> {tableCopy.actions.recordRefundShort}
          </Button>
          <Button
            type="button"
            variant="ghost"
            aria-label={tableCopy.actions.duplicateAsEstimate({ title: expense.title })}
            className={expenseStyles.transactionDetailSecondaryActionClassName}
            disabled={!canEditExpenses || !onDuplicateExpenseAsEstimate}
            onClick={() => void onDuplicateExpenseAsEstimate?.(expense)}
          >
            <Icon name="copy" /> {tableCopy.actions.duplicateAsEstimateShort}
          </Button>
        </div>
        <Button
          type="button"
          variant="danger"
          aria-label={tableCopy.actions.cancelExpense({ title: expense.title })}
          className={expenseStyles.transactionDetailDangerActionClassName}
          disabled={!canEditExpenses}
          onClick={() => onDeleteExpense(expense.id)}
        >
          <Icon name="trash" /> {tableCopy.actions.cancelExpenseShort}
        </Button>
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
        {display.sourceLabel || display.calculationLabel ? (
          <div>
            <dt>{tableCopy.details.sourceAndMath}</dt>
            <dd>
              <details className={expenseStyles.transactionDetailDisclosureClassName}>
                <summary>{tableCopy.details.sourceAndMath}</summary>
                {display.sourceLabel ? <p>{display.sourceLabel}</p> : null}
                {display.calculationLabel ? <p>{display.calculationLabel}</p> : null}
              </details>
            </dd>
          </div>
        ) : null}
        {memberBreakdown.length ? (
          <div>
            <dt>{tableCopy.details.memberMath}</dt>
            <dd>
              <details className={expenseStyles.transactionDetailDisclosureClassName}>
                <summary>{tableCopy.details.memberMath}</summary>
                <ul className={expenseStyles.ledgerMemberListClassName}>
                  {memberBreakdown.map((line) => (
                    <li key={line}>{line}</li>
                  ))}
                </ul>
              </details>
            </dd>
          </div>
        ) : null}
      </dl>
      </section>
    </>
  );
}
