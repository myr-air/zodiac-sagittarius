import { useI18n } from "@/src/i18n/I18nProvider";
import type { Expense, Member, Trip } from "@/src/trip/types";
import { IconButton } from "@/src/ui";
import { Icon } from "@/src/ui/icons";
import { ExpenseDialogFormContent } from "./components/ExpenseDialogFormContent";
import { useExpenseDialogState } from "./hooks/useExpenseDialogState";
import * as expenseStyles from "./TripExpensesPage.styles";
import type {
  CreateExpenseHandler,
  UpdateExpenseHandler,
} from "./model/expense-page-types";

interface ExpenseDialogProps {
  expense: Expense | null;
  trip: Trip;
  currentMember: Member;
  settlementCurrency: string;
  selectedTripPlanId?: string | null;
  apiBaseUrl: string;
  onClose: () => void;
  onCreateExpense: CreateExpenseHandler;
  onUpdateExpense: UpdateExpenseHandler;
}

export function ExpenseDialog({
  expense,
  trip,
  currentMember,
  settlementCurrency,
  selectedTripPlanId,
  apiBaseUrl,
  onClose,
  onCreateExpense,
  onUpdateExpense,
}: ExpenseDialogProps) {
  const { t } = useI18n();
  const state = useExpenseDialogState({
    apiBaseUrl,
    currentMember,
    expense,
    selectedTripPlanId,
    settlementCurrency,
    trip,
    onCreateExpense,
    onUpdateExpense,
  });

  return (
    <div className={expenseStyles.dialogBackdropClassName}>
      <section className={expenseStyles.dialogClassName} role="dialog" aria-modal="true" aria-label={expense ? t.expenses.dialog.editTitle : t.expenses.dialog.addTitle}>
        <div className={expenseStyles.dialogHeaderClassName}>
          <h2>{expense ? t.expenses.dialog.editTitle : t.expenses.dialog.addTitle}</h2>
          <IconButton type="button" aria-label={t.common.actions.close} onClick={onClose}><Icon name="x" /></IconButton>
        </div>
        <form className={expenseStyles.dialogFormClassName} onSubmit={state.submitExpense}>
          <ExpenseDialogFormContent
            expense={expense}
            onCancel={onClose}
            settlementCurrency={settlementCurrency}
            state={state}
            t={t}
            trip={trip}
          />
        </form>
      </section>
    </div>
  );
}
