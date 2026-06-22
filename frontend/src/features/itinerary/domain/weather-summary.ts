import type { TripDailyBriefing } from "@/src/trip/types";
import {
  formatSolarTime,
  formatWeatherTemp,
  weatherGraphicLabel,
} from "@/src/trip/weather";

function formatWeatherSummaryParts(
  weather: TripDailyBriefing["weather"],
): string[] {
  const condition = weatherGraphicLabel(weather?.conditionCode);
  const hasForecastTemps =
    typeof weather?.temperatureMaxCelsius === "number" &&
    typeof weather?.temperatureMinCelsius === "number";
  const hasCondition = Boolean(
    weather?.conditionCode && weather.conditionCode !== "unavailable",
  );

  const weatherLabel = hasForecastTemps
    ? `${condition} ${formatWeatherTemp(weather.temperatureMaxCelsius)} ${formatWeatherTemp(weather.temperatureMinCelsius)}`
    : hasCondition
      ? condition
      : "";

  return [weatherLabel].filter(Boolean);
}

export function formatFeelsLike(
  high: number | null | undefined,
  low: number | null | undefined,
): string | null {
  if (typeof high !== "number" && typeof low !== "number") return null;
  const temps = [
    typeof high === "number" ? formatWeatherTemp(high) : null,
    typeof low === "number" ? formatWeatherTemp(low) : null,
  ].filter(Boolean);
  return `Feels ${temps.join(" ")}`;
}

export function formatRainDetail(
  chance: number | null | undefined,
  amount: number | null | undefined,
  hours: number | null | undefined,
): string | null {
  const parts = [
    typeof chance === "number" ? `${chance}%` : null,
    typeof amount === "number" ? `${formatDecimal(amount)} mm` : null,
    typeof hours === "number" ? `${formatDecimal(hours)}h` : null,
  ].filter(Boolean);
  return parts.length ? `Rain ${parts.join(" · ")}` : null;
}

export function formatUvIndex(value: number | null | undefined): string | null {
  return typeof value === "number" ? `UV ${formatDecimal(value)}` : null;
}

export function formatWindDetail(
  speed: number | null | undefined,
  gusts: number | null | undefined,
): string | null {
  if (typeof speed !== "number" && typeof gusts !== "number") return null;
  const parts = [
    typeof speed === "number" ? `${Math.round(speed)} km/h` : null,
    typeof gusts === "number" ? `gust ${Math.round(gusts)} km/h` : null,
  ].filter(Boolean);
  return `Wind ${parts.join(" · ")}`;
}

export function formatVisibilityDetail(
  value: number | null | undefined,
): string | null {
  return typeof value === "number"
    ? `Visibility min ${formatDecimal(value / 1000)} km`
    : null;
}

export function formatPercentDetail(
  label: string,
  value: number | null | undefined,
): string | null {
  return typeof value === "number" ? `${label} ${value}%` : null;
}

export function formatDecimal(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

export function buildWeatherTooltip(
  weather: TripDailyBriefing["weather"],
  summary: string,
  sunrise: string | null,
  sunset: string | null,
): string {
  if (!weather) return summary;
  const details = [
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
  ].filter(Boolean);
  return [summary, ...details].filter(Boolean).join("\n");
}

export function buildWeatherSummary(
  briefing: TripDailyBriefing,
  dayLabel: string,
): { weatherLabel: string; tooltip: string } | null {
  const weather = briefing.weather;
  const hasForecastTemps =
    typeof weather?.temperatureMaxCelsius === "number" &&
    typeof weather?.temperatureMinCelsius === "number";
  const hasCondition = Boolean(
    weather?.conditionCode && weather.conditionCode !== "unavailable",
  );
  if (!weather || (!hasForecastTemps && !hasCondition)) return null;

  const sunrise = formatSolarTime(weather?.sunrise);
  const sunset = formatSolarTime(weather?.sunset);
  const weatherLabel = formatWeatherSummaryParts(weather).join(" ");
  const tooltipLabel = buildWeatherTooltip(
    weather,
    weatherLabel,
    sunrise,
    sunset,
  );

  return {
    weatherLabel,
    tooltip: `${dayLabel}: ${tooltipLabel}`,
  };
}
