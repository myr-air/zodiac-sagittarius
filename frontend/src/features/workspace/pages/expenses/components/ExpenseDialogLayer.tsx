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
  const isNewExpense =
    dialogExpense === "new" || dialogExpense === "new-personal";
  return dialogExpense ? (
    <ExpenseDialog
      expense={isNewExpense ? null : dialogExpense}
      trip={trip}
      currentMember={currentMember}
      initialSplitMode={dialogExpense === "new-personal" ? "personal" : undefined}
      settlementCurrency={settlementCurrency}
      selectedTripPlanId={selectedTripPlanId}
      apiBaseUrl={apiBaseUrl}
      onClose={onClose}
      onCreateExpense={onCreateExpense}
      onUpdateExpense={onUpdateExpense}
    />
  ) : null;
}
