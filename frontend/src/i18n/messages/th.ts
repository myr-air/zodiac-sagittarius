import { thHomeLandingMessages } from "./th.home";
import { thAccessMessages } from "./th.access";
import { thJoinMessages } from "./th.join";
import { thItineraryMessages } from "./th.itinerary";
import { thOverviewMessages } from "./th.overview";
import { thExpensesMessages } from "./th.expenses";

import { thAboutAppMessages, thAppShellMessages, thRoutesMessages, thTripSettingsMessages, thDatesMessages } from "./th.workspace";

import { thMapMessages, thTimelineMessages, thMembersMessages, thContextRailMessages, thStopDialogMessages, thSuggestionsMessages } from "./th.workspace-pages";

export const thMessages = {
  common: {
    language: {
      label: "ภาษา",
      currencyLabel: "ภาษาและสกุลเงิน",
      english: "English",
      thai: "ไทย",
      switchToEnglish: "English",
      switchToThai: "ภาษาไทย",
    },
    currency: {
      label: "สกุลเงิน",
    },
    actions: {
      cancel: "ยกเลิก",
      close: "ปิด",
      save: "บันทึก",
      add: "เพิ่ม",
      edit: "แก้ไข",
      delete: "ลบ",
      confirm: "ยืนยัน",
      back: "ย้อนกลับ",
      loading: "กำลังโหลด",
    },
    status: {
      all: "ทั้งหมด",
      open: "ยังไม่ได้ทำ",
      done: "เรียบร้อย",
      disabled: "ปิดสิทธิ์",
      active: "เปิดสิทธิ์",
      pending: "รอเข้าร่วม",
      copied: "คัดลอกแล้ว",
      copyFailed: "คัดลอกไม่สำเร็จ",
    },
  },
  homeLanding: thHomeLandingMessages,
  aboutApp: thAboutAppMessages,
  appShell: thAppShellMessages,
  routes: thRoutesMessages,
  tripSettings: thTripSettingsMessages,
  dates: thDatesMessages,
  overview: thOverviewMessages,
  itinerary: thItineraryMessages,
  map: thMapMessages,
  timeline: thTimelineMessages,
  members: thMembersMessages,
  expenses: thExpensesMessages,
  contextRail: thContextRailMessages,
  stopDialog: thStopDialogMessages,
  suggestions: thSuggestionsMessages,
  access: thAccessMessages,
  join: thJoinMessages,
} as const;
