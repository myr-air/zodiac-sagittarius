export const expenseDialogRepeatCountRange = {
  max: 31,
  min: 1,
} as const;

export function validExpenseDialogRepeatCount(value: number): boolean {
  return (
    Number.isInteger(value) &&
    value >= expenseDialogRepeatCountRange.min &&
    value <= expenseDialogRepeatCountRange.max
  );
}
