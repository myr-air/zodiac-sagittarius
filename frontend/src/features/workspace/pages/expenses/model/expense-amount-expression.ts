export type ExpenseAmountExpressionError = "empty" | "syntax";

export interface ExpenseAmountExpressionResult {
  error: ExpenseAmountExpressionError | null;
  isExpression: boolean;
  value: number;
}

const numberPattern = /^(?:\d+(?:\.\d+)?|\.\d+)/;

export function parseExpenseAmountExpression(input: string): ExpenseAmountExpressionResult {
  const source = input.trim();
  if (!source) {
    return { error: "empty", isExpression: false, value: Number.NaN };
  }

  let index = 0;
  let sign = 1;
  let total = 0;
  let expectingNumber = true;
  let isExpression = false;

  while (index < source.length) {
    while (/\s/.test(source[index] ?? "")) index += 1;
    if (index >= source.length) break;

    if (expectingNumber) {
      const match = source.slice(index).match(numberPattern);
      if (!match) {
        return { error: "syntax", isExpression, value: Number.NaN };
      }
      total += sign * Number(match[0]);
      index += match[0].length;
      expectingNumber = false;
      continue;
    }

    const token = source[index];
    if (token !== "+" && token !== "-") {
      return { error: "syntax", isExpression, value: Number.NaN };
    }
    sign = token === "-" ? -1 : 1;
    isExpression = true;
    expectingNumber = true;
    index += 1;
  }

  if (expectingNumber) {
    return { error: "syntax", isExpression, value: Number.NaN };
  }

  return {
    error: null,
    isExpression,
    value: roundMoney(total),
  };
}

function roundMoney(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}
