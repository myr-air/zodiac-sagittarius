import type { Locale } from "@/src/i18n/types";
import {
  displayDateTimeLocaleCode,
  formatDateOnlyDisplay,
} from "@/src/shared/date-time-display";
import {
  joinVisibleTextParts,
  visibleTextParts,
} from "@/src/shared/text-parts";
import type { TripDailyBriefing } from "@/src/trip/types";
import { emptyText, weatherDrawerCopy } from "./weather-briefing-drawer-copy";

export { emptyText, weatherDrawerCopy } from "./weather-briefing-drawer-copy";

export function formatFullDate(date: string, locale: Locale): string {
  return formatDateOnlyDisplay({
    locale: displayDateTimeLocaleCode(locale),
    options: { dateStyle: "full" },
    value: date,
  });
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
  return visibleTextParts([
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
  ]);
}

function formatTemp(value: number | null | undefined): string {
  if (typeof value !== "number") return "--°";
  return `${Math.round(value)}°`;
}

function joinWeatherParts(parts: Array<string | null>): string | null {
  return joinVisibleTextParts(parts, " · ");
}

function formatTempPair(
  label: string,
  high: number | null | undefined,
  low: number | null | undefined,
): string | null {
  if (typeof high !== "number" && typeof low !== "number") return null;
  return `${label} ${visibleTextParts([
    formatTemp(high) !== "--°" ? formatTemp(high) : null,
    formatTemp(low) !== "--°" ? formatTemp(low) : null,
  ]).join(" ")}`;
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
