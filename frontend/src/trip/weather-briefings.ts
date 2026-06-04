import type { TripDailyBriefing } from "./types";

export interface ThaiWeekdayTone {
  name: "sunday" | "monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday";
  className: string;
}

const weekdayTones: ThaiWeekdayTone[] = [
  { name: "sunday", className: "text-red-600" },
  { name: "monday", className: "text-yellow-600" },
  { name: "tuesday", className: "text-pink-600" },
  { name: "wednesday", className: "text-green-600" },
  { name: "thursday", className: "text-orange-600" },
  { name: "friday", className: "text-sky-600" },
  { name: "saturday", className: "text-violet-600" },
];

export function briefingsForStrip(briefings: TripDailyBriefing[]): TripDailyBriefing[] {
  return briefings.slice().sort((a, b) => a.date.localeCompare(b.date));
}

export function thaiWeekdayTone(date: string): ThaiWeekdayTone {
  const parsed = new Date(`${date}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return weekdayTones[0];
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
