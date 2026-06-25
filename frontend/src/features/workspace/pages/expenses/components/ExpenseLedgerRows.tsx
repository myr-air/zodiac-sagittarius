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
import { ExpenseCategoryBadge } from "./ExpenseCategoryBadge";
import { ExpenseMemberLine } from "./ExpenseMemberLine";

interface ExpenseLedgerRowsProps {
  canEditExpenses: boolean;
  dayGroups: ExpenseLedgerDayGroup[];
  displayCurrency: string;
  displayExchangeRate: number;
  members: Member[];
  onEditExpense: (expense: Expense) => void;
  onSelectExpense: (expense: Expense) => void;
  selectedExpenseId: string | null;
  settlementCurrency: string;
  tableCopy: {
    actions: {
      cancelExpense(input: { title: string }): string;
      duplicateAsEstimate(input: { title: string }): string;
      editExpense(input: { title: string }): string;
      recordRefund(input: { title: string }): string;
    };
    categories: Record<Expense["category"], string>;
    details: {
      calculation: string;
      memberMath: string;
      originalAmount: string;
      hideDetails(input: { title: string }): string;
      showDetails(input: { title: string }): string;
      source: string;
      sourceAndMath: string;
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
  onEditExpense,
  onSelectExpense,
  selectedExpenseId,
  settlementCurrency,
  tableCopy,
  trip,
}: ExpenseLedgerRowsProps) {
  return (
    <tbody className={expenseStyles.tableBodyClassName}>
      {dayGroups.flatMap((group) => [
        <tr className={expenseStyles.dayGroupRowClassName} key={`${group.id}-heading`}>
          <td colSpan={6}>
            <span className={expenseStyles.dayGroupCellClassName}>
              <span>{group.label}</span>
              <strong>{group.totalLabel}</strong>
            </span>
          </td>
        </tr>,
        ...group.expenses.flatMap((expense) => {
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
          const selected = selectedExpenseId === expense.id;
          const canEditThisExpense = canEditExpenses && expense.category !== "settlement";
          return [
            <tr className={selected ? expenseStyles.ledgerSelectedRowClassName : undefined} key={expense.id}>
              <td className={expenseStyles.tableTitleClassName}>
                <button
                  type="button"
                  className={expenseStyles.ledgerRowButtonClassName}
                  aria-pressed={selected}
                  onClick={() => onSelectExpense(expense)}
                >
                  <strong className={expenseStyles.ledgerTitleClassName}>{expense.title}</strong>
                  <ExpenseCategoryBadge category={expense.category} label={tableCopy.categories[expense.category]} />
                </button>
              </td>
              <td>
                <span className={expenseStyles.ledgerAmountClassName}>
                  {display.displayAmountLabel ?? display.amountLabel}
                </span>
                {display.displayAmountLabel && display.displayAmountLabel !== display.amountLabel ? (
                  <span className={expenseStyles.ledgerSubAmountClassName}>
                    {tableCopy.details.originalAmount}: {display.amountLabel}
                  </span>
                ) : null}
              </td>
              <td>
                {payer ? (
                  <ExpenseMemberLine color={payer.color} name={payer.name} />
                ) : expense.paidBy}
              </td>
              <td>
                <span className={expenseStyles.ledgerSplitCellClassName}>{display.splitTotalLabel}</span>
              </td>
              <td>
                <span className={expenseStyles.ledgerStopPillClassName}>
                  {linkedItem?.activity ?? tableCopy.uncategorizedStop}
                </span>
              </td>
              <td>
                <span className={expenseStyles.actionCellClassName}>
                  <IconButton type="button" aria-label={tableCopy.details.showDetails({ title: expense.title })} onClick={(event) => {
                    event.stopPropagation();
                    onSelectExpense(expense);
                  }}>
                    <Icon name="eye" />
                  </IconButton>
                  <IconButton type="button" aria-label={tableCopy.actions.editExpense({ title: expense.title })} disabled={!canEditThisExpense} onClick={(event) => {
                    event.stopPropagation();
                    onEditExpense(expense);
                  }}>
                    <Icon name="edit" />
                  </IconButton>
                </span>
              </td>
            </tr>,
          ];
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
