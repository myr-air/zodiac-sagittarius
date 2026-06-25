import { describe, expect, it } from "vitest";
import {
  balanceListClassName,
  balanceRowClassName,
  expenseOverviewRowClassName,
  expenseOverviewWarningRowClassName,
  financeTabActiveClassName,
  financeTabClassName,
  financeTabsClassName,
  ledgerDetailActionsClassName,
  ledgerDetailHeaderClassName,
  ledgerWorkspaceClassName,
  mobileLedgerCardClassName,
  mobileLedgerCardSelectedClassName,
  scopeAuditListClassName,
  scopeAuditRowClassName,
  settingsActionsClassName,
  settlementRowClassName,
  transactionDetailActionsClassName,
  transactionDetailClassName,
  transactionDetailDangerActionClassName,
  transactionDetailEmptyClassName,
  transactionDetailPrimaryActionClassName,
  transactionDetailSecondaryActionClassName,
  transactionDetailSecondaryActionsClassName,
} from "../TripExpensesPage.styles";

describe("TripExpensesPage styles", () => {
  it("keeps expense overview rows on one local row shell", () => {
    expect(expenseOverviewRowClassName).toContain("border-b");
    expect(expenseOverviewRowClassName).toContain("px-0");
    expect(balanceRowClassName).toContain(expenseOverviewRowClassName);
    expect(settlementRowClassName).toContain(expenseOverviewWarningRowClassName);
    expect(scopeAuditRowClassName).toContain(expenseOverviewWarningRowClassName);
  });

  it("keeps expense overview list spacing centralized", () => {
    expect(scopeAuditListClassName).toBe(balanceListClassName);
  });

  it("keeps finance navigation flat and stable", () => {
    expect(financeTabsClassName).toContain("expense-finance-tabs");
    expect(financeTabsClassName).toContain("bg-(--color-surface)");
    expect(financeTabsClassName).toContain("max-[767px]:sticky");
    expect(financeTabsClassName).toContain("grid-cols-3");
    expect(financeTabsClassName).not.toContain("linear-gradient");
    expect(financeTabClassName).toContain("min-h-10");
    expect(financeTabClassName).toContain("min-w-0");
    expect(financeTabClassName).toContain("text-ellipsis");
    expect(financeTabActiveClassName).toContain("border-(--color-primary-border)");
  });

  it("keeps ledger detail layouts responsive without nested card chrome", () => {
    expect(ledgerWorkspaceClassName).not.toContain("grid-cols-[minmax(0,1fr)_300px]");
    expect(ledgerDetailHeaderClassName).toContain("grid-cols-[minmax(0,1fr)_auto]");
    expect(ledgerDetailActionsClassName).toContain("max-[1023px]:flex");
    expect(transactionDetailClassName).toContain("expense-transaction-detail");
    expect(transactionDetailClassName).toContain("max-[767px]:fixed");
    expect(transactionDetailClassName).not.toContain("backdrop-blur");
    expect(transactionDetailEmptyClassName).toContain("border-dashed");
    expect(transactionDetailActionsClassName).toContain("p-2.5");
    expect(transactionDetailPrimaryActionClassName).toContain("min-h-11");
    expect(transactionDetailSecondaryActionsClassName).toContain("grid gap-2");
    expect(transactionDetailSecondaryActionClassName).toContain("justify-start");
    expect(transactionDetailSecondaryActionClassName).toContain("text-xs");
    expect(transactionDetailDangerActionClassName).toContain("text-xs");
  });

  it("keeps mobile feed and settings actions touch-safe", () => {
    expect(mobileLedgerCardClassName).toContain("shadow-none");
    expect(mobileLedgerCardSelectedClassName).toContain("bg-(--color-primary-soft)");
    expect(settingsActionsClassName).toContain("[&>*]:min-h-10");
  });
});
