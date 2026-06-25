import { describe, expect, it } from "vitest";
import { parseExpenseAmountExpression } from "../expense-amount-expression";

describe("expense amount expressions", () => {
  it("calculates addition and subtraction expressions", () => {
    expect(parseExpenseAmountExpression("90+64+40-14")).toEqual({
      error: null,
      isExpression: true,
      value: 180,
    });
  });

  it("accepts whitespace and decimal amounts", () => {
    expect(parseExpenseAmountExpression(" 90.50\t+\n64 - 14.25 ")).toEqual({
      error: null,
      isExpression: true,
      value: 140.25,
    });
  });

  it("keeps plain numbers valid without marking them as expressions", () => {
    expect(parseExpenseAmountExpression("120")).toEqual({
      error: null,
      isExpression: false,
      value: 120,
    });
  });

  it("rejects malformed formulas", () => {
    expect(parseExpenseAmountExpression("90++14").error).toBe("syntax");
    expect(parseExpenseAmountExpression("90+").error).toBe("syntax");
    expect(parseExpenseAmountExpression("abc").error).toBe("syntax");
  });
});
