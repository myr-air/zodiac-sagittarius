import type { ExpenseStatementStatus } from "../model/expense-statement-display";
import { expenseStatementRows } from "../model/expense-statement-display";
import { personalStatementRows } from "../model/expense-personal-statement-display";
import * as expenseStyles from "../TripExpensesPage.styles";
import type { Trip } from "@/src/trip/types";
import { type KeyboardEvent, useMemo, useState } from "react";

type ExpenseStatementFilter = "all" | ExpenseStatementStatus;

interface ExpenseStatementSectionProps {
  currentMember: Trip["members"][number];
  displayCurrency: string;
  displayExchangeRateNumber: number;
  locale: "en" | "th";
  settlementCurrency: string;
  t: ReturnType<typeof import("@/src/i18n/I18nProvider").useI18n>["t"];
  trip: Trip;
}

export function ExpenseStatementSection({
  currentMember,
  displayCurrency,
  displayExchangeRateNumber,
  locale,
  settlementCurrency,
  t,
  trip,
}: ExpenseStatementSectionProps) {
  const [activeFilter, setActiveFilter] = useState<ExpenseStatementFilter>("all");
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
  const rows = useMemo(() => expenseStatementRows({
    copy: {
      categories: t.expenses.categories,
      dateFallback: t.expenses.statement.dateFallback,
      linkedStopFallback: t.expenses.uncategorizedStop,
      recordSourceLedger: t.expenses.statement.recordSource.ledger,
      recordSourceSettlement: t.expenses.statement.recordSource.settlement,
      splitMembers: t.expenses.statement.splitMembers,
      splitSingle: t.expenses.statement.splitSingle,
      status: t.expenses.statement.status,
      statusReason: t.expenses.statement.statusReason,
      statusShortReason: t.expenses.statement.statusShortReason,
      type: t.expenses.statement.type,
    },
    displayCurrency,
    displayExchangeRate: displayExchangeRateNumber,
    locale,
    settlementCurrency,
    trip,
  }), [
    displayCurrency,
    displayExchangeRateNumber,
    locale,
    settlementCurrency,
    t,
    trip,
  ]);
  const filteredRows = rows.filter((row) => activeFilter === "all" || row.status === activeFilter);
  const filterOptions: { label: string; value: ExpenseStatementFilter }[] = [
    { label: t.expenses.statement.filters.all, value: "all" },
    { label: t.expenses.statement.status.needsReview, value: "needsReview" },
    { label: t.expenses.statement.status.settlementRecorded, value: "settlementRecorded" },
    { label: t.expenses.statement.status.noPaybackNeeded, value: "noPaybackNeeded" },
  ];
  const focusStatementFilter = (value: ExpenseStatementFilter) => {
    window.requestAnimationFrame(() => {
      document.getElementById(`expense-statement-filter-${value}`)?.focus();
    });
  };
  const onFilterKeyDown = (event: KeyboardEvent<HTMLButtonElement>, value: ExpenseStatementFilter) => {
    const currentIndex = filterOptions.findIndex((option) => option.value === value);
    const next =
      event.key === "ArrowRight"
        ? filterOptions[(currentIndex + 1) % filterOptions.length]
        : event.key === "ArrowLeft"
          ? filterOptions[(currentIndex - 1 + filterOptions.length) % filterOptions.length]
          : event.key === "Home"
            ? filterOptions[0]
            : event.key === "End"
              ? filterOptions[filterOptions.length - 1]
              : null;
    if (!next) return;
    event.preventDefault();
    setActiveFilter(next.value);
    focusStatementFilter(next.value);
  };

  return (
    <section className={expenseStyles.statementSectionClassName} aria-label={t.expenses.statement.label}>
      <header className={expenseStyles.statementHeaderClassName}>
        <div className={expenseStyles.statementTitleClassName}>
          <h2>{t.expenses.statement.title}</h2>
          <p>{t.expenses.statement.description}</p>
        </div>
        <div className={expenseStyles.statementSummaryClassName} aria-label={t.expenses.statement.summaryLabel}>
          <span>{t.expenses.statement.summaryRows({ count: rows.length })}</span>
          <span>{t.expenses.statement.summaryNeedsReview({ count: rows.filter((row) => row.status === "needsReview").length })}</span>
        </div>
      </header>

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

      <div className={expenseStyles.statementFilterBarClassName} aria-label={t.expenses.statement.filters.label} role="radiogroup">
        {filterOptions.map((option) => (
          <button
            type="button"
            aria-checked={activeFilter === option.value}
            className={
              activeFilter === option.value
                ? `${expenseStyles.statementFilterButtonClassName} ${expenseStyles.statementFilterButtonActiveClassName}`
                : expenseStyles.statementFilterButtonClassName
            }
            id={`expense-statement-filter-${option.value}`}
            key={option.value}
            role="radio"
            tabIndex={activeFilter === option.value ? 0 : -1}
            onClick={() => setActiveFilter(option.value)}
            onKeyDown={(event) => onFilterKeyDown(event, option.value)}
          >
            {option.label}
          </button>
        ))}
      </div>

      {filteredRows.length ? (
        <>
          <div className={expenseStyles.tableWrapClassName}>
            <table className={expenseStyles.statementTableClassName} aria-label={t.expenses.statement.tableLabel}>
              <colgroup>
                <col className="w-[132px]" />
                <col className="w-[220px]" />
                <col className="w-[112px]" />
                <col className="w-[132px]" />
                <col className="w-[132px]" />
                <col className="w-[156px]" />
                <col className="w-[132px]" />
                <col className="w-[112px]" />
              </colgroup>
              <thead className={expenseStyles.tableHeaderClassName}>
                <tr>
                  <th>{t.expenses.statement.columns.date}</th>
                  <th>{t.expenses.statement.columns.item}</th>
                  <th>{t.expenses.statement.columns.type}</th>
                  <th>{t.expenses.statement.columns.paidBy}</th>
                  <th>{t.expenses.statement.columns.recordSource}</th>
                  <th>{t.expenses.statement.columns.status}</th>
                  <th className="text-right">{t.expenses.statement.columns.amount}</th>
                  <th>{t.expenses.statement.columns.split}</th>
                </tr>
              </thead>
              <tbody className={expenseStyles.statementTableBodyClassName}>
                {filteredRows.map((row) => (
                  <tr key={row.id}>
                    <td className={expenseStyles.statementMetaCellClassName}>{row.dateLabel}</td>
                    <td>
                      <div className={expenseStyles.statementItemCellClassName}>
                        <strong>{row.title}</strong>
                        <span>{row.categoryLabel} · {row.linkedStopLabel}</span>
                      </div>
                    </td>
                    <td className={expenseStyles.statementMetaCellClassName}>{row.typeLabel}</td>
                    <td className={expenseStyles.statementMetaCellClassName}>{row.paidByLabel}</td>
                    <td className={expenseStyles.statementMetaCellClassName}>{row.recordSourceLabel}</td>
                    <td>
                      <div className={expenseStyles.statementStatusCellClassName}>
                        <span
                          aria-describedby={`expense-statement-status-short-reason-${row.id}`}
                          className={`${expenseStyles.statementStatusClassName} ${expenseStyles.statementStatusToneClassNames[row.status]}`}
                        >
                          {row.statusLabel}
                        </span>
                        <div className={expenseStyles.statementStatusReasonRowClassName}>
                          <span className={expenseStyles.statementStatusReasonClassName} id={`expense-statement-status-short-reason-${row.id}`}>
                            {row.statusShortReason}
                          </span>
                          <details className={expenseStyles.statementReasonTooltipClassName}>
                            <summary aria-label={t.expenses.statement.reasonDetails} title={row.statusReason}>i</summary>
                            <span>{row.statusReason}</span>
                          </details>
                        </div>
                      </div>
                    </td>
                    <td className={expenseStyles.statementAmountCellClassName}>
                      {row.amountLabel}
                      {row.displayAmountLabel ? <span>{row.displayAmountLabel}</span> : null}
                    </td>
                    <td className={expenseStyles.statementMetaCellClassName}>{row.splitLabel}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <ul className={expenseStyles.statementMobileListClassName}>
            {filteredRows.map((row) => (
              <li
                aria-label={`${row.title} · ${row.amountLabel} · ${row.dateLabel}`}
                className={expenseStyles.statementMobileRowClassName}
                key={row.id}
              >
                <div className={expenseStyles.statementMobileTopClassName}>
                  <div className={expenseStyles.statementMobileTitleClassName}>
                    <strong>{row.title}</strong>
                    <span>{row.dateLabel}</span>
                  </div>
                  <div className={expenseStyles.statementAmountCellClassName}>
                    {row.amountLabel}
                    {row.displayAmountLabel ? <span>{row.displayAmountLabel}</span> : null}
                  </div>
                </div>
                <div className={expenseStyles.statementMobileSummaryClassName}>
                  <span>{row.paidByLabel}</span>
                  <span
                    aria-describedby={`expense-statement-mobile-status-reason-${row.id}`}
                    className={`${expenseStyles.statementStatusClassName} ${expenseStyles.statementStatusToneClassNames[row.status]}`}
                  >
                    {row.statusLabel}
                  </span>
                </div>
                <details className={expenseStyles.statementMobileDetailsClassName}>
                  <summary>{t.expenses.statement.mobileDetails}</summary>
                  <dl className={expenseStyles.statementMobileMetaClassName}>
                    <div>
                      <dt>{t.expenses.statement.columns.recordSource}</dt>
                      <dd>{row.recordSourceLabel}</dd>
                    </div>
                    <div>
                      <dt>{t.expenses.statement.columns.split}</dt>
                      <dd>{row.splitLabel}</dd>
                    </div>
                    <div>
                      <dt>{t.expenses.statement.columns.status}</dt>
                      <dd id={`expense-statement-mobile-status-reason-${row.id}`}>{row.statusShortReason}</dd>
                    </div>
                    <div>
                      <dt>{t.expenses.statement.reasonDetails}</dt>
                      <dd>{row.statusReason}</dd>
                    </div>
                  </dl>
                </details>
              </li>
            ))}
          </ul>
        </>
      ) : (
        <p className={expenseStyles.statementEmptyClassName}>{t.expenses.statement.empty}</p>
      )}
    </section>
  );
}
