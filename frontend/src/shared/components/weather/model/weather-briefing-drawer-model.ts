import type { Locale } from "@/src/i18n/types";
import {
  displayDateTimeLocaleCode,
  formatDateOnlyDisplay,
} from "@/src/shared/date-time-display";
import {
  trimmedTextOrNull,
  visibleTextParts,
} from "@/src/shared/text-parts";
import type {
  DailyBriefingOverrides,
  TripDailyBriefing,
} from "@/src/trip/types";
import {
  formatWeatherSpeed,
  formatWeatherTemp,
} from "@/src/trip/weather";
import { emptyText, weatherDrawerCopy } from "./weather-briefing-drawer-copy";
import {
  formatLabeledWeatherTemperaturePair,
  formatWeatherMetric,
  formatWeatherPercentMetric,
  joinWeatherMetricParts,
  metersToWeatherKilometers,
} from "./weather-metric-formatters";

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
  return `${condition} · ${formatWeatherTemp(high)} ${formatWeatherTemp(low)}`;
}

export function formatPercent(value: number | null | undefined): string {
  if (typeof value !== "number") return "--";
  return `${value}%`;
}

export function formatSpeed(value: number | null | undefined): string {
  return formatWeatherSpeed(value);
}

export function buildWeatherDetailLines(
  weather: NonNullable<TripDailyBriefing["weather"]>,
  locale: Locale,
): string[] {
  const copy = weatherDrawerCopy(locale);
  return visibleTextParts([
    joinWeatherMetricParts([
      formatLabeledWeatherTemperaturePair(
        copy.feelsLike,
        weather.apparentTemperatureMaxCelsius,
        weather.apparentTemperatureMinCelsius,
      ),
      formatWeatherMetric(copy.uv, weather.uvIndexMax),
    ]),
    joinWeatherMetricParts([
      formatWeatherMetric(copy.rainAmount, weather.precipitationSumMm, "mm"),
      formatWeatherMetric(copy.rainHours, weather.precipitationHours, "h"),
      formatWeatherMetric(copy.windGust, weather.windGustsKph, "km/h", {
        transform: Math.round,
      }),
    ]),
    joinWeatherMetricParts([
      formatWeatherMetric(
        copy.visibilityMin,
        metersToWeatherKilometers(weather.visibilityMinMeters),
        "km",
      ),
      formatWeatherPercentMetric(copy.cloudCover, weather.cloudCoverMeanPercent),
    ]),
  ]);
}

export function buildDailyBriefingOverrides(input: {
  outfitAdvice: string;
  festivalNote: string;
  factsNote: string;
}): DailyBriefingOverrides {
  return {
    outfitAdvice: trimmedTextOrNull(input.outfitAdvice),
    festivalNote: trimmedTextOrNull(input.festivalNote),
    factsNote: trimmedTextOrNull(input.factsNote),
  };
}
