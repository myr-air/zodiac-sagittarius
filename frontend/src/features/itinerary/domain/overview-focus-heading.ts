import type { Locale } from "@/src/i18n/types";

type OverviewCountdownType = "incoming" | "active" | "completed";

export function overviewFocusHeading({
  countdownType,
  focusTodayLabel,
  locale,
}: {
  countdownType: OverviewCountdownType;
  focusTodayLabel: string;
  locale: Locale;
}): string {
  if (countdownType === "completed") {
    return locale === "th" ? "ย้อนรอยความทรงจำ" : "Memories of the Journey";
  }

  if (countdownType === "incoming") {
    return locale === "th" ? "จุดสตาร์ทแรกของทริป" : "First Stop Preview";
  }

  return focusTodayLabel;
}
