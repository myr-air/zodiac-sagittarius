import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const expensesPageDir = join(dirname(fileURLToPath(import.meta.url)), "../..");

function readExpensesPageSource(fileName: string) {
  return readFileSync(join(expensesPageDir, fileName), "utf8");
}

describe("expenses page state structure", () => {
  it("keeps settlement mutations grouped outside the page state hook", () => {
    const pageStateSource = readExpensesPageSource(
      "hooks/use-trip-expenses-page-state.ts",
    );
    const settlementActionsSource = readExpensesPageSource(
      "hooks/useExpenseSettlementActions.ts",
    );

    expect(pageStateSource).toContain("useExpenseSettlementActions");
    expect(pageStateSource).not.toContain("buildSettlementExpenseInput");
    expect(pageStateSource).not.toContain("buildRefundExpenseInput");
    expect(settlementActionsSource).toContain("export function useExpenseSettlementActions");
    expect(settlementActionsSource).toContain("buildSettlementExpenseInput");
    expect(settlementActionsSource).toContain("buildRefundExpenseInput");
  });
});
