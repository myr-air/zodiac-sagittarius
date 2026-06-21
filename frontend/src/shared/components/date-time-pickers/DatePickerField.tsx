import { useRef, useState } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/src/lib/cn";
import { monthStart, todayDate } from "./model/date-time-picker-model";
import {
  focusInputWithoutOpening,
  PickerPanel,
  PickerTrigger,
  usePickerPosition,
} from "./internal/date-time-picker-popover";
import { inputWrapClassName } from "./internal/date-time-picker.styles";
import type { BasePickerProps } from "./internal/date-time-picker.types";
import { CalendarContent } from "./DateTimePickerContent";

export function DatePickerField({
  "aria-label": ariaLabelAttribute,
  ariaLabel,
  className,
  disabled,
  id,
  onBlur,
  onChange,
  required,
  value,
}: BasePickerProps & {
  onChange: (value: string) => void;
  value: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const suppressOpenOnFocusRef = useRef(false);
  const [open, setOpen] = useState(false);
  const [position, setPosition] = usePickerPosition(open, inputRef, 320);
  const [visibleMonth, setVisibleMonth] = useState(() => monthStart(value || todayDate()));
  const label = ariaLabel ?? ariaLabelAttribute;

  function openPicker() {
    setVisibleMonth(monthStart(value || todayDate()));
    setOpen(true);
  }

  return (
    <div className={inputWrapClassName}>
      <input
        ref={inputRef}
        aria-label={label}
        className={cn(className, "pr-10")}
        disabled={disabled}
        id={id}
        inputMode="numeric"
        pattern="[0-9]{4}-[0-9]{2}-[0-9]{2}"
        placeholder="YYYY-MM-DD"
        required={required}
        type="text"
        value={value}
        onBlur={onBlur}
        onChange={(event) => onChange(event.target.value)}
        onFocus={() => {
          if (suppressOpenOnFocusRef.current) return;
          openPicker();
        }}
      />
      <PickerTrigger
        disabled={disabled}
        label="Open date picker"
        onClick={() => {
          if (open) {
            setOpen(false);
            return;
          }
          openPicker();
        }}
      />
      {open
        ? createPortal(
            <PickerPanel
              inputRef={inputRef}
              position={position}
              setPosition={setPosition}
              suppressOpenOnFocusRef={suppressOpenOnFocusRef}
              width={320}
              onClose={() => setOpen(false)}
            >
              <CalendarContent
                value={value}
                visibleMonth={visibleMonth}
                onChangeMonth={setVisibleMonth}
                onSelect={(nextValue) => {
                  onChange(nextValue);
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
