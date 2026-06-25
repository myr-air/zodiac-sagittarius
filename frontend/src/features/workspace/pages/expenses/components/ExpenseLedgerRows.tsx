import { findItineraryItemById } from "@/src/trip/itinerary-items";
import type { Expense, Member, Trip } from "@/src/trip/types";
import { Button, IconButton } from "@/src/ui";
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
  onSelectExpense: (expense: Expense) => void;
  pendingRefundExpenseIds: Set<string>;
  selectedExpenseId: string | null;
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
      memberMath: string;
      originalAmount: string;
      hideDetails(input: { title: string }): string;
      paidBy: string;
      showDetails(input: { title: string }): string;
      split: string;
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
  onDeleteExpense,
  onDuplicateExpenseAsEstimate,
  onEditExpense,
  onRecordRefund,
  onSelectExpense,
  pendingRefundExpenseIds,
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
          const detailId = `expense-ledger-detail-${expense.id}`;
          const memberBreakdown = display.memberBreakdown ?? [];
          return [
            <tr className={selected ? expenseStyles.ledgerSelectedRowClassName : undefined} key={expense.id}>
              <td className={expenseStyles.tableTitleClassName}>
                <button
                  type="button"
                  className={expenseStyles.ledgerRowButtonClassName}
                  aria-controls={detailId}
                  aria-expanded={selected}
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
                  <IconButton type="button" aria-controls={detailId} aria-expanded={selected} aria-label={(selected ? tableCopy.details.hideDetails : tableCopy.details.showDetails)({ title: expense.title })} onClick={(event) => {
                    event.stopPropagation();
                    onSelectExpense(expense);
                  }}>
                    <Icon name="eye" />
                  </IconButton>
                  {canEditThisExpense ? (
                    <IconButton type="button" aria-label={tableCopy.actions.editExpense({ title: expense.title })} onClick={(event) => {
                      event.stopPropagation();
                      onEditExpense(expense);
                    }}>
                      <Icon name="edit" />
                    </IconButton>
                  ) : null}
                </span>
              </td>
            </tr>,
            selected ? (
              <tr className={expenseStyles.ledgerDetailRowClassName} key={`${expense.id}-details`}>
                <td colSpan={6} id={detailId}>
                  <div className={expenseStyles.ledgerDetailPanelClassName}>
                    <div className={expenseStyles.ledgerDetailHeaderClassName}>
                      <dl className={expenseStyles.ledgerDetailGridClassName}>
                        <div>
                          <dt>{tableCopy.details.paidBy}</dt>
                          <dd>{payer ? <ExpenseMemberLine color={payer.color} name={payer.name} /> : expense.paidBy}</dd>
                        </div>
                        <div>
                          <dt>{tableCopy.details.split}</dt>
                          <dd>{display.splitTotalLabel}</dd>
                        </div>
                        <div>
                          <dt>{tableCopy.details.sourceAndMath}</dt>
                          <dd>
                            {display.sourceLabel || display.calculationLabel ? (
                              <span className={expenseStyles.ledgerDetailStackClassName}>
                                {display.sourceLabel ? <span>{display.sourceLabel}</span> : null}
                                {display.calculationLabel ? <span>{display.calculationLabel}</span> : null}
                              </span>
                            ) : (
                              tableCopy.uncategorizedStop
                            )}
                          </dd>
                        </div>
                      </dl>
                      <div className={expenseStyles.ledgerDetailActionsClassName}>
                        <Button
                          type="button"
                          aria-label={tableCopy.actions.editExpense({ title: expense.title })}
                          className={expenseStyles.ledgerDetailActionClassName}
                          disabled={!canEditThisExpense}
                          onClick={() => onEditExpense(expense)}
                        >
                          <Icon name="edit" /> {tableCopy.actions.editExpenseShort}
                        </Button>
                        <Button
                          type="button"
                          variant="secondary"
                          aria-label={tableCopy.actions.recordRefund({ title: expense.title })}
                          className={expenseStyles.ledgerDetailActionClassName}
                          disabled={!canEditExpenses || !display.canRecordRefund || pendingRefundExpenseIds.has(expense.id)}
                          onClick={() => void onRecordRefund(expense)}
                        >
                          <Icon name="wallet" /> {tableCopy.actions.recordRefundShort}
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          aria-label={tableCopy.actions.duplicateAsEstimate({ title: expense.title })}
                          className={expenseStyles.ledgerDetailActionClassName}
                          disabled={!canEditExpenses || !onDuplicateExpenseAsEstimate}
                          onClick={() => void onDuplicateExpenseAsEstimate?.(expense)}
                        >
                          <Icon name="copy" /> {tableCopy.actions.duplicateAsEstimateShort}
                        </Button>
                        <Button
                          type="button"
                          variant="danger"
                          aria-label={tableCopy.actions.cancelExpense({ title: expense.title })}
                          className={expenseStyles.ledgerDetailActionClassName}
                          disabled={!canEditExpenses}
                          onClick={() => onDeleteExpense(expense.id)}
                        >
                          <Icon name="trash" /> {tableCopy.actions.cancelExpenseShort}
                        </Button>
                      </div>
                    </div>
                    {memberBreakdown.length ? (
                      <details className={expenseStyles.ledgerDetailDisclosureClassName}>
                        <summary>{tableCopy.details.memberMath}</summary>
                        <ul className={expenseStyles.ledgerMemberListClassName}>
                          {memberBreakdown.map((line) => (
                            <li key={line}>{line}</li>
                          ))}
                        </ul>
                      </details>
                    ) : null}
                  </div>
                </td>
              </tr>
            ) : null,
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
