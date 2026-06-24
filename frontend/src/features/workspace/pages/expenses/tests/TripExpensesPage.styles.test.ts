import { describe, expect, it } from "vitest";
import {
  balanceListClassName,
  balanceRowClassName,
  expenseOverviewRowClassName,
  expenseOverviewWarningRowClassName,
  scopeAuditListClassName,
  scopeAuditRowClassName,
  settlementRowClassName,
} from "../TripExpensesPage.styles";

describe("TripExpensesPage styles", () => {
  it("keeps expense overview rows on one local row shell", () => {
    expect(expenseOverviewRowClassName).toContain("rounded-(--radius-md)");
    expect(expenseOverviewRowClassName).toContain("px-2.5");
    expect(balanceRowClassName).toContain(expenseOverviewRowClassName);
    expect(settlementRowClassName).toContain(expenseOverviewWarningRowClassName);
    expect(scopeAuditRowClassName).toContain(expenseOverviewWarningRowClassName);
  });

  it("keeps expense overview list spacing centralized", () => {
    expect(scopeAuditListClassName).toBe(balanceListClassName);
  });
});
