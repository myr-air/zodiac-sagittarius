import type { Locale } from "@/src/i18n/types";

export function formatTripRange(startDate: string, endDate: string, locale: Locale = "en"): string {
  const start = new Date(`${startDate}T00:00:00.000Z`);
  const end = new Date(`${endDate}T00:00:00.000Z`);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return `${startDate} – ${endDate}`;
  }

  if (locale === "th") {
    if (start.getFullYear() !== end.getFullYear()) {
      return `${start.getUTCDate()} ${formatThaiMonth(start)} ${start.getUTCFullYear()} – ${end.getUTCDate()} ${formatThaiMonth(end)} ${end.getUTCFullYear()}`;
    }
    if (start.getUTCMonth() !== end.getUTCMonth()) {
      return `${start.getUTCDate()} ${formatThaiMonth(start)} – ${end.getUTCDate()} ${formatThaiMonth(end)} ${end.getUTCFullYear()}`;
    }
    return `${start.getUTCDate()}–${end.getUTCDate()} ${formatThaiMonth(end)} ${end.getUTCFullYear()}`;
  }

  const monthDay = new Intl.DateTimeFormat("en-US", { day: "numeric", month: "short", timeZone: "UTC" });
  if (start.getUTCFullYear() !== end.getUTCFullYear()) {
    return `${monthDay.format(start)}, ${start.getUTCFullYear()} – ${monthDay.format(end)}, ${end.getUTCFullYear()}`;
  }
  if (start.getUTCMonth() !== end.getUTCMonth()) {
    return `${monthDay.format(start)} – ${monthDay.format(end)}, ${end.getUTCFullYear()}`;
  }
  return `${new Intl.DateTimeFormat("en-US", { month: "short", timeZone: "UTC" }).format(end)} ${start.getUTCDate()}–${end.getUTCDate()}, ${end.getUTCFullYear()}`;
}

function formatThaiMonth(date: Date): string {
  const months = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];
  return months[date.getUTCMonth()] ?? "";
}
