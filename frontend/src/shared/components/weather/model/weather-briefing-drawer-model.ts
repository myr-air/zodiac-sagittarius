import type { Locale } from "@/src/i18n/types";
import type { TripDailyBriefing } from "@/src/trip/types";

export function formatFullDate(date: string, locale: Locale): string {
  const parsed = new Date(`${date}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return date;
  return new Intl.DateTimeFormat(locale === "th" ? "th-TH" : "en-US", {
    dateStyle: "full",
  }).format(parsed);
}

export function formatWeatherSummary(
  conditionLabel: string | null | undefined,
  high: number | null | undefined,
  low: number | null | undefined,
  locale: Locale,
): string {
  const condition = conditionLabel ?? emptyText(locale);
  if (typeof high !== "number" && typeof low !== "number") return condition;
  return `${condition} · ${formatTemp(high)} ${formatTemp(low)}`;
}

export function formatPercent(value: number | null | undefined): string {
  if (typeof value !== "number") return "--";
  return `${value}%`;
}

export function formatSpeed(value: number | null | undefined): string {
  if (typeof value !== "number") return "--";
  return `${Math.round(value)} km/h`;
}

export function buildWeatherDetailLines(
  weather: NonNullable<TripDailyBriefing["weather"]>,
  locale: Locale,
): string[] {
  const copy = weatherDrawerCopy(locale);
  return [
    joinWeatherParts([
      formatTempPair(
        copy.feelsLike,
        weather.apparentTemperatureMaxCelsius,
        weather.apparentTemperatureMinCelsius,
      ),
      formatValue(copy.uv, weather.uvIndexMax, ""),
    ]),
    joinWeatherParts([
      formatValue(copy.rainAmount, weather.precipitationSumMm, "mm"),
      formatValue(copy.rainHours, weather.precipitationHours, "h"),
      formatValue(copy.windGust, weather.windGustsKph, "km/h", Math.round),
    ]),
    joinWeatherParts([
      formatValue(copy.visibilityMin, metersToKilometers(weather.visibilityMinMeters), "km"),
      formatPercentValue(copy.cloudCover, weather.cloudCoverMeanPercent),
    ]),
  ].filter((line): line is string => Boolean(line));
}

export function emptyText(locale: Locale): string {
  return locale === "th" ? "ยังไม่มีข้อมูล" : "No data yet";
}

export function weatherDrawerCopy(locale: Locale) {
  return locale === "th"
    ? {
        regionLabel: "รายละเอียดพยากรณ์อากาศ",
        close: "ปิด",
        weather: "สภาพอากาศ",
        feelsLike: "รู้สึกเหมือน",
        humidity: "ความชื้น",
        wind: "ลม",
        windGust: "ลมกระโชก",
        rain: "ฝน",
        rainAmount: "ปริมาณฝน",
        rainHours: "ช่วงฝน",
        uv: "UV",
        visibilityMin: "ทัศนวิสัยต่ำสุด",
        cloudCover: "เมฆ",
        sunrise: "พระอาทิตย์ขึ้น",
        sunset: "พระอาทิตย์ตก",
        outfitAdvice: "คำแนะนำการแต่งตัว",
        holiday: "วันหยุด",
        festival: "เทศกาล",
        dailyFacts: "เกร็ดประจำวัน",
        organizerNotes: "โน้ตผู้จัดทริป",
        outfitOverride: "ปรับคำแนะนำการแต่งตัว",
        festivalOverride: "ปรับโน้ตเทศกาล",
        factsOverride: "ปรับเกร็ดประจำวัน",
        save: "บันทึก",
        noSource: "ไม่มีแหล่งข้อมูล",
        fetched: "ดึงข้อมูล",
        expires: "หมดอายุ",
      }
    : {
        regionLabel: "Weather briefing",
        close: "Close",
        weather: "Weather",
        feelsLike: "Feels like",
        humidity: "Humidity",
        wind: "Wind",
        windGust: "Wind gust",
        rain: "Rain",
        rainAmount: "Rain amount",
        rainHours: "Rain hours",
        uv: "UV",
        visibilityMin: "Min visibility",
        cloudCover: "Cloud cover",
        sunrise: "Sunrise",
        sunset: "Sunset",
        outfitAdvice: "Outfit advice",
        holiday: "Holiday",
        festival: "Festival",
        dailyFacts: "Daily facts",
        organizerNotes: "Organizer notes",
        outfitOverride: "Outfit advice override",
        festivalOverride: "Festival note override",
        factsOverride: "Facts note override",
        save: "Save",
        noSource: "No source",
        fetched: "fetched",
        expires: "expires",
      };
}

function formatTemp(value: number | null | undefined): string {
  if (typeof value !== "number") return "--°";
  return `${Math.round(value)}°`;
}

function joinWeatherParts(parts: Array<string | null>): string | null {
  const visible = parts.filter(Boolean);
  return visible.length ? visible.join(" · ") : null;
}

function formatTempPair(
  label: string,
  high: number | null | undefined,
  low: number | null | undefined,
): string | null {
  if (typeof high !== "number" && typeof low !== "number") return null;
  return `${label} ${[formatTemp(high), formatTemp(low)].filter((value) => value !== "--°").join(" ")}`;
}

function formatValue(
  label: string,
  value: number | null | undefined,
  unit: string,
  transform: (value: number) => number | string = (input) =>
    Number.isInteger(input) ? input : input.toFixed(1),
): string | null {
  if (typeof value !== "number") return null;
  return `${label} ${transform(value)}${unit ? ` ${unit}` : ""}`;
}

function formatPercentValue(
  label: string,
  value: number | null | undefined,
): string | null {
  if (typeof value !== "number") return null;
  return `${label} ${value}%`;
}

function metersToKilometers(value: number | null | undefined): number | null {
  return typeof value === "number" ? value / 1000 : null;
}
