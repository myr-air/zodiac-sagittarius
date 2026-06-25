import { personalStatementRows } from "../model/expense-personal-statement-display";
import { settlementSuggestionDisplay } from "../model/expense-overview-display";
import { settlementSuggestionKey } from "../hooks/useExpenseSettlementActions";
import * as expenseStyles from "../TripExpensesPage.styles";
import type { SettlementSuggestion, Trip } from "@/src/trip/types";
import { Button } from "@/src/ui";
import { Icon } from "@/src/ui/icons";
import { useMemo } from "react";

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
                  <details className={`${expenseStyles.overviewActionMenuClassName} ${expenseStyles.overviewIconButtonClassName}`}>
                    <summary aria-label={t.expenses.table.actions} role="button" title={t.expenses.table.actions}>
                      <Icon name="dots" />
                    </summary>
                    <div className={expenseStyles.accountPaybackMenuPanelClassName}>
                      <Button type="button" variant="ghost" className="min-h-8 px-2 py-1 text-xs" onClick={() => onCopyPaybackReminder(suggestion)}>
                        <Icon name="copy" /> {t.expenses.actions.copyReminder}
                      </Button>
                      <Button type="button" variant="ghost" className="min-h-8 px-2 py-1 text-xs" disabled={!canEditExpenses || isPending} onClick={() => void onRecordSettlement(suggestion)}>
                        <Icon name="check" /> {t.expenses.actions.saveSettlement}
                      </Button>
                    </div>
                  </details>
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
                  <col className="w-[132px]" />
                  <col className="w-[250px]" />
                  <col className="w-[160px]" />
                  <col className="w-[160px]" />
                  <col className="w-[220px]" />
                  <col className="w-[140px]" />
                </colgroup>
                <thead className={expenseStyles.tableHeaderClassName}>
                  <tr>
                    <th>{t.expenses.statement.personal.columns.date}</th>
                    <th>{t.expenses.statement.personal.columns.item}</th>
                    <th>{t.expenses.statement.personal.columns.flow}</th>
                    <th>{t.expenses.statement.personal.columns.relatedMember}</th>
                    <th>{t.expenses.statement.personal.columns.paidWith}</th>
                    <th className="text-right">{t.expenses.statement.personal.columns.amount}</th>
                  </tr>
                </thead>
                <tbody className={expenseStyles.statementTableBodyClassName}>
                  {personalRows.map((row) => (
                    <tr key={row.id}>
                      <td className={expenseStyles.statementMetaCellClassName}>{row.dateLabel}</td>
                      <td>
                        <div className={expenseStyles.statementItemCellClassName}>
                          <strong>{row.title}</strong>
                          <span>{row.includedLabel}</span>
                        </div>
                      </td>
                      <td className={expenseStyles.statementMetaCellClassName}>{row.flowLabel}</td>
                      <td className={expenseStyles.statementMetaCellClassName}>{row.relatedMemberLabel}</td>
                      <td className={expenseStyles.statementMetaCellClassName}>{row.paidWithLabel}</td>
                      <td className={expenseStyles.statementAmountCellClassName}>
                        {row.amountLabel}
                        {row.displayAmountLabel ? <span>{row.displayAmountLabel}</span> : null}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <ul className={expenseStyles.personalStatementMobileListClassName}>
              {personalRows.map((row) => (
                <li
                  aria-label={`${row.title} · ${row.amountLabel} · ${row.dateLabel}`}
                  className={expenseStyles.personalStatementMobileRowClassName}
                  key={row.id}
                >
                  <div className={expenseStyles.personalStatementMobileTopClassName}>
                    <div className={expenseStyles.statementMobileTitleClassName}>
                      <strong>{row.title}</strong>
                      <span>{row.dateLabel}</span>
                    </div>
                    <div className={expenseStyles.statementAmountCellClassName}>
                      {row.amountLabel}
                      {row.displayAmountLabel ? <span>{row.displayAmountLabel}</span> : null}
                    </div>
                  </div>
                  <div className={expenseStyles.personalStatementMobileIncludedClassName}>{row.includedLabel}</div>
                  <dl className={expenseStyles.personalStatementMobileMetaClassName}>
                    <div>
                      <dt>{t.expenses.statement.personal.columns.flow}</dt>
                      <dd>{row.flowLabel}</dd>
                    </div>
                    <div>
                      <dt>{t.expenses.statement.personal.columns.relatedMember}</dt>
                      <dd>{row.relatedMemberLabel}</dd>
                    </div>
                    <div>
                      <dt>{t.expenses.statement.personal.columns.paidWith}</dt>
                      <dd>{row.paidWithLabel}</dd>
                    </div>
                  </dl>
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
