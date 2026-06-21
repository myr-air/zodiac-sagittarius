import { useMemo } from "react";
import {
  addMonths,
  buildCalendarDays,
  pickerWeekdays,
  timePickerPresets,
} from "./model/date-time-picker-model";
import {
  calendarGridClassName,
  dayButtonClassName,
  pickerHeaderClassName,
  pickerNavButtonClassName,
  pickerTitleClassName,
  timeButtonClassName,
  timeGridClassName,
  weekdayClassName,
} from "./internal/date-time-picker.styles";

export function CalendarContent({
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

export function TimePickerContent({
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
