import type { ItineraryItem } from "@/src/trip/types";

export function activityTypeLabel(type: ItineraryItem["activityType"]): string {
  const labels: Record<ItineraryItem["activityType"], string> = {
    travel: "เดินทาง",
    food: "อาหาร",
    shopping: "ช้อปปิ้ง",
    attraction: "สถานที่",
    experience: "กิจกรรม",
    stay: "ที่พัก",
  };
  return labels[type];
}

export function dayRouteLabel(day: string): string {
  if (day === "2025-05-15") return "Bangkok -> Hong Kong";
  if (day === "2025-05-16") return "Hong Kong City Day";
  if (day === "2025-05-17") return "Hong Kong -> Shenzhen";
  return "Trip day";
}

export function formatDuration(minutes: number | null): string {
  if (!minutes) return "—";
  if (minutes < 60) return `${minutes} นาที`;
  if (minutes % 60 === 0) return `${minutes / 60} ชม.`;
  return `${Math.floor(minutes / 60)} ชม. ${minutes % 60} นาที`;
}

export function formatEndTime(startTime: string, minutes: number | null): string {
  if (!minutes || !startTime) return "—";
  const [hour = "0", minute = "0"] = startTime.split(":");
  const total = Number(hour) * 60 + Number(minute) + minutes;
  const endHour = Math.floor(total / 60) % 24;
  const endMinute = total % 60;
  return `${String(endHour).padStart(2, "0")}:${String(endMinute).padStart(2, "0")}`;
}

export function formatThaiDate(day: string): string {
  const date = new Date(`${day}T00:00:00`);
  const weekdays = ["อา.", "จ.", "อ.", "พ.", "พฤ.", "ศ.", "ส."];
  const months = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];
  return `${date.getDate()} ${months[date.getMonth()] ?? ""} (${weekdays[date.getDay()]})`;
}
