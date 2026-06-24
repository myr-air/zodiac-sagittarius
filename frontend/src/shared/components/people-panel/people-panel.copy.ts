import type { Member } from "@/src/trip/types";

export function peoplePanelCopy(locale: string) {
  return locale === "th"
    ? {
        heading: "สมาชิกและสถานะ",
        emptyHint: "ลองปรับคำค้นหาหรือล้างตัวกรองเพื่อดูสมาชิกทั้งหมด",
        active: "เปิดสิทธิ์",
        disabled: "ปิดสิทธิ์",
        claimed: "ยืนยันแล้ว",
        pending: "รอเข้าร่วม",
        changePassword: "เปลี่ยนรหัสผ่าน",
        resetPassword: "รีเซ็ตรหัสผ่าน",
        changePasswordFor: (name: string) => `เปลี่ยนรหัสผ่าน ${name}`,
        resetPasswordFor: (name: string) => `รีเซ็ตรหัสผ่าน ${name}`,
        enableFor: (name: string) => `เปิดสิทธิ์ ${name}`,
        disableFor: (name: string) => `ปิดสิทธิ์ ${name}`,
        transferOwnerFor: (name: string) => `โอน owner ให้ ${name}`,
        resetFilters: "ล้างตัวกรอง",
      }
    : {
        heading: "Members and status",
        emptyHint: "Try a different search or clear filters to see every member.",
        active: "Active",
        disabled: "Disabled",
        claimed: "Verified",
        pending: "Pending",
        changePassword: "Change password",
        resetPassword: "Reset password",
        changePasswordFor: (name: string) => `Change password ${name}`,
        resetPasswordFor: (name: string) => `Reset password ${name}`,
        enableFor: (name: string) => `Enable ${name}`,
        disableFor: (name: string) => `Disable ${name}`,
        transferOwnerFor: (name: string) => `Transfer owner to ${name}`,
        resetFilters: "Clear filters",
      };
}

export function presenceLabel(presence: Member["presence"]): string {
  /* v8 ignore next */
  return presence === "online" ? "ออนไลน์" : presence === "away" ? "ออฟไลน์ 1 ชม." : "ออฟไลน์";
}
