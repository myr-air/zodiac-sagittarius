import type { Locale } from "@/src/i18n/types";
import type { ItineraryItem } from "@/src/trip/types";

export interface ItineraryNoteModalCopy {
  cancel: string;
  close: string;
  label: string;
  placeholder: string;
  save: string;
  subtitle: string;
  title: string;
}

const itineraryNoteModalCopyByLocale: Record<
  Locale,
  Omit<ItineraryNoteModalCopy, "title"> & {
    title: (activity: string) => string;
  }
> = {
  en: {
    cancel: "Cancel",
    close: "Close note modal",
    label: "Note",
    placeholder: "Example: Meet at exit A, keep passports ready",
    save: "Save note",
    subtitle: "Capture a short note tied to this activity.",
    title: (activity) => `Note for ${activity}`,
  },
  th: {
    cancel: "ยกเลิก",
    close: "ปิด modal โน้ต",
    label: "โน้ต",
    placeholder: "เช่น นัดเจอกันที่ทางออก A, เตรียมพาสปอร์ต",
    save: "บันทึกโน้ต",
    subtitle: "เก็บรายละเอียดสั้น ๆ ที่เกี่ยวกับ activity นี้",
    title: (activity) => `โน้ตสำหรับ ${activity}`,
  },
};

export function itineraryNoteModalCopy(
  item: Pick<ItineraryItem, "activity">,
  locale: Locale,
): ItineraryNoteModalCopy {
  const copy = itineraryNoteModalCopyByLocale[locale];

  return {
    ...copy,
    title: copy.title(item.activity),
  };
}
