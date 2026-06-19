import { useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/src/lib/cn";
import { Button } from "@/src/ui";
import {
  addMonths,
  buildCalendarDays,
  monthStart,
  normalizeTime,
  pickerWeekdays,
  timePickerPresets,
  todayDate,
} from "./date-time-picker-model";
import {
  focusInputWithoutOpening,
  PickerPanel,
  PickerTrigger,
  usePickerPosition,
} from "./date-time-picker-popover";

const inputWrapClassName = "relative min-w-0";
const pickerHeaderClassName = "grid grid-cols-[32px_minmax(0,1fr)_32px] items-center gap-2";
const pickerNavButtonClassName =
  "inline-grid size-8 place-items-center rounded-(--radius-sm) border border-(--color-border) bg-(--color-surface) text-sm font-black text-(--color-route) hover:bg-(--color-route-soft)";
const pickerTitleClassName = "min-w-0 text-center text-sm font-extrabold text-(--color-text)";
const calendarGridClassName = "grid grid-cols-7 gap-1";
const weekdayClassName = "grid h-7 place-items-center text-[11px] font-extrabold text-(--color-text-muted)";
const dayButtonClassName =
  "grid h-9 min-w-9 place-items-center rounded-(--radius-sm) border border-transparent bg-(--color-surface-subtle) text-xs font-extrabold text-(--color-text) transition-colors hover:border-(--color-route-border) hover:bg-(--color-route-soft) disabled:cursor-not-allowed disabled:opacity-35 data-[selected=true]:border-(--color-route) data-[selected=true]:bg-(--color-route) data-[selected=true]:text-white";
const timeGridClassName = "grid grid-cols-4 gap-1.5";
const timeButtonClassName =
  "min-h-9 rounded-(--radius-sm) border border-(--color-border) bg-(--color-surface-subtle) px-2 text-xs font-extrabold tabular-nums text-(--color-text) transition-colors hover:border-(--color-route-border) hover:bg-(--color-route-soft) data-[selected=true]:border-(--color-route) data-[selected=true]:bg-(--color-route) data-[selected=true]:text-white";
const pickerActionsClassName = "grid grid-cols-2 gap-2 border-t border-(--color-border) pt-2";

type BasePickerProps = {
  "aria-label"?: string;
  ariaLabel?: string;
  className?: string;
  disabled?: boolean;
  id?: string;
  onBlur?: () => void;
  required?: boolean;
};

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
        onBlur={onBlur}
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

function CalendarContent({
  onChangeMonth,
  onSelect,
  value,
  visibleMonth,
}: {
  onChangeMonth: (value: string) => void;
  onSelect: (value: string) => void;
  value: string;
  visibleMonth: string;
}) {
  const days = useMemo(() => buildCalendarDays(visibleMonth), [visibleMonth]);
  const title = new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric",
  }).format(new Date(`${visibleMonth}T00:00:00`));

  return (
    <div className="grid gap-2">
      <div className={pickerHeaderClassName}>
        <button
          className={pickerNavButtonClassName}
          type="button"
          aria-label="Previous month"
          onClick={() => onChangeMonth(addMonths(visibleMonth, -1))}
        >
          &lt;
        </button>
        <strong className={pickerTitleClassName}>{title}</strong>
        <button
          className={pickerNavButtonClassName}
          type="button"
          aria-label="Next month"
          onClick={() => onChangeMonth(addMonths(visibleMonth, 1))}
        >
          &gt;
        </button>
      </div>
      <div className={calendarGridClassName}>
        {pickerWeekdays.map((day) => (
          <span className={weekdayClassName} key={day}>
            {day}
          </span>
        ))}
        {days.map((day) => (
          <button
            className={dayButtonClassName}
            data-selected={day.value === value ? "true" : undefined}
            disabled={!day.inMonth}
            key={day.value}
            type="button"
            onClick={() => onSelect(day.value)}
          >
            {day.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function TimePickerContent({
  onSelect,
  value,
}: {
  onSelect: (value: string) => void;
  value: string;
}) {
  return (
    <div className={timeGridClassName}>
      {timePickerPresets.map((time) => (
        <button
          className={timeButtonClassName}
          data-selected={time === value ? "true" : undefined}
          key={time}
          type="button"
          onClick={() => onSelect(time)}
        >
          {time}
        </button>
      ))}
    </div>
  );
}
