import { findItineraryItemById } from "@/src/trip/itinerary-items";
import type { Expense, Member, Trip } from "@/src/trip/types";
import { IconButton } from "@/src/ui";
import { Icon } from "@/src/ui/icons";
import * as expenseStyles from "../TripExpensesPage.styles";
import {
  expenseLedgerPayerDisplay,
  expenseLedgerRowDisplay,
} from "../model/expense-ledger-display";
import type { DuplicateExpenseAsEstimateHandler } from "../model/expense-page-types";
import { ExpenseCategoryBadge } from "./ExpenseCategoryBadge";

interface ExpenseLedgerRowsProps {
  canEditExpenses: boolean;
  expenses: Expense[];
  members: Member[];
  onDeleteExpense: (expenseId: string) => void;
  onDuplicateExpenseAsEstimate?: DuplicateExpenseAsEstimateHandler;
  onEditExpense: (expense: Expense) => void;
  onRecordRefund: (expense: Expense) => void;
  settlementCurrency: string;
  tableCopy: {
    actions: {
      cancelExpense(input: { title: string }): string;
      duplicateAsEstimate(input: { title: string }): string;
      editExpense(input: { title: string }): string;
      recordRefund(input: { title: string }): string;
    };
    empty: string;
    uncategorizedStop: string;
  };
  trip: Trip;
}

export function ExpenseLedgerRows({
  canEditExpenses,
  expenses,
  members,
  onDeleteExpense,
  onDuplicateExpenseAsEstimate,
  onEditExpense,
  onRecordRefund,
  settlementCurrency,
  tableCopy,
  trip,
}: ExpenseLedgerRowsProps) {
  return (
    <tbody className={expenseStyles.tableBodyClassName}>
      {expenses.map((expense) => {
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
        );
        return (
          <tr key={expense.id}>
            <td className={expenseStyles.tableTitleClassName}>
              <strong>{expense.title}</strong>
              <ExpenseCategoryBadge category={expense.category} />
            </td>
            <td><span className={expenseStyles.ledgerAmountClassName}>{display.amountLabel}</span></td>
            <td>
              {payer ? (
                <span className={expenseStyles.memberLineClassName}>
                  <span className={expenseStyles.avatarClassName} style={{ backgroundColor: payer.color }} aria-hidden="true">{payer.initial}</span>
                  <span className={expenseStyles.balanceNameClassName}>{payer.name}</span>
                </span>
              ) : expense.paidBy}
            </td>
            <td>{display.splitTotalLabel}</td>
            <td>{linkedItem?.activity ?? tableCopy.uncategorizedStop}</td>
            <td>
              <span className={expenseStyles.actionCellClassName}>
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
                  disabled={!canEditExpenses || !display.canRecordRefund}
                  onClick={() => onRecordRefund(expense)}
                >
                  <Icon name="wallet" />
                </IconButton>
                <IconButton type="button" aria-label={tableCopy.actions.cancelExpense({ title: expense.title })} disabled={!canEditExpenses} onClick={() => onDeleteExpense(expense.id)}>
                  <Icon name="trash" />
                </IconButton>
              </span>
            </td>
          </tr>
        );
      })}
      {!expenses.length ? (
        <tr>
          <td colSpan={6}>{tableCopy.empty}</td>
        </tr>
      ) : null}
    </tbody>
  );
}
