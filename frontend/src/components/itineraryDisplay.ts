import type { ItineraryItem } from "@/src/trip/types";
import type { Locale } from "@/src/i18n/types";

export function activityTypeLabel(type: ItineraryItem["activityType"], locale: Locale = "en"): string {
  const labels: Record<Locale, Record<ItineraryItem["activityType"], string>> = {
    en: {
      travel: "Travel",
      food: "Food",
      shopping: "Shopping",
      attraction: "Attraction",
      experience: "Experience",
      stay: "Stay",
    },
    th: {
      travel: "เดินทาง",
      food: "อาหาร",
      shopping: "ช้อปปิ้ง",
      attraction: "สถานที่",
      experience: "กิจกรรม",
      stay: "ที่พัก",
    },
  };
  return labels[locale][type];
}

export function dayRouteLabel(day: string, locale: Locale = "en"): string {
  if (day === "2026-06-18") return "Bangkok -> Hong Kong";
  if (day === "2025-05-16") return "Hong Kong City Day";
  if (day === "2025-05-17") return "Hong Kong -> Shenzhen";
  return locale === "th" ? "วันในทริป" : "Trip day";
}

export function formatDuration(minutes: number | null, locale: Locale = "en"): string {
  void locale;
  if (!minutes) return "—";
  if (minutes < 60) return `${minutes} m`;
  if (minutes % 60 === 0) return `${minutes / 60} h`;
  return `${Math.floor(minutes / 60)} h ${minutes % 60} m`;
}

export function formatEndTime(startTime: string, minutes: number | null): string {
  if (!minutes || !startTime) return "—";
  const [hour = "0", minute = "0"] = startTime.split(":");
  const total = Number(hour) * 60 + Number(minute) + minutes;
  const endHour = Math.floor(total / 60) % 24;
  const endMinute = total % 60;
  return `${String(endHour).padStart(2, "0")}:${String(endMinute).padStart(2, "0")}`;
}

export function formatTimeWindow(item: Pick<ItineraryItem, "startTime" | "endTime" | "endOffsetDays">): string {
  const startTime = item.startTime?.trim();
  const endTime = item.endTime?.trim();
  if (!startTime && !endTime) return "—";
  if (!endTime) return startTime || "—";
  const offset = item.endOffsetDays && item.endOffsetDays > 0 ? `⁺${toSuperscriptNumber(item.endOffsetDays)}` : "";
  return startTime ? `${startTime}-${endTime}${offset}` : `${endTime}${offset}`;
}

function toSuperscriptNumber(value: number): string {
  const superscripts: Record<string, string> = {
    "0": "⁰",
    "1": "¹",
    "2": "²",
    "3": "³",
    "4": "⁴",
    "5": "⁵",
    "6": "⁶",
    "7": "⁷",
    "8": "⁸",
    "9": "⁹",
  };
  return String(value)
    .split("")
    .map((digit) => superscripts[digit] ?? digit)
    .join("");
}

export function formatThaiDate(value: string, locale: Locale = "en"): string {
  return new Intl.DateTimeFormat(locale === "th" ? "th-TH" : "en-US", {
    day: "numeric",
    month: "short",
  }).format(new Date(`${value}T00:00:00.000Z`));
}
