import { findItineraryItemById } from "@/src/trip/itinerary-items";
import type { Expense, Member, Trip } from "@/src/trip/types";
import { IconButton } from "@/src/ui";
import { Icon } from "@/src/ui/icons";
import * as expenseStyles from "../TripExpensesPage.styles";
import {
  expenseLedgerPayerDisplay,
  expenseLedgerRowDisplay,
} from "../model/expense-ledger-display";
import type { ExpenseLedgerDayGroup } from "../model/expense-page-filters";
import type { DuplicateExpenseAsEstimateHandler } from "../model/expense-page-types";
import { ExpenseCategoryBadge } from "./ExpenseCategoryBadge";
import { ExpenseMemberLine } from "./ExpenseMemberLine";

interface ExpenseLedgerRowsProps {
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
    empty: string;
    uncategorizedStop: string;
  };
  trip: Trip;
}

export function ExpenseLedgerRows({
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
}: ExpenseLedgerRowsProps) {
  return (
    <tbody className={expenseStyles.tableBodyClassName}>
      {dayGroups.flatMap((group) => [
        <tr className={expenseStyles.dayGroupRowClassName} key={`${group.id}-heading`}>
          <td colSpan={6}>
            <span>{group.label}</span>
            <strong>{group.totalLabel}</strong>
          </td>
        </tr>,
        ...group.expenses.map((expense) => {
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
          return (
            <tr key={expense.id}>
              <td className={expenseStyles.tableTitleClassName}>
                <strong>{expense.title}</strong>
                <ExpenseCategoryBadge category={expense.category} />
                {display.sourceLabel ? (
                  <span className={expenseStyles.ledgerSourceClassName}>{display.sourceLabel}</span>
                ) : null}
                {display.calculationLabel ? (
                  <span className={expenseStyles.ledgerCalculationClassName}>{display.calculationLabel}</span>
                ) : null}
              </td>
              <td>
                <span className={expenseStyles.ledgerAmountClassName}>
                  {display.displayAmountLabel ?? display.amountLabel}
                </span>
                {display.displayAmountLabel && display.displayAmountLabel !== display.amountLabel ? (
                  <span className={expenseStyles.ledgerSubAmountClassName}>{display.amountLabel}</span>
                ) : null}
              </td>
              <td>
                {payer ? (
                  <ExpenseMemberLine color={payer.color} name={payer.name} />
                ) : expense.paidBy}
              </td>
              <td>
                <span>{display.splitTotalLabel}</span>
                {display.memberBreakdown?.length ? (
                  <span className={expenseStyles.ledgerCalculationClassName}>
                    {display.memberBreakdown.join(" · ")}
                  </span>
                ) : null}
              </td>
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
                    disabled={!canEditExpenses || !display.canRecordRefund || pendingRefundExpenseIds.has(expense.id)}
                    onClick={() => void onRecordRefund(expense)}
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
        }),
      ])}
      {!dayGroups.length ? (
        <tr>
          <td colSpan={6}>{tableCopy.empty}</td>
        </tr>
      ) : null}
    </tbody>
  );
}
