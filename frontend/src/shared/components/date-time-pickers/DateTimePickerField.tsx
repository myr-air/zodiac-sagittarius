import { useRef, useState } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/src/lib/cn";
import { Button } from "@/src/ui";
import { monthStart, normalizeTime, todayDate } from "./date-time-picker-model";
import {
  PickerPanel,
  PickerTrigger,
  usePickerPosition,
} from "./date-time-picker-popover";
import { inputWrapClassName, pickerActionsClassName } from "./date-time-picker.styles";
import { CalendarContent, TimePickerContent } from "./DateTimePickerContent";

export function DateTimePickerField({
  className,
  disabled,
  onChange,
  value,
}: {
  className?: string;
  disabled?: boolean;
  onChange: (value: string) => void;
  value: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const suppressOpenOnFocusRef = useRef(false);
  const [open, setOpen] = useState(false);
  const [position, setPosition] = usePickerPosition(open, inputRef, 340);
  const [visibleMonth, setVisibleMonth] = useState(() => monthStart(value.slice(0, 10) || todayDate()));
  const selectedDate = value.slice(0, 10);
  const selectedTime = normalizeTime(value.slice(11, 16)) || "09:00";

  function openPicker() {
    setVisibleMonth(monthStart(selectedDate || todayDate()));
    setOpen(true);
  }

  function commitDate(nextDate: string) {
    onChange(`${nextDate}T${selectedTime}`);
  }

  function commitTime(nextTime: string) {
    onChange(`${selectedDate || todayDate()}T${nextTime}`);
  }

  return (
    <div className={inputWrapClassName}>
      <input
        ref={inputRef}
        className={cn(className, "pr-10")}
        disabled={disabled}
        inputMode="numeric"
        placeholder="YYYY-MM-DDTHH:mm"
        type="text"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onFocus={() => {
          if (suppressOpenOnFocusRef.current) return;
          openPicker();
        }}
      />
      <PickerTrigger
        disabled={disabled}
        label="Open date and time picker"
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
              width={340}
              onClose={() => setOpen(false)}
            >
              <CalendarContent
                value={selectedDate}
                visibleMonth={visibleMonth}
                onChangeMonth={setVisibleMonth}
                onSelect={commitDate}
              />
              <div className="grid gap-2">
                <strong className="text-xs font-extrabold text-(--color-text-muted)">Time</strong>
                <TimePickerContent value={selectedTime} onSelect={commitTime} />
              </div>
              <div className={pickerActionsClassName}>
                <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
                  Close
                </Button>
                <Button type="button" onClick={() => setOpen(false)}>
                  Apply
                </Button>
              </div>
            </PickerPanel>,
            document.body,
          )
        : null}
    </div>
  );
}
