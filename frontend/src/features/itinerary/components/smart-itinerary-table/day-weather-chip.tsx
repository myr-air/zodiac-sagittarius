import type { TripDailyBriefing } from "@/src/trip/types";
import { weatherIconForCondition } from "@/src/trip/weather";
import { Icon } from "@/src/ui/icons";
import { buildWeatherChipDisplay } from "@/src/features/itinerary/domain/weather-chip-display";
import {
  dayWeatherChipClassName,
  dayWeatherSolarClassName,
} from "./smart-itinerary-table.styles";

export function DayWeatherChip({
  briefing,
  dayLabel,
}: {
  briefing: TripDailyBriefing | null;
  dayLabel: string;
}) {
  if (!briefing) return null;
  const weather = briefing.weather;
  const display = buildWeatherChipDisplay(briefing);
  if (!display) return null;

  return (
    <span
      className={dayWeatherChipClassName}
      aria-label={`Weather for ${dayLabel}: ${display.tooltip.replace(/\n/g, ", ")}`}
      title={display.tooltip}
    >
      <span aria-hidden="true">
        <Icon name={weatherIconForCondition(weather?.conditionCode)} />
      </span>{" "}
      {display.hasForecastTemps ? (
        <>
          <strong>{display.highLabel}</strong>{" "}
          <span>{display.lowLabel}</span>
        </>
      ) : display.hasCondition ? <span>{display.condition}</span> : null}
      {display.hasSolarTimes ? (
        <>
          <span className={dayWeatherSolarClassName}>
            <Icon name="sunrise" />
            {display.sunrise}
          </span>
          <span className={dayWeatherSolarClassName}>
            <Icon name="sunset" />
            {display.sunset}
          </span>
        </>
      ) : null}
    </span>
  );
}
