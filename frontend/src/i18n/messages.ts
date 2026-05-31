import type { Locale } from "./types";

export const messages = {
  en: {
    common: {
      language: {
        label: "Language",
        english: "English",
        thai: "Thai",
        switchToEnglish: "English",
        switchToThai: "ภาษาไทย",
      },
      actions: {
        cancel: "Cancel",
        close: "Close",
        save: "Save",
        add: "Add",
        edit: "Edit",
        delete: "Delete",
        confirm: "Confirm",
        back: "Back",
        loading: "Loading",
      },
      status: {
        all: "All",
        open: "Open",
        done: "Done",
        disabled: "Disabled",
        active: "Active",
        pending: "Pending",
        copied: "Copied",
        copyFailed: "Copy failed",
      },
    },
    appShell: {
      navLabel: "Sagittarius planning navigation",
      nav: {
        overview: "Overview",
        itinerary: "Itinerary",
        map: "Map",
        timeline: "Timeline",
        members: "Members",
        expenses: "Expenses",
      },
      expandNavigation: "Expand navigation",
      collapseNavigation: "Collapse navigation",
      planSummary: "Plan summary",
      tripDuration: ({ days, nights }: { days: number; nights: number }) => `${days} days ${nights} nights`,
      placeCount: ({ count }: { count: number }) => `${count} places`,
      viewDetails: "View details",
      switchIdentity: "Switch identity",
      confirmSwitchIdentity: ({ name }: { name: string }) =>
        `Switch identity from ${name}? You will need to verify again to return.`,
      roles: {
        owner: "Owner",
        organizer: "Organizer",
        traveler: "Traveler",
        viewer: "Viewer",
      },
    },
    routes: {
      overview: "Overview",
      itinerary: "Itinerary",
      map: "Map",
      timeline: "Timeline",
      members: "Members",
    },
    access: {
      mainLabels: {
        combined: "Account access",
        accountLogin: "Account login",
        accountRegister: "Account register",
        tripAccess: "Trip access",
      },
      eyebrow: "Sagittarius access",
      titles: {
        combined: "Manage trips with an account or temporary access",
        accountLogin: "Sign in to your account",
        accountRegister: "Create an account",
        tripAccess: "Enter a trip with temporary access",
      },
      details: {
        combined:
          "Accounts keep trip history, stats, and owner rights. Temporary access still opens an existing trip immediately.",
        accountLogin: "Use an email code or passkey to return to the account connected to your trips.",
        accountRegister: "Create an account with an email code to keep trip history, stats, and owner rights.",
        tripAccess: "Enter the Trip ID and password to open an existing trip without an account.",
      },
      tabs: {
        account: "Account",
        temp: "Temp access",
        label: "Access mode",
      },
      messages: {
        accountLoadFailed: "Could not load account data.",
        loggedOut: "Signed out of account.",
        trustedLogin: "Signed in as a trusted device.",
        temporaryLogin: "Signed in temporarily.",
      },
    },
    join: {
      pageLabel: "Join trip",
      eyebrow: "Sagittarius trip access",
      roomTitle: "Enter trip room",
      participantTitle: "Choose identity",
      roomDetail: "Enter this plan's Trip ID and password before choosing a member.",
      participantDetail: "Choose your name, then set or confirm your personal password for this trip.",
      tripId: "Trip ID",
      tripPassword: "Trip password",
      showTripPassword: "Show trip password",
      hideTripPassword: "Hide trip password",
      submitRoom: "Enter trip",
      backToRoom: "Change trip",
      participantListLabel: "Trip member list",
      participantPassword: ({ name }: { name: string }) => `${name}'s password`,
      setParticipantPassword: ({ name }: { name: string }) => `Set password for ${name}`,
      showParticipantPassword: "Show participant password",
      hideParticipantPassword: "Hide participant password",
      start: "Start",
      errors: {
        tripCredentials: "Trip ID or password is incorrect.",
        participantPassword: "Password is incorrect.",
        shortPassword: "Set a password with at least 4 characters.",
      },
      memberStatus: {
        ready: "Ready",
        claimed: "Verified",
        disabled: "Disabled",
      },
    },
  },
  th: {
    common: {
      language: {
        label: "ภาษา",
        english: "English",
        thai: "ไทย",
        switchToEnglish: "English",
        switchToThai: "ภาษาไทย",
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
    appShell: {
      navLabel: "เมนูวางแผน Sagittarius",
      nav: {
        overview: "ภาพรวม",
        itinerary: "แผนการเดินทาง",
        map: "แผนที่",
        timeline: "ไทม์ไลน์",
        members: "สมาชิก",
        expenses: "ค่าใช้จ่าย",
      },
      expandNavigation: "ขยายเมนู",
      collapseNavigation: "ย่อเมนู",
      planSummary: "สรุปแผน",
      tripDuration: ({ days, nights }: { days: number; nights: number }) => `${days} วัน ${nights} คืน`,
      placeCount: ({ count }: { count: number }) => `${count} สถานที่`,
      viewDetails: "ดูสรุปรายละเอียด",
      switchIdentity: "เปลี่ยนตัวตน",
      confirmSwitchIdentity: ({ name }: { name: string }) =>
        `เปลี่ยนตัวตนจาก ${name}? คุณจะต้องยืนยันตัวตนใหม่เพื่อกลับเข้ามา`,
      roles: {
        owner: "เจ้าของแผน",
        organizer: "ผู้จัดทริป",
        traveler: "ผู้ร่วมเดินทาง",
        viewer: "ผู้ชม",
      },
    },
    routes: {
      overview: "ภาพรวม",
      itinerary: "แผนการเดินทาง",
      map: "แผนที่",
      timeline: "ไทม์ไลน์",
      members: "สมาชิก",
    },
    access: {
      mainLabels: {
        combined: "Account access",
        accountLogin: "Account login",
        accountRegister: "Account register",
        tripAccess: "Trip access",
      },
      eyebrow: "Sagittarius access",
      titles: {
        combined: "จัดการ trip ด้วย account หรือเข้าแบบ temp",
        accountLogin: "เข้าสู่ account",
        accountRegister: "สร้าง account",
        tripAccess: "เข้า trip แบบ temp access",
      },
      details: {
        combined: "Account จะเก็บประวัติ สถิติ และสิทธิ owner ส่วน temp access ยังใช้เข้าทริปเดิมได้ทันที",
        accountLogin: "ใช้ email code หรือ passkey เพื่อกลับเข้า account ที่ผูกกับ trip ของคุณ",
        accountRegister: "สร้าง account ด้วย email code เพื่อเก็บประวัติ trip สถิติ และสิทธิ owner",
        tripAccess: "กรอก Trip ID และ password เพื่อเข้า trip เดิมโดยไม่ต้องใช้ account",
      },
      tabs: {
        account: "Account",
        temp: "Temp access",
        label: "โหมดเข้าใช้งาน",
      },
      messages: {
        accountLoadFailed: "โหลดข้อมูล account ไม่สำเร็จ",
        loggedOut: "ออกจาก account แล้ว",
        trustedLogin: "เข้าสู่ระบบแบบ trusted device แล้ว",
        temporaryLogin: "เข้าสู่ระบบแบบ temporary แล้ว",
      },
    },
    join: {
      pageLabel: "Join trip",
      eyebrow: "Sagittarius trip access",
      roomTitle: "เข้าห้อง trip",
      participantTitle: "เลือกตัวตน",
      roomDetail: "กรอก Trip ID และ password ของแผนนี้ก่อนเลือกสมาชิก",
      participantDetail: "เลือกชื่อของคุณ แล้วตั้งหรือยืนยันรหัสเฉพาะตัวสำหรับ trip นี้",
      tripId: "Trip ID",
      tripPassword: "Trip password",
      showTripPassword: "แสดงรหัสห้อง trip",
      hideTripPassword: "ซ่อนรหัสห้อง trip",
      submitRoom: "เข้าห้อง trip",
      backToRoom: "เปลี่ยน trip",
      participantListLabel: "รายชื่อสมาชิกใน trip",
      participantPassword: ({ name }: { name: string }) => `รหัสของ ${name}`,
      setParticipantPassword: ({ name }: { name: string }) => `ตั้งรหัสสำหรับ ${name}`,
      showParticipantPassword: "แสดงรหัสสมาชิก",
      hideParticipantPassword: "ซ่อนรหัสสมาชิก",
      start: "เริ่มใช้งาน",
      errors: {
        tripCredentials: "Trip ID หรือ password ไม่ถูกต้อง",
        participantPassword: "รหัสไม่ถูกต้อง",
        shortPassword: "ตั้งรหัสอย่างน้อย 4 ตัวอักษร",
      },
      memberStatus: {
        ready: "พร้อมใช้งาน",
        claimed: "ยืนยันแล้ว",
        disabled: "ปิดสิทธิ์",
      },
    },
  },
} as const;

type WidenMessages<T> = T extends (...args: infer Args) => infer Return
  ? (...args: Args) => Return
  : T extends string
    ? string
    : { readonly [Key in keyof T]: WidenMessages<T[Key]> };

export type Messages = WidenMessages<typeof messages.en>;

const checkedMessages: Record<Locale, Messages> = messages;

export function getMessages(locale: Locale): Messages {
  return checkedMessages[locale];
}
