export const thMapMessages = {
  pageLabel: "แผนที่เส้นทาง",
  title: "แผนที่",
  filterLabel: "เลือกวันบนแผนที่",
  allDays: "ทุกวัน",
  chooseDay: "เลือกวัน",
  canvasLabel: "ตัวอย่างแผนที่เส้นทางฮ่องกงและเซินเจิ้น",
  liveLoading: "กำลังโหลดแผนที่จาก OpenFreeMap",
  liveError: "โหลดแผนที่สดไม่สำเร็จ แสดงแผนผังสำรองไว้ก่อน",
  retryLiveMap: "ลองโหลดแผนที่สดอีกครั้ง",
  resolveMissing: ({ count }: { count: number }) => `หาพิกัด ${count} จุด`,
  resolvingMissing: ({ count }: { count: number }) => `กำลังหา ${count} จุด...`,
  resolveBatchHint: ({ count, total }: { count: number; total: number }) => `หาครั้งละ ${count} จุดเพื่อไม่ให้ช้าเกินไป ยังเหลือ ${total} จุด`,
  resolveProgress: ({ count, total }: { count: number; total: number }) => `กำลังค้นหา ${count} จาก ${total} จุดที่ยังไม่มีพิกัด`,
  resolveResult: ({ attempted, failed, resolved, skipped }: { attempted: number; failed: number; resolved: number; skipped: number }) =>
    resolved === 0
      ? `ไม่พบพิกัดใน ${attempted} จุด ลองเลือกเฉพาะวันหรือใส่ชื่อสถานที่ให้เจาะจงขึ้น`
      : `พบ ${resolved}/${attempted} จุด · ${skipped + failed} จุดต้องตรวจต่อ`,
  resolveUnavailable: "ยังไม่ได้เปิดระบบหาพิกัด",
  visibleStopsLabel: "จุดบนเส้นทางที่แสดงอยู่",
  locationStatus: ({ mapped, total, unresolved }: { mapped: number; total: number; unresolved: number }) => `${mapped}/${total} มีพิกัด · ${unresolved} ยังไม่ระบุ`,
  unresolvedLabel: "กิจกรรมที่ยังไม่มีพิกัด",
  unresolvedTitle: ({ count }: { count: number }) => `${count} กิจกรรมยังไม่มีพิกัด`,
  sourceNote: "แผนที่สด: OpenFreeMap + ข้อมูล OpenStreetMap · ตัวแสดงผล: MapLibre GL JS",
} as const;
