export interface SelectOption<Value extends string = string> {
  value: Value;
  label: string;
  disabled?: boolean;
}

export function buildSelectOptions<Value extends string>(
  values: readonly Value[],
  labelForValue: (value: Value) => string,
): SelectOption<Value>[] {
  return values.map((value) => ({ value, label: labelForValue(value) }));
}

export function buildSelectOptionsFromItems<Item, Value extends string>(
  items: readonly Item[],
  valueForItem: (item: Item) => Value,
  labelForItem: (item: Item) => string,
): SelectOption<Value>[] {
  return items.map((item) => ({
    value: valueForItem(item),
    label: labelForItem(item),
  }));
}

export function buildAllFilterSelectOptions<Value extends string>(
  values: readonly ("all" | Value)[],
  allLabel: string,
  labelForValue: (value: Value) => string,
): SelectOption<"all" | Value>[] {
  return buildSelectOptions(values, (value) =>
    value === "all" ? allLabel : labelForValue(value),
  );
}

export function withAllFilterValue<const Values extends readonly string[]>(
  values: Values,
): readonly ["all", ...Values] {
  return ["all", ...values];
}

export function prependSelectOption<Value extends string>(
  options: readonly SelectOption<Value>[],
  leadingOption?: SelectOption<Value>,
): SelectOption<Value>[] {
  return leadingOption ? [leadingOption, ...options] : [...options];
}
