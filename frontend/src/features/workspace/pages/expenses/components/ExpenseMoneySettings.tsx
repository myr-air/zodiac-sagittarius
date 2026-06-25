import { SelectOptions } from "@/src/shared/components/select-options";
import { majorCurrencySelectOptions } from "@/src/trip/currencies";
import { Button, Select } from "@/src/ui";
import { Icon } from "@/src/ui/icons";
import * as expenseStyles from "../TripExpensesPage.styles";
import type { ExpenseCopyState, ExpensePageLabels } from "../model/expense-page-types";
import { ExpenseCopyFeedback } from "./ExpenseCopyFeedback";

interface ExpenseMoneySettingsProps {
  copyState: ExpenseCopyState;
  displayCurrency: string;
  displayExchangeRate: string;
  settlementCurrency: string;
  t: ExpensePageLabels;
  onCopyStatement: () => void;
  onDisplayCurrencyChange: (currency: string) => void;
  onDisplayExchangeRateChange: (rate: string) => void;
  onDownloadCsv: () => void;
}

export function ExpenseMoneySettings({
  copyState,
  displayCurrency,
  displayExchangeRate,
  settlementCurrency,
  t,
  onCopyStatement,
  onDisplayCurrencyChange,
  onDisplayExchangeRateChange,
  onDownloadCsv,
}: ExpenseMoneySettingsProps) {
  const needsDisplayExchangeRate = displayCurrency !== settlementCurrency;

  return (
    <section className={`${expenseStyles.panelClassName} ${expenseStyles.accountToolsOrderClassName}`} aria-label={t.expenses.tabs.settings}>
      <div className={expenseStyles.settingsHeaderClassName}>
        <div>
          <h2>{t.expenses.tabs.settings}</h2>
          <p>{t.expenses.settings.description}</p>
        </div>
        <ExpenseCopyFeedback copyState={copyState} t={t} />
      </div>
      <div className={expenseStyles.settingsGridClassName}>
        <label className={expenseStyles.fieldClassName}>
          <span>{t.expenses.filters.displayCurrency}</span>
          <Select value={displayCurrency} onChange={(event) => onDisplayCurrencyChange(event.target.value)}>
            <SelectOptions options={majorCurrencySelectOptions()} />
          </Select>
        </label>
        <label className={expenseStyles.fieldClassName}>
          <span>{t.expenses.filters.displayExchangeRate({ currency: settlementCurrency, displayCurrency })}</span>
          <input
            disabled={!needsDisplayExchangeRate}
            inputMode="decimal"
            value={displayExchangeRate}
            onChange={(event) => onDisplayExchangeRateChange(event.target.value)}
          />
        </label>
      </div>
      <div className={expenseStyles.settingsActionsClassName}>
        <Button type="button" variant="ghost" onClick={onCopyStatement}>
          <Icon name="copy" /> {t.expenses.actions.copyStatement}
        </Button>
        <Button type="button" variant="ghost" onClick={onDownloadCsv}>
          <Icon name="export" /> {t.expenses.actions.downloadCsv}
        </Button>
      </div>
    </section>
  );
}
