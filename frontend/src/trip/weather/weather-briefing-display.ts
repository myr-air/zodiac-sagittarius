import { parseDateOnlyValue } from "@/src/shared/date-time-display";
import type { IconName } from "@/src/ui/icons";
import type { TripDailyBriefing } from "./weather-briefing-types";

export interface ThaiWeekdayTone {
  name: "sunday" | "monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday";
  className: string;
  chipClassName: string;
}

const weekdayTones: ThaiWeekdayTone[] = [
  { name: "sunday", className: "text-rose-800", chipClassName: "bg-rose-100/70 text-rose-800 border-rose-200" },
  { name: "monday", className: "text-amber-900", chipClassName: "bg-amber-100/70 text-amber-900 border-amber-200" },
  { name: "tuesday", className: "text-fuchsia-800", chipClassName: "bg-fuchsia-100/70 text-fuchsia-800 border-fuchsia-200" },
  { name: "wednesday", className: "text-emerald-800", chipClassName: "bg-emerald-100/70 text-emerald-800 border-emerald-200" },
  { name: "thursday", className: "text-orange-800", chipClassName: "bg-orange-100/70 text-orange-800 border-orange-200" },
  { name: "friday", className: "text-sky-800", chipClassName: "bg-sky-100/70 text-sky-800 border-sky-200" },
  { name: "saturday", className: "text-violet-800", chipClassName: "bg-indigo-100/70 text-violet-800 border-violet-200" },
];

export function briefingsForStrip(briefings: TripDailyBriefing[]): TripDailyBriefing[] {
  return briefings.slice().sort((a, b) => a.date.localeCompare(b.date));
}

export function thaiWeekdayTone(date: string): ThaiWeekdayTone {
  const parsed = parseDateOnlyValue(date);
  if (!parsed) return weekdayTones[0];
  return weekdayTones[parsed.getDay()] ?? weekdayTones[0];
}

export function weatherGraphicLabel(conditionCode: string | null | undefined): string {
  switch (conditionCode) {
    case "clear":
    case "sunny":
      return "Sunny";
    case "partly-cloudy":
    case "cloudy":
      return "Cloudy";
    case "rain":
    case "showers":
      return "Rain";
    case "storm":
    case "thunderstorm":
      return "Storm";
    case "unavailable":
      return "Forecast pending";
    default:
      return "Weather";
  }
}

export function weatherIconForCondition(code: string | null | undefined): IconName {
  if (code === "clear" || code === "sunny") return "sun";
  if (code === "rain" || code === "showers") return "umbrella";
  if (code === "storm" || code === "thunderstorm") return "warning";
  if (code === "cloudy" || code === "partly-cloudy") return "cloud";
  if (code === "unavailable" || !code) return "cloud";
  return "cloud";
}

export function formatWeatherTemp(value: number | null | undefined): string {
  if (typeof value !== "number") return "--°";
  return `${Math.round(value)}°`;
}

export function formatWeatherDecimal(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

export function formatWeatherSpeed(value: number | null | undefined): string {
  if (typeof value !== "number") return "--";
  return `${Math.round(value)} km/h`;
}

export function formatSolarTime(value: string | null | undefined): string | null {
  if (!value) return null;
  const localTime = value.match(/T(\d{2}:\d{2})/)?.[1];
  if (localTime) return localTime;
  const timeOnly = value.match(/^(\d{2}:\d{2})/)?.[1];
  return timeOnly ?? null;
}
