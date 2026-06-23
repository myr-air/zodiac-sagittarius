import type { Locale } from "@/src/i18n/types";
import { cn } from "@/src/lib/cn";
import type { TripDailyBriefing } from "@/src/trip/types";
import { briefingsForStrip, formatSolarTime, formatWeatherTemp, thaiWeekdayTone, weatherGraphicLabel, weatherIconForCondition } from "@/src/trip/weather";
import { Icon } from "@/src/ui/icons";
import {
  formatWeatherStripDayLabel,
  weatherStripCopy,
} from "./model/weather-forecast-strip-model";

interface WeatherForecastStripProps {
  briefings: TripDailyBriefing[];
  locale: Locale;
  selectedDate: string | null;
  onSelect: (date: string) => void;
}

const stripClassName =
  "weather-forecast-strip relative z-[1] mx-auto -mt-[18px] mb-3 w-[94%] overflow-hidden rounded-b-(--radius-lg) border border-t-0 border-(--color-border) bg-(--color-surface) px-4 pb-3 pt-8 shadow-[0_10px_22px_rgb(55_47_38_/_0.045)] max-[767px]:-mt-2 max-[767px]:w-[96%] max-[767px]:px-3 max-[767px]:pt-5";
const rowClassName =
  "weather-forecast-row flex min-w-0 gap-6 overflow-x-auto whitespace-nowrap pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden max-[767px]:gap-3 max-[767px]:snap-x max-[767px]:snap-mandatory";
const segmentClassName =
  "weather-forecast-segment grid min-w-[72px] cursor-pointer gap-2 border-0 bg-transparent p-0 text-center font-inherit text-(--color-text) transition-[opacity,transform,filter] duration-200 hover:-translate-y-0.5 hover:opacity-95 focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-[rgb(191_219_254_/_0.72)] max-[767px]:w-[106px] max-[767px]:shrink-0 max-[767px]:snap-center";
const selectedClassName = "weather-forecast-segment--selected drop-shadow-[0_10px_18px_rgb(194_79_22_/_0.18)]";
const dayClassName = "text-[12px] font-black leading-4 inline-flex min-h-6 items-center justify-center rounded-full border border-(--color-border) bg-(--color-surface-subtle) px-2";
const iconClassName = "weather-forecast-icon text-[30px] leading-none";
const tempClassName = "weather-forecast-temp inline-flex items-baseline justify-center gap-1.5 leading-none";
const tempHighClassName = "weather-forecast-temp-high text-[16px] font-black text-(--color-text)";
const tempLowClassName = "weather-forecast-temp-low text-[16px] font-bold text-(--color-text-muted)";
const solarClassName = "weather-forecast-solar inline-flex items-center justify-center gap-1 text-[11px] font-extrabold leading-4 text-(--color-text-muted)";
const pendingClassName = "weather-forecast-pending text-[12px] font-black leading-4 text-(--color-text-muted)";
const emptyClassName = "weather-forecast-empty-state rounded-(--radius-md) border border-(--color-border) bg-(--color-surface-subtle) px-4 py-3 text-xs font-black text-(--color-text-muted)";

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
