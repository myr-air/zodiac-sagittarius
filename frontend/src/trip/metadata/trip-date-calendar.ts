import { formatDisplayDateTime } from "@/src/shared/date-time-display";

export interface RouteCalendarDay {
  value: string;
  day: string;
  label: string;
  inRange: boolean;
  tourDay: number | null;
  tourTone: "odd" | "even" | "none";
  dateState: "start" | "end" | "in-range" | "today" | "default";
}

export function formatPreviewTravelDate(value: string): string {
  if (!value) return "--";
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return formatDisplayDateTime(date, "en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export function routeCalendarDays(seed: string, startDate: string, endDate: string): RouteCalendarDay[] {
  const seedDate = new Date(`${seed || "2026-06-01"}T00:00:00`);
  const year = Number.isNaN(seedDate.getTime()) ? 2026 : seedDate.getFullYear();
  const month = Number.isNaN(seedDate.getTime()) ? 5 : seedDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const start = Date.parse(`${startDate}T00:00:00`);
  const end = Date.parse(`${endDate}T00:00:00`);
  const todayValue = localDateValue(new Date());
  return Array.from({ length: daysInMonth }, (_, index) => {
    const date = new Date(year, month, index + 1);
    const value = localDateValue(date);
    const time = date.getTime();
    const inRange = Number.isFinite(start) && Number.isFinite(end) && time >= Math.min(start, end) && time <= Math.max(start, end);
    const tourDay = inRange ? Math.round((time - Math.min(start, end)) / 86_400_000) + 1 : null;
    const dateState = value === startDate ? "start" : value === endDate ? "end" : inRange ? "in-range" : value === todayValue ? "today" : "default";
    return {
      value,
      day: String(index + 1),
      label: formatDisplayDateTime(date, "en", { day: "numeric", month: "short", year: "numeric" }),
      inRange,
      tourDay,
      tourTone: tourDay ? (tourDay % 2 ? "odd" : "even") : "none",
      dateState,
    };
  });
}

export function tripNightCount(startDate: string, endDate: string, locale: string): string {
  const start = Date.parse(`${startDate}T00:00:00`);
  const end = Date.parse(`${endDate}T00:00:00`);
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) return locale === "th" ? "ยังไม่กำหนด" : "Not set";
  const days = Math.round((end - start) / 86_400_000);
  return locale === "th" ? `${days} คืน (${days + 1} วัน)` : `${days} nights (${days + 1} days)`;
}

function localDateValue(date: Date): string {
  return [
    String(date.getFullYear()).padStart(4, "0"),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}
