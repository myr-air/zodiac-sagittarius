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
