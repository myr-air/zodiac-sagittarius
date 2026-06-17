import { useEffect, useMemo, useRef, useState, type MutableRefObject, type ReactNode, type RefObject } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/src/lib/cn";
import { Button } from "@/src/ui";

const pickerPanelClassName =
  "joii-picker fixed z-[40] grid max-h-[calc(100dvh-16px)] gap-3 overflow-auto rounded-(--radius-lg) border border-(--color-route-border) bg-(--color-surface) p-3 text-(--color-text) shadow-[0_20px_42px_rgb(37_99_235_/_0.1),0_8px_16px_rgb(15_23_42_/_0.07)]";
const inputWrapClassName = "relative min-w-0";
const triggerClassName =
  "absolute inset-y-1 right-1 inline-grid min-h-0 w-8 place-items-center rounded-(--radius-sm) border border-transparent bg-transparent text-(--color-text-muted) transition-colors hover:bg-(--color-route-soft) hover:text-(--color-route)";
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

const weekdays = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];
const timePresets = [
  "06:00",
  "07:00",
  "08:00",
  "08:30",
  "09:00",
  "09:30",
  "10:00",
  "11:00",
  "12:00",
  "13:00",
  "14:00",
  "15:00",
  "16:00",
  "16:30",
  "17:00",
  "18:00",
  "19:00",
  "20:00",
  "21:00",
  "22:00",
];

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

function focusInputWithoutOpening(
  inputRef: RefObject<HTMLInputElement | null>,
  suppressOpenOnFocusRef: MutableRefObject<boolean>,
) {
  suppressOpenOnFocusRef.current = true;
  inputRef.current?.focus();
  window.requestAnimationFrame(() => {
    suppressOpenOnFocusRef.current = false;
  });
}

function PickerTrigger({
  disabled,
  label,
  onClick,
}: {
  disabled?: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      aria-label={label}
      className={triggerClassName}
      disabled={disabled}
      type="button"
      onMouseDown={(event) => event.preventDefault()}
      onClick={onClick}
    >
      <span aria-hidden="true">v</span>
    </button>
  );
}

function PickerPanel({
  children,
  inputRef,
  onClose,
  position,
  setPosition,
  suppressOpenOnFocusRef,
  width,
}: {
  children: ReactNode;
  inputRef: RefObject<HTMLInputElement | null>;
  onClose: () => void;
  position: { left: number; top: number; width: number };
  setPosition: (position: { left: number; top: number; width: number }) => void;
  suppressOpenOnFocusRef: MutableRefObject<boolean>;
  width: number;
}) {
  const panelRef = useRef<HTMLElement>(null);

  useEffect(() => {
    function updatePosition() {
      const triggerRect = inputRef.current?.getBoundingClientRect();
      if (!triggerRect) return;
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const panelWidth = Math.min(width, viewportWidth - 16);
      const panelHeight = Math.min(
        panelRef.current?.getBoundingClientRect().height ?? 320,
        viewportHeight - 16,
      );
      const left = Math.min(
        Math.max(8, triggerRect.left),
        Math.max(8, viewportWidth - panelWidth - 8),
      );
      const belowTop = triggerRect.bottom + 6;
      const aboveTop = triggerRect.top - panelHeight - 6;
      const top =
        belowTop + panelHeight <= viewportHeight - 8
          ? belowTop
          : Math.min(
              Math.max(8, aboveTop),
              Math.max(8, viewportHeight - panelHeight - 8),
            );
      setPosition({ left, top, width: panelWidth });
    }

    updatePosition();
    const frame = window.requestAnimationFrame(updatePosition);
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [inputRef, setPosition, width]);

  useEffect(() => {
    function closeOnOutside(event: MouseEvent | TouchEvent) {
      const target = event.target as Node | null;
      if (!target) return;
      if (inputRef.current?.contains(target) || panelRef.current?.contains(target))
        return;
      onClose();
    }
    document.addEventListener("mousedown", closeOnOutside);
    document.addEventListener("touchstart", closeOnOutside);
    return () => {
      document.removeEventListener("mousedown", closeOnOutside);
      document.removeEventListener("touchstart", closeOnOutside);
    };
  }, [inputRef, onClose]);

  return (
    <section
      ref={panelRef}
      className={pickerPanelClassName}
      style={position}
      role="dialog"
      aria-label="Joii date time picker"
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          event.preventDefault();
          onClose();
          focusInputWithoutOpening(inputRef, suppressOpenOnFocusRef);
        }
      }}
    >
      {children}
    </section>
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
        {weekdays.map((day) => (
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
      {timePresets.map((time) => (
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

function usePickerPosition(
  open: boolean,
  inputRef: RefObject<HTMLInputElement | null>,
  width: number,
): [
  { left: number; top: number; width: number },
  (position: { left: number; top: number; width: number }) => void,
] {
  const [position, setPosition] = useState({ left: 8, top: 8, width });

  useEffect(() => {
    if (!open) return;
    const rect = inputRef.current?.getBoundingClientRect();
    if (!rect) return;
    setPosition({
      left: Math.max(8, rect.left),
      top: Math.min(window.innerHeight - 8, rect.bottom + 6),
      width: Math.min(width, window.innerWidth - 16),
    });
  }, [inputRef, open, width]);

  return [position, setPosition];
}

function buildCalendarDays(monthValue: string) {
  const start = new Date(`${monthValue}T00:00:00`);
  const firstDay = start.getDay() || 7;
  const gridStart = new Date(start);
  gridStart.setDate(start.getDate() - firstDay + 1);

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(gridStart);
    date.setDate(gridStart.getDate() + index);
    const value = toDateValue(date);
    return {
      inMonth: value.slice(0, 7) === monthValue.slice(0, 7),
      label: String(date.getDate()),
      value,
    };
  });
}

function addMonths(monthValue: string, amount: number) {
  const date = new Date(`${monthValue}T00:00:00`);
  date.setMonth(date.getMonth() + amount);
  return toDateValue(date).slice(0, 7) + "-01";
}

function monthStart(value: string) {
  return `${value.slice(0, 7) || todayDate().slice(0, 7)}-01`;
}

function todayDate() {
  return toDateValue(new Date());
}

function toDateValue(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function normalizeTime(value: string) {
  return /^\d{2}:\d{2}$/.test(value) ? value : "";
}
