import type { Member, Trip } from "@/src/trip/types";
import { ExpenseDialog } from "./ExpenseDialog";
import type {
  CreateExpenseHandler,
  ExpenseDialogTarget,
  UpdateExpenseHandler,
} from "../model/expense-page-types";

interface ExpenseDialogLayerProps {
  apiBaseUrl: string;
  currentMember: Member;
  dialogExpense: ExpenseDialogTarget;
  selectedTripPlanId?: string | null;
  settlementCurrency: string;
  trip: Trip;
  onClose: () => void;
  onCreateExpense: CreateExpenseHandler;
  onUpdateExpense: UpdateExpenseHandler;
}

export function ExpenseDialogLayer({
  apiBaseUrl,
  currentMember,
  dialogExpense,
  selectedTripPlanId,
  settlementCurrency,
  trip,
  onClose,
  onCreateExpense,
  onUpdateExpense,
}: ExpenseDialogLayerProps) {
  return dialogExpense ? (
    <ExpenseDialog
      expense={dialogExpense === "new" ? null : dialogExpense}
      trip={trip}
      currentMember={currentMember}
      settlementCurrency={settlementCurrency}
      selectedTripPlanId={selectedTripPlanId}
      apiBaseUrl={apiBaseUrl}
      onClose={onClose}
      onCreateExpense={onCreateExpense}
      onUpdateExpense={onUpdateExpense}
    />
  ) : null;
}
