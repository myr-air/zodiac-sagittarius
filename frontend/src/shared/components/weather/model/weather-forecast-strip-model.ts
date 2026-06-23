import type { Locale } from "@/src/i18n/types";
import { displayDateTimeLocaleCode } from "@/src/shared/date-time-display";

export function formatWeatherStripDayLabel(date: string, locale: Locale): string {
  const parsed = new Date(`${date}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return date;
  return new Intl.DateTimeFormat(displayDateTimeLocaleCode(locale), {
    weekday: "short",
    month: "short",
    day: "numeric",
  }).format(parsed);
}

export function weatherStripCopy(locale: Locale) {
  return locale === "th"
    ? {
        regionLabel: "พยากรณ์อากาศรายวัน",
        empty: "ยังไม่มีข้อมูลพยากรณ์อากาศ",
        sunrise: "พระอาทิตย์ขึ้น",
        sunset: "ตก",
      }
    : {
        regionLabel: "Daily weather forecast",
        empty: "No weather data yet",
        sunrise: "Sunrise",
        sunset: "sunset",
      };
}
