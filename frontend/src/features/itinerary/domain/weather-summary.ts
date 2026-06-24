import { visibleTextParts } from "@/src/shared/text-parts";
import {
  buildWeatherDisplayFacts,
  formatWeatherConditionTemperatureLabel,
} from "@/src/shared/components/weather/model/weather-display-facts";
import type { TripDailyBriefing } from "@/src/trip/types";
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
  return visibleTextParts([
    formatWeatherConditionTemperatureLabel(buildWeatherDisplayFacts(weather)),
  ]);
}

export function buildWeatherSummary(
  briefing: TripDailyBriefing,
  dayLabel: string,
): { weatherLabel: string; tooltip: string } | null {
  const weather = briefing.weather;
  const displayFacts = buildWeatherDisplayFacts(weather);
  const { hasCondition, hasForecastTemps, sunrise, sunset } = displayFacts;
  if (!weather || (!hasForecastTemps && !hasCondition)) return null;

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
