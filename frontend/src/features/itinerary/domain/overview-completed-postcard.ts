import type { Locale } from "@/src/i18n/types";

export interface CompletedPostcardLabels {
  title: string;
  message: string;
  durationLabel: string;
  durationValue: string;
  stopsLabel: string;
  stopsValue: string;
  budgetLabel: string;
}

export function buildCompletedPostcardLabels({
  dayCount,
  locale,
  stopCount,
  tripName,
}: {
  dayCount: number;
  locale: Locale;
  stopCount: number;
  tripName: string;
}): CompletedPostcardLabels {
  if (locale === "th") {
    return {
      budgetLabel: "ยอดใช้จ่ายรวม",
      durationLabel: "ระยะเวลา",
      durationValue: `${dayCount} วัน`,
      message: `ทริป ${tripName} ได้เสร็จสิ้นลงแล้วอย่างสมบูรณ์แบบ หวังว่าคุณจะได้รับความทรงจำและมิตรภาพที่ยอดเยี่ยมระหว่างเดินทาง!`,
      stopsLabel: "สถานที่เช็คอิน",
      stopsValue: `${stopCount} จุด`,
      title: "ขอบคุณสำหรับการเดินทาง!",
    };
  }

  return {
    budgetLabel: "Total Budget",
    durationLabel: "Duration",
    durationValue: `${dayCount} Days`,
    message: `The ${tripName} has completed. Hope this journey left you with beautiful memories and meaningful connections!`,
    stopsLabel: "Places Visited",
    stopsValue: `${stopCount} Stops`,
    title: "Thank you for traveling!",
  };
}
