export const thStopDialogMessages = {
  titles: {
    create: "เพิ่มกิจกรรม",
    edit: "แก้ไขรายละเอียด",
  },
  closeForm: "ปิดฟอร์ม",
  fields: {
    time: "เวลา",
    startTime: "เวลาเริ่ม",
    endTime: "เวลาจบ",
    day: "วัน",
    plan: "แผน",
    hours: "ชั่วโมง",
    minutes: "นาที",
    activity: "กิจกรรม",
    type: "ประเภท",
    place: "สถานที่",
    mapLink: "ลิงก์แผนที่",
    transportation: "การเดินทาง",
    note: "โน้ต",
  },
  actions: {
    cancel: "ยกเลิก",
    create: "บันทึกกิจกรรม",
    edit: "บันทึกการแก้ไข",
    delete: "ลบจุดนี้",
    chooseCandidate: ({ name }: { name: string }) => `เลือก ${name}`,
    saveUnresolved: "บันทึกแบบยังไม่ระบุพิกัด",
  },
  placeResolution: {
    candidates: "ตัวเลือกสถานที่",
    unresolved: "ยังหาพิกัดไม่ได้ บันทึกต่อได้โดยเก็บสถานที่/ลิงก์แผนที่ไว้ แต่หมุดแผนที่และการตรวจเส้นทางต้องกลับมาตรวจอีกครั้ง",
  },
  messages: {
    saving: "กำลังบันทึก...",
    saveFailed: "บันทึกกิจกรรมไม่สำเร็จ ตรวจช่องที่จำเป็นแล้วลองอีกครั้ง",
  },
} as const;
