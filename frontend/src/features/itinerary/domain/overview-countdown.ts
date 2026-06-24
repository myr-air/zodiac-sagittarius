import type { Locale } from "@/src/i18n/types";

export function getCountdownBadge(
  startDateStr: string,
  endDateStr: string,
  locale: Locale,
): { text: string; type: "incoming" | "active" | "completed" } {
  const now = new Date();
  const start = new Date(`${startDateStr}T00:00:00.000Z`);
  const end = new Date(`${endDateStr}T00:00:00.000Z`);

  const today = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
  const todayMs = today.getTime();
  const startMs = start.getTime();
  const endMs = end.getTime();

  if (todayMs < startMs) {
    const diffDays = Math.ceil((startMs - todayMs) / (1000 * 60 * 60 * 24));
    return {
      text: locale === "th" ? `จะเริ่มในอีก ${diffDays} วัน` : `Starts in ${diffDays} days`,
      type: "incoming",
    };
  }

  if (todayMs >= startMs && todayMs <= endMs) {
    const diffDays = Math.floor((todayMs - startMs) / (1000 * 60 * 60 * 24)) + 1;
    const totalDays = Math.floor((endMs - startMs) / (1000 * 60 * 60 * 24)) + 1;
    return {
      text: locale === "th" ? `วันที่ ${diffDays} จาก ${totalDays}` : `Day ${diffDays} of ${totalDays}`,
      type: "active",
    };
  }

  return {
    text: locale === "th" ? "ทริปเสร็จสิ้นแล้ว" : "Trip Completed",
    type: "completed",
  };
}
