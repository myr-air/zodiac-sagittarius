import type { Locale } from "@/src/i18n/types";

export interface StopDialogCopy {
  editSubActivityTitle: string;
  moreDetailsLabel: string;
  timeWindow: {
    groupLabel: string;
    nextDayLabel: string;
    notSetLabel: string;
    toggleNextDayLabel: (input: { activity: string }) => string;
  };
}

const stopDialogCopyByLocale: Record<Locale, StopDialogCopy> = {
  en: {
    editSubActivityTitle: "Edit sub-activity",
    moreDetailsLabel: "More details",
    timeWindow: {
      groupLabel: "Time window",
      nextDayLabel: "Next day",
      notSetLabel: "Not set",
      toggleNextDayLabel: ({ activity }) =>
        `Toggle next-day end ${activity || "activity"}`,
    },
  },
  th: {
    editSubActivityTitle: "แก้ไข sub-activity",
    moreDetailsLabel: "รายละเอียดเพิ่มเติม",
    timeWindow: {
      groupLabel: "ช่วงเวลา",
      nextDayLabel: "ข้ามวัน",
      notSetLabel: "ไม่ระบุ",
      toggleNextDayLabel: ({ activity }) =>
        `Toggle next-day end ${activity || "activity"}`,
    },
  },
};

export function stopDialogCopy(locale: Locale): StopDialogCopy {
  return stopDialogCopyByLocale[locale];
}
