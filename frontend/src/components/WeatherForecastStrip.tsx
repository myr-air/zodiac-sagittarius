import type { Locale } from "@/src/i18n/types";
import { cn } from "@/src/lib/cn";
import type { TripDailyBriefing } from "@/src/trip/types";
import { briefingsForStrip, formatWeatherTemp, thaiWeekdayTone, weatherGraphicLabel, weatherIconForCondition } from "@/src/trip/weather-briefings";

interface WeatherForecastStripProps {
  briefings: TripDailyBriefing[];
  locale: Locale;
  selectedDate: string | null;
  onSelect: (date: string) => void;
}

const stripClassName =
  "weather-forecast-strip relative z-[1] mx-auto -mt-[22px] mb-3 w-[94%] overflow-hidden rounded-b-(--radius-lg) border border-t-0 border-white/60 bg-[linear-gradient(180deg,rgb(255_255_255_/_0.46),rgb(255_255_255_/_0.30)),linear-gradient(135deg,rgb(224_242_254_/_0.72),rgb(254_243_199_/_0.54))] px-4 pb-3 pt-9 shadow-[0_18px_42px_rgb(14_116_144_/_0.12)] backdrop-blur-xl max-[767px]:-mt-3 max-[767px]:w-[96%] max-[767px]:px-3 max-[767px]:pt-6";
const rowClassName =
  "weather-forecast-row flex min-w-0 gap-6 overflow-x-auto whitespace-nowrap pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden";
const segmentClassName =
  "weather-forecast-segment grid min-w-[72px] cursor-pointer gap-2 border-0 bg-transparent p-0 text-center font-inherit text-(--color-text) transition-[opacity,transform,filter] duration-200 hover:-translate-y-0.5 hover:opacity-95 focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-[rgb(14_165_233_/_0.28)]";
const selectedClassName = "weather-forecast-segment--selected drop-shadow-[0_10px_18px_rgb(14_116_144_/_0.20)]";
const dayClassName = "text-[12px] font-black leading-4 inline-flex min-h-6 items-center justify-center rounded-full px-2 border border-white/80 shadow-[0_4px_10px_rgb(15_23_42_/_0.06)]";
const iconClassName = "weather-forecast-icon text-[30px] leading-none drop-shadow-[0_8px_14px_rgb(15_23_42_/_0.16)]";
const tempClassName = "weather-forecast-temp inline-flex items-baseline justify-center gap-1.5 leading-none";
const tempHighClassName = "weather-forecast-temp-high text-[16px] font-black text-(--color-text)";
const tempLowClassName = "weather-forecast-temp-low text-[16px] font-bold text-(--color-text-muted)";
const emptyClassName = "rounded-(--radius-md) border border-(--color-border) bg-white/60 px-4 py-3 text-xs font-black text-(--color-text-muted)";

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
          const dayLabel = formatDayLabel(briefing.date, locale);
          const condition = weatherGraphicLabel(weather?.conditionCode);

          return (
              <button
                aria-label={`${dayLabel} ${condition} ${formatWeatherTemp(high)} ${formatWeatherTemp(low)}`}
                className={cn(segmentClassName, selectedDate === briefing.date && selectedClassName)}
                key={`${briefing.date}-${briefing.locationKey}`}
                type="button"
                onClick={() => onSelect(briefing.date)}
              >
              <span className={cn(dayClassName, tone.className, tone.chipClassName)}>{dayLabel}</span>
              <span className={iconClassName} aria-hidden="true">
                {weatherIconForCondition(weather?.conditionCode)}
              </span>
              <span className={tempClassName}>
                <span className={tempHighClassName}>{formatWeatherTemp(high)}</span>
                <span className={tempLowClassName}>{formatWeatherTemp(low)}</span>
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

function formatDayLabel(date: string, locale: Locale): string {
  const parsed = new Date(`${date}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return date;
  return new Intl.DateTimeFormat(locale === "th" ? "th-TH" : "en-US", { weekday: "short", month: "short", day: "numeric" }).format(parsed);
}

function weatherStripCopy(locale: Locale) {
  return locale === "th"
    ? { regionLabel: "พยากรณ์อากาศรายวัน", empty: "ยังไม่มีข้อมูลพยากรณ์อากาศ" }
    : { regionLabel: "Daily weather forecast", empty: "No weather data yet" };
}
