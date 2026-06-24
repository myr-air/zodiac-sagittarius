import { visibleTextParts } from "@/src/shared/text-parts";
import type { TripDailyBriefing } from "@/src/trip/types";
import {
  formatSolarTime,
  formatWeatherTemp,
  weatherGraphicLabel,
} from "@/src/trip/weather";
import { buildWeatherTooltip } from "./weather-tooltip";

export {
  buildWeatherTooltip,
  formatFeelsLike,
  formatPercentDetail,
  formatRainDetail,
  formatUvIndex,
  formatVisibilityDetail,
  formatWindDetail,
} from "./weather-tooltip";
export {
  buildWeatherChipDisplay,
  type WeatherChipDisplay,
} from "./weather-chip-display";

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

  return visibleTextParts([weatherLabel]);
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
