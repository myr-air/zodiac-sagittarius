export const thAccountPortalPortalMessages = {
  title: "Portal",
  nav: {
    label: "Portal navigation",
    dashboard: "แดชบอร์ด",
    trips: "ทริปของฉัน",
    explorer: "Explorer",
    todos: "Trip To-dos",
    vault: "Travel Vault",
    settings: "ตั้งค่า",
  },
  sections: {
    dashboard: {
      title: "แดชบอร์ด",
      detail: "User data stats และ session status",
    },
    trips: {
      title: "ทริปของฉัน",
    },
    explorer: {
      title: "Explorer",
      detail: "ค้นหาทริปที่แชร์จากคนในระบบของคุณ",
    },
    todos: {
      title: "Trip To-dos",
      detail: "ชื่อใหม่สำหรับเช็กลิสต์และงานในทริป",
      empty: "ยังไม่มี to-dos",
    },
    vault: {
      title: "Travel Vault",
      detail: "ชื่อใหม่สำหรับโน้ตและไฟล์",
      empty: "ยังไม่มีโน้ตหรือไฟล์",
    },
    signOut: {
      title: "Sign out",
      detail: "จบ account session บนอุปกรณ์นี้",
    },
  },
  explorerStats: {
    upcoming: "Upcoming trips",
    destinations: "Destinations",
    nextTrip: "Next trip",
  },
  explorerSearch: {
    label: "ค้นหา shared trips",
    mapPreviewLabel: "ตัวอย่างแผนที่ shared trips",
    owned: "Owned",
    placeholder: "ค้นหา city, trip หรือ role",
    shared: "Shared",
  },
  emptyStates: {
    trips: {
      title: "เริ่มสร้างทริปแรก",
      detail: "เริ่มจาก route, วันที่ และ owner settings ที่แชร์กับเพื่อนได้",
      action: "Create trip",
    },
    explorer: {
      title: "ยังไม่มี shared trips",
      detail: "ทริปที่แชร์จาก account network จะมาแสดงตรงนี้",
      noMatchesTitle: "ไม่พบ shared trips ตามคำค้นนี้",
      noMatchesDetail: "ลองค้นด้วย city, ชื่อทริป หรือ role อื่น",
      action: "Create trip",
    },
    todos: {
      title: "Create trip เพื่อเริ่ม shared to-dos",
      detail: "งานของทริปจะแสดงที่นี่หลังจากสร้างหรือเข้าร่วมทริป",
      action: "Create trip",
    },
  },
  vaultCreate: {
    kind: "Kind",
    note: "Note",
    file: "File",
    title: "ชื่อรายการ *",
    detail: "รายละเอียด",
    externalUrl: "ลิงก์ไฟล์",
    personal: "ส่วนตัว",
    submit: "บันทึกเข้า Travel Vault",
    success: "Saved to Travel Vault.",
    error: "Could not save vault item.",
  },
} as const;
