import {
  personalStatementDayGroups,
  personalStatementRows,
} from "../model/expense-personal-statement-display";
import { settlementSuggestionDisplay } from "../model/expense-overview-display";
import { settlementSuggestionKey } from "../hooks/useExpenseSettlementActions";
import * as expenseStyles from "../TripExpensesPage.styles";
import type { SettlementSuggestion, Trip } from "@/src/trip/types";
import { Button } from "@/src/ui";
import { Icon } from "@/src/ui/icons";
import { Fragment, useMemo } from "react";

interface ExpenseStatementSectionProps {
  canEditExpenses: boolean;
  currentMember: Trip["members"][number];
  displayCurrency: string;
  displayExchangeRateNumber: number;
  locale: "en" | "th";
  onCopyPaybackReminder: (suggestion: SettlementSuggestion) => void;
  onRecordSettlement: (suggestion: SettlementSuggestion) => void;
  pendingSettlementKeys: Set<string>;
  settlementCurrency: string;
  settlementSuggestions: SettlementSuggestion[];
  t: ReturnType<typeof import("@/src/i18n/I18nProvider").useI18n>["t"];
  trip: Trip;
}

export function ExpenseStatementSection({
  canEditExpenses,
  currentMember,
  displayCurrency,
  displayExchangeRateNumber,
  locale,
  onCopyPaybackReminder,
  onRecordSettlement,
  pendingSettlementKeys,
  settlementCurrency,
  settlementSuggestions,
  t,
  trip,
}: ExpenseStatementSectionProps) {
  const personalRows = useMemo(() => personalStatementRows({
    copy: {
      accountContext: t.expenses.statement.personal.accountContext,
      dateFallback: t.expenses.statement.dateFallback,
      flow: t.expenses.statement.personal.flow,
      includedLineItems: t.expenses.statement.personal.includedLineItems,
      noDirectAllocation: t.expenses.statement.personal.noDirectAllocation,
      paymentMethod: t.expenses.statement.personal.paymentMethod,
      relatedMember: t.expenses.statement.personal.relatedMember,
    },
    currentMemberId: currentMember.id,
    displayCurrency,
    displayExchangeRate: displayExchangeRateNumber,
    locale,
    settlementCurrency,
    trip,
  }), [
    currentMember.id,
    displayCurrency,
    displayExchangeRateNumber,
    locale,
    settlementCurrency,
    t,
    trip,
  ]);
  const accountSuggestions = settlementSuggestions.filter(
    (suggestion) => suggestion.from === currentMember.id || suggestion.to === currentMember.id,
  );
  const personalDayGroups = useMemo(() => personalStatementDayGroups(personalRows), [personalRows]);

  return (
    <section className={expenseStyles.statementSectionClassName} aria-label={t.expenses.statement.label}>
      <header className={expenseStyles.statementHeaderClassName}>
        <div className={expenseStyles.statementTitleClassName}>
          <h2>{t.expenses.statement.title}</h2>
          <p>{t.expenses.statement.description}</p>
        </div>
        <div className={expenseStyles.statementSummaryClassName} aria-label={t.expenses.statement.summaryLabel}>
          <span>{t.expenses.statement.personal.summary({ count: personalRows.length })}</span>
          <span>{t.expenses.statement.personal.paybackSummary({ count: accountSuggestions.length })}</span>
        </div>
      </header>

      <section className={expenseStyles.accountPaybackPanelClassName} aria-label={t.expenses.statement.personal.paybackTitle}>
        <header className={expenseStyles.accountPaybackHeaderClassName}>
          <div className={expenseStyles.statementTitleClassName}>
            <h3>{t.expenses.statement.personal.paybackTitle}</h3>
            <p>{t.expenses.statement.personal.paybackDescription}</p>
          </div>
        </header>
        {accountSuggestions.length ? (
          <div className={expenseStyles.accountPaybackListClassName}>
            {accountSuggestions.map((suggestion) => {
              const display = settlementSuggestionDisplay({
                balanceCopy: t.expenses.balance,
                displayCurrency,
                displayExchangeRate: displayExchangeRateNumber,
                locale,
                members: trip.members,
                reminderCopy: t.expenses.reminders,
                settlementCurrency,
                suggestion,
              });
              const isPending = pendingSettlementKeys.has(
                settlementSuggestionKey(suggestion, settlementCurrency),
              );
              return (
                <div className={expenseStyles.accountPaybackRowClassName} key={`${suggestion.from}-${suggestion.to}-${suggestion.amount}`}>
                  <div className={expenseStyles.accountPaybackTextClassName}>
                    <strong>{display.label}</strong>
                    {display.lastReminderLabel ? <span>{display.lastReminderLabel}</span> : null}
                  </div>
                  <div className={expenseStyles.balanceActionsClassName}>
                    <Button type="button" variant="ghost" className="min-h-8 px-2 py-1 text-xs" onClick={() => onCopyPaybackReminder(suggestion)}>
                      <Icon name="copy" /> {t.expenses.actions.copyReminder}
                    </Button>
                    <Button type="button" variant="ghost" className="min-h-8 px-2 py-1 text-xs" disabled={!canEditExpenses || isPending} onClick={() => void onRecordSettlement(suggestion)}>
                      <Icon name="check" /> {t.expenses.actions.saveSettlement}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className={expenseStyles.accountPaybackEmptyClassName}>{t.expenses.statement.personal.noPaybacks}</p>
        )}
      </section>

      <section className={expenseStyles.personalStatementSectionClassName} aria-label={t.expenses.statement.personal.tableLabel({ name: currentMember.displayName })}>
        <header className={expenseStyles.personalStatementHeaderClassName}>
          <div className={expenseStyles.statementTitleClassName}>
            <h3>{t.expenses.statement.personal.title({ name: currentMember.displayName })}</h3>
            <p>{t.expenses.statement.personal.description}</p>
          </div>
          <div className={expenseStyles.statementSummaryClassName}>
            <span>{t.expenses.statement.personal.summary({ count: personalRows.length })}</span>
          </div>
        </header>
        {personalRows.length ? (
          <>
            <div className={expenseStyles.personalStatementTableWrapClassName}>
              <table className={expenseStyles.personalStatementTableClassName} aria-label={t.expenses.statement.personal.tableLabel({ name: currentMember.displayName })}>
                <colgroup>
                  <col className="w-[250px]" />
                  <col className="w-[160px]" />
                  <col className="w-[160px]" />
                  <col className="w-[220px]" />
                  <col className="w-[140px]" />
                </colgroup>
                <thead className={expenseStyles.tableHeaderClassName}>
                  <tr>
                    <th>{t.expenses.statement.personal.columns.item}</th>
                    <th>{t.expenses.statement.personal.columns.flow}</th>
                    <th>{t.expenses.statement.personal.columns.relatedMember}</th>
                    <th>{t.expenses.statement.personal.columns.paidWith}</th>
                    <th className="text-right">{t.expenses.statement.personal.columns.amount}</th>
                  </tr>
                </thead>
                <tbody className={expenseStyles.statementTableBodyClassName}>
                  {personalDayGroups.map((group) => (
                    <Fragment key={`day-${group.dateLabel}`}>
                      <tr className={expenseStyles.personalStatementDayRowClassName}>
                        <th colSpan={5} scope="rowgroup">{group.dateLabel}</th>
                      </tr>
                      {group.rows.map((row) => (
                        <tr key={row.id}>
                          <td>
                            <div className={expenseStyles.statementItemCellClassName}>
                              <strong>{row.title}</strong>
                              {row.contextLabel ? <span>{row.contextLabel}</span> : null}
                              <span>{row.includedLabel}</span>
                            </div>
                          </td>
                          <td className={expenseStyles.statementMetaCellClassName}>{row.flowLabel}</td>
                          <td className={expenseStyles.statementMetaCellClassName}>{row.relatedMemberLabel}</td>
                          <td className={expenseStyles.statementMetaCellClassName}>{row.paidWithLabel}</td>
                          <td className={`${expenseStyles.statementAmountCellClassName} ${expenseStyles.personalStatementAmountToneClassNames[row.amountTone]}`}>
                            {row.amountLabel}
                            {row.displayAmountLabel ? <span>{row.displayAmountLabel}</span> : null}
                          </td>
                        </tr>
                      ))}
                    </Fragment>
                  ))}
                </tbody>
              </table>
            </div>
            <ul className={expenseStyles.personalStatementMobileListClassName}>
              {personalDayGroups.map((group) => (
                <li className={expenseStyles.personalStatementMobileDayGroupClassName} key={`mobile-day-${group.dateLabel}`}>
                  <div className={expenseStyles.personalStatementMobileDayClassName}>{group.dateLabel}</div>
                  <ul className={expenseStyles.personalStatementMobileDayRowsClassName}>
                    {group.rows.map((row) => (
                      <li
                        aria-label={`${row.title} · ${row.amountLabel} · ${row.dateLabel}`}
                        className={expenseStyles.personalStatementMobileRowClassName}
                        key={row.id}
                      >
                        <details className={expenseStyles.personalStatementMobileDetailsClassName}>
                          <summary>
                            <div className={expenseStyles.personalStatementMobileTopClassName}>
                              <div className={expenseStyles.statementMobileTitleClassName}>
                                <strong>{row.title}</strong>
                                <span>{row.flowLabel}</span>
                              </div>
                              <div className={`${expenseStyles.statementAmountCellClassName} ${expenseStyles.personalStatementAmountToneClassNames[row.amountTone]}`}>
                                {row.amountLabel}
                                {row.displayAmountLabel ? <span>{row.displayAmountLabel}</span> : null}
                                <small>{t.expenses.statement.mobileDetails}</small>
                              </div>
                            </div>
                          </summary>
                          <div className={expenseStyles.personalStatementMobileIncludedClassName}>
                            {row.contextLabel ? <span>{row.contextLabel}</span> : null}
                            <span>{row.includedLabel}</span>
                          </div>
                          <dl className={expenseStyles.personalStatementMobileMetaClassName}>
                            <div>
                              <dt>{t.expenses.statement.personal.columns.relatedMember}</dt>
                              <dd>{row.relatedMemberLabel}</dd>
                            </div>
                            <div>
                              <dt>{t.expenses.statement.personal.columns.paidWith}</dt>
                              <dd>{row.paidWithLabel}</dd>
                            </div>
                          </dl>
                        </details>
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
            </ul>
          </>
        ) : (
          <p className={expenseStyles.statementEmptyClassName}>{t.expenses.statement.personal.empty}</p>
        )}
      </section>
    </section>
  );
}
