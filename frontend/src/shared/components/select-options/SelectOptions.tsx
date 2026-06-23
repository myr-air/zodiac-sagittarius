import type { ReactNode } from "react";

export interface SelectOptionItem<Value extends string = string> {
  value: Value;
  label: ReactNode;
  disabled?: boolean;
}

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
