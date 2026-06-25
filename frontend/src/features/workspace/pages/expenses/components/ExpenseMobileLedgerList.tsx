import { findItineraryItemById } from "@/src/trip/itinerary-items";
import type { Expense, Member, Trip } from "@/src/trip/types";
import * as expenseStyles from "../TripExpensesPage.styles";
import {
  expenseLedgerPayerDisplay,
  expenseLedgerRowDisplay,
} from "../model/expense-ledger-display";
import type { ExpenseLedgerDayGroup } from "../model/expense-page-filters";
import { ExpenseCategoryBadge } from "./ExpenseCategoryBadge";
import { ExpenseMemberLine } from "./ExpenseMemberLine";

interface ExpenseMobileLedgerListProps {
  dayGroups: ExpenseLedgerDayGroup[];
  displayCurrency: string;
  displayExchangeRate: number;
  members: Member[];
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
  dayGroups,
  displayCurrency,
  displayExchangeRate,
  members,
  onSelectExpense,
  selectedExpenseId,
  settlementCurrency,
  tableCopy,
  trip,
}: ExpenseMobileLedgerListProps) {
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
            const selected = selectedExpenseId === expense.id;

            return (
              <button
                type="button"
                aria-pressed={selected}
                className={selected ? `${expenseStyles.mobileLedgerCardClassName} ${expenseStyles.mobileLedgerCardSelectedClassName}` : expenseStyles.mobileLedgerCardClassName}
                key={expense.id}
                onClick={() => onSelectExpense(expense)}
              >
                <div className={expenseStyles.mobileLedgerCardTopClassName}>
                  <div className={expenseStyles.mobileLedgerCardTitleClassName}>
                    <strong className={expenseStyles.ledgerTitleClassName}>{expense.title}</strong>
                    <ExpenseCategoryBadge category={expense.category} label={tableCopy.categories[expense.category]} />
                  </div>
                  <span className={expenseStyles.mobileLedgerCardAmountClassName}>
                    {display.amountLabel}
                    {display.approximateDisplayAmountLabel ? <small>{display.approximateDisplayAmountLabel}</small> : null}
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
              </button>
            );
          })}
        </section>
      ))}
      {!dayGroups.length ? <p className={expenseStyles.balanceMetaClassName}>{tableCopy.empty}</p> : null}
    </div>
  );
}
