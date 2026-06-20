import { useState } from "react";
import { DatePickerField, DateTimePickerField, TimePickerField } from "./DateTimePickers";

export type PickerKind = "date" | "time" | "datetime";

export interface PickerStoryProps {
  disabled?: boolean;
  kind: PickerKind;
  label: string;
  value: string;
}

const fieldShellClassName =
  "grid w-full max-w-[380px] gap-2 rounded-(--radius-lg) border border-(--color-border) bg-(--color-surface) p-4 shadow-[0_10px_22px_rgb(55_47_38_/_0.04)]";
const labelClassName = "grid gap-1.5 text-[13px] font-bold text-(--color-text-muted)";
const inputClassName =
  "min-h-11 w-full rounded-(--radius-md) border border-(--color-border-strong) bg-(--color-surface) px-3 text-sm font-semibold text-(--color-text)";
const valueClassName = "text-xs font-extrabold text-(--color-text-muted)";

export function PickerStory({
  disabled = false,
  kind,
  label,
  value: initialValue,
}: PickerStoryProps) {
  const [value, setValue] = useState(initialValue);

  return (
    <div className="grid min-h-[460px] place-items-start bg-(--color-page) p-8">
      <div className={fieldShellClassName}>
        <label className={labelClassName}>
          <span>{label}</span>
          {kind === "time" ? (
            <TimePickerField
              aria-label={label}
              className={inputClassName}
              disabled={disabled}
              value={value}
              onChange={setValue}
            />
          ) : null}
          {kind === "date" ? (
            <DatePickerField
              aria-label={label}
              className={inputClassName}
              disabled={disabled}
              value={value}
              onChange={setValue}
            />
          ) : null}
          {kind === "datetime" ? (
            <DateTimePickerField
              className={inputClassName}
              disabled={disabled}
              value={value}
              onChange={setValue}
            />
          ) : null}
        </label>
        <span className={valueClassName}>Selected: {value}</span>
      </div>
    </div>
  );
}
