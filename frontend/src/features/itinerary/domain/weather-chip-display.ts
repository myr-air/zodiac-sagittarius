import { joinVisibleTextParts } from "@/src/shared/text-parts";
import {
  buildWeatherDisplayFacts,
  formatWeatherConditionTemperatureLabel,
} from "@/src/shared/components/weather/model/weather-display-facts";
import type { TripDailyBriefing } from "@/src/trip/types";
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
  const {
    condition,
    hasCondition,
    hasForecastTemps,
    hasSolarTimes,
    highLabel,
    lowLabel,
    sunrise,
    sunset,
  } = buildWeatherDisplayFacts(weather);
  if (!hasForecastTemps && !hasSolarTimes) return null;

  const solarLabel = sunrise && sunset ? `sunrise ${sunrise} sunset ${sunset}` : "";
  const weatherLabel = joinVisibleTextParts([
    formatWeatherConditionTemperatureLabel({
      condition,
      hasCondition,
      hasForecastTemps,
      highLabel,
      lowLabel,
    }),
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
