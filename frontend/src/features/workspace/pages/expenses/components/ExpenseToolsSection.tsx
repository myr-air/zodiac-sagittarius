import { formatMoney } from "@/src/trip/expenses";
import { useState } from "react";
import * as expenseStyles from "../TripExpensesPage.styles";
import { parseExpenseAmountExpression } from "../model/expense-amount-expression";
import type { ExpenseCopyState } from "../model/expense-page-types";
import { ExpenseMoneySettings } from "./ExpenseMoneySettings";

interface ExpenseToolsSectionProps {
  canEditExpenses: boolean;
  copyState: ExpenseCopyState;
  displayCurrency: string;
  displayExchangeRate: string;
  settlementCurrency: string;
  t: ReturnType<typeof import("@/src/i18n/I18nProvider").useI18n>["t"];
  onCopyStatement: () => void;
  onDisplayCurrencyChange: (value: string) => void;
  onDisplayExchangeRateChange: (value: string) => void;
  onDownloadCsv: () => void;
}

export function ExpenseToolsSection({
  canEditExpenses,
  copyState,
  displayCurrency,
  displayExchangeRate,
  settlementCurrency,
  t,
  onCopyStatement,
  onDisplayCurrencyChange,
  onDisplayExchangeRateChange,
  onDownloadCsv,
}: ExpenseToolsSectionProps) {
  const [calculatorExpression, setCalculatorExpression] = useState("");
  const calculatorResult = parseExpenseAmountExpression(calculatorExpression);
  const calculatorFeedback = calculatorExpression.trim()
    ? calculatorResult.error
      ? { tone: "danger" as const, text: t.expenses.tools.calculatorInvalid }
      : { tone: "muted" as const, text: t.expenses.tools.calculatorResult({ amount: formatMoney(calculatorResult.value, settlementCurrency) }) }
    : { tone: "muted" as const, text: t.expenses.tools.calculatorEmpty };

  return (
    <section className={expenseStyles.financeViewClassName} aria-label={t.expenses.tools.label}>
      <section className={expenseStyles.toolCalculatorClassName} aria-label={t.expenses.tools.calculatorTitle}>
        <div className={expenseStyles.settingsHeaderClassName}>
          <div>
            <h2>{t.expenses.tools.calculatorTitle}</h2>
            <p>{t.expenses.tools.calculatorDescription}</p>
          </div>
        </div>
        <label className={expenseStyles.fieldClassName}>
          <span>{t.expenses.tools.calculatorExpression}</span>
          <input
            inputMode="decimal"
            placeholder={t.expenses.tools.calculatorPlaceholder}
            value={calculatorExpression}
            onChange={(event) => setCalculatorExpression(event.target.value)}
          />
        </label>
        <p className={calculatorFeedback.tone === "danger" ? expenseStyles.fieldErrorClassName : expenseStyles.fieldHintClassName}>
          {calculatorFeedback.text}
        </p>
      </section>
      {canEditExpenses ? (
        <ExpenseMoneySettings
          copyState={copyState}
          displayCurrency={displayCurrency}
          displayExchangeRate={displayExchangeRate}
          settlementCurrency={settlementCurrency}
          t={t}
          onCopyStatement={onCopyStatement}
          onDisplayCurrencyChange={onDisplayCurrencyChange}
          onDisplayExchangeRateChange={onDisplayExchangeRateChange}
          onDownloadCsv={onDownloadCsv}
        />
      ) : null}
    </section>
  );
}
