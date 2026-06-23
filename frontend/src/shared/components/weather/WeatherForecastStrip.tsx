import type { Locale } from "@/src/i18n/types";
import { cn } from "@/src/lib/cn";
import type { TripDailyBriefing } from "@/src/trip/types";
import { briefingsForStrip, formatSolarTime, formatWeatherTemp, thaiWeekdayTone, weatherGraphicLabel, weatherIconForCondition } from "@/src/trip/weather";
import { Icon } from "@/src/ui/icons";
import {
  formatWeatherStripDayLabel,
  weatherStripCopy,
} from "./model/weather-forecast-strip-model";
import {
  dayClassName,
  emptyClassName,
  iconClassName,
  pendingClassName,
  rowClassName,
  segmentClassName,
  selectedClassName,
  solarClassName,
  stripClassName,
  tempClassName,
  tempHighClassName,
  tempLowClassName,
} from "./weather-forecast-strip.styles";

interface WeatherForecastStripProps {
  briefings: TripDailyBriefing[];
  locale: Locale;
  selectedDate: string | null;
  onSelect: (date: string) => void;
}

export function WeatherForecastStrip({ briefings, locale, selectedDate, onSelect }: WeatherForecastStripProps) {
  const copy = weatherStripCopy(locale);
  const sorted = briefingsForStrip(briefings);
  if (!sorted.length) {
    return <section className={stripClassName} aria-label={copy.regionLabel}>
      <div className={`${rowClassName} ${emptyClassName}`}>{copy.empty}</div>
    </section>;
  }

  return (
    <section className={stripClassName} aria-label={copy.regionLabel}>
      <div className={rowClassName}>
        {sorted.map((briefing) => {
          const tone = thaiWeekdayTone(briefing.date);
          const weather = briefing.weather;
          const high = weather?.temperatureMaxCelsius;
          const low = weather?.temperatureMinCelsius;
          const dayLabel = formatWeatherStripDayLabel(briefing.date, locale);
          const condition = weatherGraphicLabel(weather?.conditionCode);
          const hasForecastTemps = typeof high === "number" && typeof low === "number";
          const temperatureLabel = hasForecastTemps ? `${formatWeatherTemp(high)} ${formatWeatherTemp(low)}` : "";
          const sunrise = formatSolarTime(weather?.sunrise);
          const sunset = formatSolarTime(weather?.sunset);
          const solarLabel = sunrise && sunset ? `${copy.sunrise} ${sunrise} ${copy.sunset} ${sunset}` : "";

          return (
            <button
              aria-label={[dayLabel, condition, temperatureLabel, solarLabel].filter(Boolean).join(" ")}
              className={cn(segmentClassName, selectedDate === briefing.date && selectedClassName)}
              key={`${briefing.date}-${briefing.locationKey}`}
              type="button"
              onClick={() => onSelect(briefing.date)}
            >
              <span className={cn(dayClassName, tone.className, tone.chipClassName)}>{dayLabel}</span>
              <span className={iconClassName} aria-hidden="true">
                <Icon name={weatherIconForCondition(weather?.conditionCode)} />
              </span>
              {hasForecastTemps ? (
                <span className={tempClassName}>
                  <span className={tempHighClassName}>{formatWeatherTemp(high)}</span>
                  <span className={tempLowClassName}>{formatWeatherTemp(low)}</span>
                </span>
              ) : <span className={pendingClassName}>{condition}</span>}
              {sunrise && sunset ? <span className={solarClassName}>{sunrise} / {sunset}</span> : null}
            </button>
          );
        })}
      </div>
    </section>
  );
}
