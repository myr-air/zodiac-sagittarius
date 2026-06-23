import type { Locale } from "@/src/i18n/types";
import { displayDateTimeLocaleCode } from "@/src/shared/date-time-display";
import type { TripDailyBriefing } from "@/src/trip/types";
import { emptyText, weatherDrawerCopy } from "./weather-briefing-drawer-copy";

export { emptyText, weatherDrawerCopy } from "./weather-briefing-drawer-copy";

export function formatFullDate(date: string, locale: Locale): string {
  const parsed = new Date(`${date}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return date;
  return new Intl.DateTimeFormat(displayDateTimeLocaleCode(locale), {
    dateStyle: "full",
  }).format(parsed);
}

export function formatWeatherSummary(
  conditionLabel: string | null | undefined,
  high: number | null | undefined,
  low: number | null | undefined,
  locale: Locale,
): string {
  const condition = conditionLabel ?? emptyText(locale);
  if (typeof high !== "number" && typeof low !== "number") return condition;
  return `${condition} · ${formatTemp(high)} ${formatTemp(low)}`;
}

export function formatPercent(value: number | null | undefined): string {
  if (typeof value !== "number") return "--";
  return `${value}%`;
}

export function formatSpeed(value: number | null | undefined): string {
  if (typeof value !== "number") return "--";
  return `${Math.round(value)} km/h`;
}

export function buildWeatherDetailLines(
  weather: NonNullable<TripDailyBriefing["weather"]>,
  locale: Locale,
): string[] {
  const copy = weatherDrawerCopy(locale);
  return [
    joinWeatherParts([
      formatTempPair(
        copy.feelsLike,
        weather.apparentTemperatureMaxCelsius,
        weather.apparentTemperatureMinCelsius,
      ),
      formatValue(copy.uv, weather.uvIndexMax, ""),
    ]),
    joinWeatherParts([
      formatValue(copy.rainAmount, weather.precipitationSumMm, "mm"),
      formatValue(copy.rainHours, weather.precipitationHours, "h"),
      formatValue(copy.windGust, weather.windGustsKph, "km/h", Math.round),
    ]),
    joinWeatherParts([
      formatValue(copy.visibilityMin, metersToKilometers(weather.visibilityMinMeters), "km"),
      formatPercentValue(copy.cloudCover, weather.cloudCoverMeanPercent),
    ]),
  ].filter((line): line is string => Boolean(line));
}

function formatTemp(value: number | null | undefined): string {
  if (typeof value !== "number") return "--°";
  return `${Math.round(value)}°`;
}

function joinWeatherParts(parts: Array<string | null>): string | null {
  const visible = parts.filter(Boolean);
  return visible.length ? visible.join(" · ") : null;
}

function formatTempPair(
  label: string,
  high: number | null | undefined,
  low: number | null | undefined,
): string | null {
  if (typeof high !== "number" && typeof low !== "number") return null;
  return `${label} ${[formatTemp(high), formatTemp(low)].filter((value) => value !== "--°").join(" ")}`;
}

function formatValue(
  label: string,
  value: number | null | undefined,
  unit: string,
  transform: (value: number) => number | string = (input) =>
    Number.isInteger(input) ? input : input.toFixed(1),
): string | null {
  if (typeof value !== "number") return null;
  return `${label} ${transform(value)}${unit ? ` ${unit}` : ""}`;
}

function formatPercentValue(
  label: string,
  value: number | null | undefined,
): string | null {
  if (typeof value !== "number") return null;
  return `${label} ${value}%`;
}

function metersToKilometers(value: number | null | undefined): number | null {
  return typeof value === "number" ? value / 1000 : null;
}
