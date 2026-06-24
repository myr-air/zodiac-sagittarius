export interface SelectOption<Value extends string = string> {
  value: Value;
  label: string;
}

export function buildSelectOptions<Value extends string>(
  values: readonly Value[],
  labelForValue: (value: Value) => string,
): SelectOption<Value>[] {
  return values.map((value) => ({ value, label: labelForValue(value) }));
}
