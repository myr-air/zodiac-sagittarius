import { useEffect, useMemo, useState } from "react";
import { slugifyFilePart } from "@/src/lib/file-names";
import { buildExpenseCsv, buildPaybackReminder } from "@/src/trip/expenses";
import type {
  ExpenseSummary,
  SettlementSuggestion,
  Trip,
} from "@/src/trip/types";
import type { ExpenseCopyState } from "../expense-page-types";

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
  const [copyState, setCopyState] = useState<ExpenseCopyState>("idle");
  const csv = useMemo(
    () => buildExpenseCsv({ trip, expenseSummary }),
    [expenseSummary, trip],
  );

  useEffect(() => {
    if (copyState === "idle") return undefined;
    const timeout = window.setTimeout(() => setCopyState("idle"), 2500);
    return () => window.clearTimeout(timeout);
  }, [copyState]);

  async function copyStatement() {
    try {
      await navigator.clipboard.writeText(statement);
      setCopyState("copied");
    } catch {
      setCopyState("error");
    }
  }

  async function copyPaybackReminder(suggestion: SettlementSuggestion) {
    try {
      await navigator.clipboard.writeText(
        buildPaybackReminder({ trip, suggestion }),
      );
      await onRecordPaybackReminder?.(suggestion);
      setCopyState("copied");
    } catch {
      setCopyState("error");
    }
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
