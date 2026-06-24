import type { TripDailyBriefing } from "@/src/trip/types";
import {
  formatSolarTime,
  formatWeatherTemp,
  weatherGraphicLabel,
} from "@/src/trip/weather";

type WeatherBlock = TripDailyBriefing["weather"];

export interface WeatherDisplayFacts {
  condition: string;
  hasCondition: boolean;
  hasForecastTemps: boolean;
  hasSolarTimes: boolean;
  highLabel: string;
  lowLabel: string;
  sunrise: string | null;
  sunset: string | null;
}

export function buildWeatherDisplayFacts(
  weather: WeatherBlock,
): WeatherDisplayFacts {
  const high = weather?.temperatureMaxCelsius;
  const low = weather?.temperatureMinCelsius;
  const sunrise = formatSolarTime(weather?.sunrise);
  const sunset = formatSolarTime(weather?.sunset);

  return {
    condition: weatherGraphicLabel(weather?.conditionCode),
    hasCondition: Boolean(
      weather?.conditionCode && weather.conditionCode !== "unavailable",
    ),
    hasForecastTemps: typeof high === "number" && typeof low === "number",
    hasSolarTimes: Boolean(sunrise && sunset),
    highLabel: formatWeatherTemp(high),
    lowLabel: formatWeatherTemp(low),
    sunrise,
    sunset,
  };
}

export function formatWeatherConditionTemperatureLabel({
  condition,
  hasCondition,
  hasForecastTemps,
  highLabel,
  lowLabel,
}: Pick<
  WeatherDisplayFacts,
  "condition" | "hasCondition" | "hasForecastTemps" | "highLabel" | "lowLabel"
>): string {
  if (hasForecastTemps) return `${condition} ${highLabel} ${lowLabel}`;
  return hasCondition ? condition : "";
}
