import { describe, expect, it } from "vitest";
import { messages } from "./messages";

describe("messages", () => {
  it("keeps Thai cockpit labels localized instead of leaking English UI copy", () => {
    expect(messages.th.appShell.nav.settings).toBe("ตั้งค่า");
    expect(messages.th.tripSettings.title).toBe("ตั้งค่าทริป");
    expect(messages.th.overview.filters.scopeLabel).toBe("ตัวกรองขอบเขตเช็กลิสต์");
    expect(messages.th.itinerary.importJsonInput).toBe(
      "นำเข้า itinerary JSON, CSV หรือ pasted table",
    );
    expect(messages.th.map.sourceNote).toContain("แผนที่สด");
    expect(messages.th.access.portal.nav.dashboard).toBe("แดชบอร์ด");
    expect(messages.th.access.portal.vaultCreate.submit).toBe("บันทึกเข้า Travel Vault");
    expect(messages.th.access.dashboard.noEmail).toBe("ยังไม่ได้โหลดอีเมล");
    expect(messages.th.access.settings.form.displayName).toBe("ชื่อที่แสดง *");
  });

  it("keeps access copy natural for Thai-English mixed product language", () => {
    expect(messages.th.access.entryHero.detail).toContain("ไอเดีย");
    expect(messages.th.access.entryHero.syncDetail).toContain("อุปกรณ์");
    expect(messages.th.access.emailLogin.registerPasswordDetail).toBe("สร้างรหัสผ่านก่อน แล้วค่อยยืนยันอีเมลในขั้นถัดไป");
    expect(messages.th.access.emailLogin.finishSetup).toBe("เสร็จแล้ว เริ่มวางแผนกัน");
  });
});
