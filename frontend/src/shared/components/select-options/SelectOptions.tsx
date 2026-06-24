import type { SelectOption } from "@/src/shared/select-options";

export type SelectOptionItem<Value extends string = string> = SelectOption<Value>;

interface SelectOptionsProps<Value extends string = string> {
  options: readonly SelectOptionItem<Value>[];
}

export function SelectOptions<Value extends string = string>({
  options,
}: SelectOptionsProps<Value>) {
  return (
    <>
      {options.map((option) => (
        <option key={option.value} value={option.value} disabled={option.disabled}>
          {option.label}
        </option>
      ))}
    </>
  );
}
