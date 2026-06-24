import type { Locale } from "@/src/i18n/types";
import {
  displayDateTimeLocaleCode,
  formatDateOnlyDisplay,
} from "@/src/shared/date-time-display";

export function formatWeatherStripDayLabel(date: string, locale: Locale): string {
  return formatDateOnlyDisplay({
    locale: displayDateTimeLocaleCode(locale),
    options: { weekday: "short", month: "short", day: "numeric" },
    value: date,
  });
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
