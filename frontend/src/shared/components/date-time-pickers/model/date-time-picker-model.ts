export const pickerWeekdays = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];

export const timePickerPresets = [
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

export function buildCalendarDays(monthValue: string) {
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

export function addMonths(monthValue: string, amount: number) {
  const date = new Date(`${monthValue}T00:00:00`);
  date.setMonth(date.getMonth() + amount);
  return `${toDateValue(date).slice(0, 7)}-01`;
}

export function monthStart(value: string) {
  return `${value.slice(0, 7) || todayDate().slice(0, 7)}-01`;
}

export function todayDate() {
  return toDateValue(new Date());
}

export function toDateValue(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function normalizeTimeInput(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  let hourText: string;
  let minuteText: string;

  if (trimmed.includes(":")) {
    const [hourPart, minutePart, ...rest] = trimmed.split(":");
    if (!hourPart || !minutePart || rest.length > 0) return null;
    hourText = hourPart;
    minuteText = minutePart;
  } else {
    const digits = trimmed.replace(/\D/g, "");
    if (!digits || digits.length > 4) return null;
    if (digits.length <= 2) {
      hourText = digits;
      minuteText = "00";
    } else {
      hourText = digits.slice(0, -2);
      minuteText = digits.slice(-2);
    }
  }

  const hour = Number(hourText);
  const minute = Number(minuteText);
  if (
    Number.isNaN(hour) ||
    Number.isNaN(minute) ||
    hour < 0 ||
    hour > 23 ||
    minute < 0 ||
    minute > 59
  ) {
    return null;
  }

  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

export function normalizeTime(value: string) {
  return normalizeTimeInput(value) ?? "";
}
