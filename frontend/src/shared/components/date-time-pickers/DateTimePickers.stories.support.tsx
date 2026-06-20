import { useState } from "react";
import type { ReactNode } from "react";
import { DatePickerField, DateTimePickerField, TimePickerField } from "./DateTimePickers";

interface PickerFieldRendererProps {
  disabled: boolean;
  inputClassName: string;
  label: string;
  onChange: (value: string) => void;
  value: string;
}

const pickerFieldRenderers = {
  date: ({ disabled, inputClassName, label, onChange, value }: PickerFieldRendererProps) => (
    <DatePickerField
      aria-label={label}
      className={inputClassName}
      disabled={disabled}
      value={value}
      onChange={onChange}
    />
  ),
  time: ({ disabled, inputClassName, label, onChange, value }: PickerFieldRendererProps) => (
    <TimePickerField
      aria-label={label}
      className={inputClassName}
      disabled={disabled}
      value={value}
      onChange={onChange}
    />
  ),
  datetime: ({ disabled, inputClassName, onChange, value }: PickerFieldRendererProps) => (
    <DateTimePickerField
      className={inputClassName}
      disabled={disabled}
      value={value}
      onChange={onChange}
    />
  ),
} satisfies Record<string, (props: PickerFieldRendererProps) => ReactNode>;

export type PickerKind = keyof typeof pickerFieldRenderers;
export const pickerKindValues = Object.keys(pickerFieldRenderers) as PickerKind[];

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
  const renderPickerField = pickerFieldRenderers[kind];

  return (
    <div className="grid min-h-[460px] place-items-start bg-(--color-page) p-8">
      <div className={fieldShellClassName}>
        <label className={labelClassName}>
          <span>{label}</span>
          {renderPickerField({ disabled, inputClassName, label, value, onChange: setValue })}
        </label>
        <span className={valueClassName}>Selected: {value}</span>
      </div>
    </div>
  );
}
