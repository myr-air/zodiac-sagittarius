import { useI18n } from "@/src/i18n/I18nProvider";
import { WorkspaceDialog } from "@/src/shared/components/workspace-dialog";
import type { Expense, Member, Trip } from "@/src/trip/types";
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
  const title = expense ? t.expenses.dialog.editTitle : t.expenses.dialog.addTitle;

  return (
    <WorkspaceDialog
      ariaLabel={title}
      className={expenseStyles.dialogClassName}
      closeAriaLabel={t.common.actions.close}
      formClassName={expenseStyles.dialogFormClassName}
      onClose={onClose}
      onSubmit={state.submitExpense}
      title={title}
    >
      <ExpenseDialogFormContent
        expense={expense}
        onCancel={onClose}
        settlementCurrency={settlementCurrency}
        state={state}
        t={t}
        trip={trip}
      />
    </WorkspaceDialog>
  );
}
