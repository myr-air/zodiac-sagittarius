import { joinVisibleTextParts } from "@/src/shared/text-parts";
import type { TripDailyBriefing } from "@/src/trip/types";
import {
  formatSolarTime,
  formatWeatherTemp,
  weatherGraphicLabel,
} from "@/src/trip/weather";
import { buildWeatherTooltip } from "./weather-tooltip";

export interface WeatherChipDisplay {
  condition: string;
  hasCondition: boolean;
  hasForecastTemps: boolean;
  hasSolarTimes: boolean;
  highLabel: string;
  lowLabel: string;
  sunrise: string | null;
  sunset: string | null;
  tooltip: string;
}

export function buildWeatherChipDisplay(
  briefing: TripDailyBriefing,
): WeatherChipDisplay | null {
  const weather = briefing.weather;
  const condition = weatherGraphicLabel(weather?.conditionCode);
  const high = weather?.temperatureMaxCelsius;
  const low = weather?.temperatureMinCelsius;
  const sunrise = formatSolarTime(weather?.sunrise);
  const sunset = formatSolarTime(weather?.sunset);
  const hasForecastTemps = typeof high === "number" && typeof low === "number";
  const hasSolarTimes = Boolean(sunrise && sunset);
  if (!hasForecastTemps && !hasSolarTimes) return null;

  const hasCondition = Boolean(weather?.conditionCode && weather.conditionCode !== "unavailable");
  const highLabel = formatWeatherTemp(high);
  const lowLabel = formatWeatherTemp(low);
  const solarLabel = sunrise && sunset ? `sunrise ${sunrise} sunset ${sunset}` : "";
  const weatherLabel = joinVisibleTextParts([
    hasForecastTemps
      ? `${condition} ${highLabel} ${lowLabel}`
      : hasCondition
        ? condition
        : "",
    solarLabel,
  ], " ") ?? "";

  return {
    condition,
    hasCondition,
    hasForecastTemps,
    hasSolarTimes,
    highLabel,
    lowLabel,
    sunrise,
    sunset,
    tooltip: buildWeatherTooltip(weather, weatherLabel, sunrise, sunset),
  };
}
