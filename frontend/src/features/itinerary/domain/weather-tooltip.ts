import { visibleTextParts } from "@/src/shared/text-parts";
import {
  formatWeatherMetric,
  formatWeatherPercentMetric,
  formatWeatherTemperaturePair,
} from "@/src/shared/components/weather/model/weather-metric-formatters";
import type { TripDailyBriefing } from "@/src/trip/types";
import { formatWeatherSpeed } from "@/src/trip/weather";

export function formatFeelsLike(
  high: number | null | undefined,
  low: number | null | undefined,
): string | null {
  const temps = formatWeatherTemperaturePair(high, low);
  return temps ? `Feels ${temps}` : null;
}

export function formatRainDetail(
  chance: number | null | undefined,
  amount: number | null | undefined,
  hours: number | null | undefined,
): string | null {
  const parts = visibleTextParts([
    formatWeatherMetric(null, chance, "%", { unitSeparator: "" }),
    formatWeatherMetric(null, amount, "mm"),
    formatWeatherMetric(null, hours, "h", { unitSeparator: "" }),
  ]).join(" · ");
  return parts ? `Rain ${parts}` : null;
}

export function formatUvIndex(value: number | null | undefined): string | null {
  return formatWeatherMetric("UV", value);
}

export function formatWindDetail(
  speed: number | null | undefined,
  gusts: number | null | undefined,
): string | null {
  if (typeof speed !== "number" && typeof gusts !== "number") return null;
  const parts = visibleTextParts([
    typeof speed === "number" ? formatWeatherSpeed(speed) : null,
    typeof gusts === "number" ? `gust ${formatWeatherSpeed(gusts)}` : null,
  ]).join(" · ");
  return `Wind ${parts}`;
}

export function formatVisibilityDetail(
  value: number | null | undefined,
): string | null {
  return formatWeatherMetric(
    "Visibility min",
    typeof value === "number" ? value / 1000 : null,
    "km",
  );
}

export function formatPercentDetail(
  label: string,
  value: number | null | undefined,
): string | null {
  return formatWeatherPercentMetric(label, value);
}

export function buildWeatherTooltip(
  weather: TripDailyBriefing["weather"],
  summary: string,
  sunrise: string | null,
  sunset: string | null,
): string {
  if (!weather) return summary;
  const details = visibleTextParts([
    formatFeelsLike(
      weather.apparentTemperatureMaxCelsius,
      weather.apparentTemperatureMinCelsius,
    ),
    formatRainDetail(
      weather.rainChancePercent,
      weather.precipitationSumMm,
      weather.precipitationHours,
    ),
    formatUvIndex(weather.uvIndexMax),
    formatWindDetail(weather.windSpeedKph, weather.windGustsKph),
    formatVisibilityDetail(weather.visibilityMinMeters),
    formatPercentDetail("Humidity", weather.humidityPercent),
    sunrise && sunset ? `Sun ${sunrise}/${sunset}` : null,
  ]);
  return visibleTextParts([summary, ...details]).join("\n");
}
