import { useMemo } from "react";
import { slugifyFilePart } from "@/src/lib/file-names";
import { useCopyFeedbackState } from "@/src/shared/hooks/use-copy-feedback-state";
import { buildExpenseCsv, buildPaybackReminder } from "@/src/trip/expenses";
import type {
  ExpenseSummary,
  SettlementSuggestion,
  Trip,
} from "@/src/trip/types";

interface UseExpenseLedgerActionsInput {
  expenseSummary: ExpenseSummary;
  onRecordPaybackReminder?: (
    suggestion: SettlementSuggestion,
  ) => void | Promise<void>;
  statement: string;
  trip: Trip;
}

export function useExpenseLedgerActions({
  expenseSummary,
  onRecordPaybackReminder,
  statement,
  trip,
}: UseExpenseLedgerActionsInput) {
  const { copyState, copyText } = useCopyFeedbackState();
  const csv = useMemo(
    () => buildExpenseCsv({ trip, expenseSummary }),
    [expenseSummary, trip],
  );

  async function copyStatement() {
    await copyText(statement);
  }

  async function copyPaybackReminder(suggestion: SettlementSuggestion) {
    await copyText(buildPaybackReminder({ trip, suggestion }), () =>
      onRecordPaybackReminder?.(suggestion),
    );
  }

  function downloadCsv() {
    const blob = new Blob([`${csv}\n`], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = window.document.createElement("a");
    anchor.href = url;
    anchor.download = `${slugifyFilePart(trip.name)}-expenses.csv`;
    window.document.body.append(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  }

  return {
    copyPaybackReminder,
    copyState,
    copyStatement,
    downloadCsv,
  };
}
