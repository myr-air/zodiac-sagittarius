import { useRef, useState } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/src/lib/cn";
import {
  normalizeTime,
  normalizeTimeInput,
} from "./model/date-time-picker-model";
import {
  focusInputWithoutOpening,
  PickerPanel,
  PickerTrigger,
  usePickerPosition,
} from "./internal/date-time-picker-popover";
import { inputWrapClassName } from "./internal/date-time-picker.styles";
import type { BasePickerProps } from "./internal/date-time-picker.types";
import { TimePickerContent } from "./DateTimePickerContent";

export function TimePickerField({
  "aria-label": ariaLabelAttribute,
  ariaLabel,
  className,
  disabled,
  id,
  onBlur,
  onChange,
  onSelect,
  required,
  value,
}: BasePickerProps & {
  onChange: (value: string) => void;
  onSelect?: (value: string) => void;
  value: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const suppressOpenOnFocusRef = useRef(false);
  const [open, setOpen] = useState(false);
  const [position, setPosition] = usePickerPosition(open, inputRef, 300);
  const normalizedValue = normalizeTime(value);
  const label = ariaLabel ?? ariaLabelAttribute;

  return (
    <div className={inputWrapClassName}>
      <input
        ref={inputRef}
        aria-label={label}
        className={cn(className, "pr-10")}
        disabled={disabled}
        id={id}
        inputMode="numeric"
        pattern="[0-9]{2}:[0-9]{2}"
        placeholder="HH:mm"
        required={required}
        type="text"
        value={value}
        onBlur={() => {
          const normalized = normalizeTimeInput(value);
          if (normalized !== null && normalized !== value) {
            onChange(normalized);
          }
          onBlur?.();
        }}
        onChange={(event) => onChange(event.target.value)}
        onFocus={() => {
          if (suppressOpenOnFocusRef.current) return;
          setOpen(true);
        }}
      />
      <PickerTrigger disabled={disabled} label="Open time picker" onClick={() => setOpen((current) => !current)} />
      {open
        ? createPortal(
            <PickerPanel
              inputRef={inputRef}
              position={position}
              setPosition={setPosition}
              suppressOpenOnFocusRef={suppressOpenOnFocusRef}
              width={300}
              onClose={() => setOpen(false)}
            >
              <TimePickerContent
                value={normalizedValue}
                onSelect={(nextValue) => {
                  onChange(nextValue);
                  onSelect?.(nextValue);
                  setOpen(false);
                  focusInputWithoutOpening(inputRef, suppressOpenOnFocusRef);
                }}
              />
            </PickerPanel>,
            document.body,
          )
        : null}
    </div>
  );
}
