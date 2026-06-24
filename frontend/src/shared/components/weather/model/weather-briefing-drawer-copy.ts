import type { Locale } from "@/src/i18n/types";

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
