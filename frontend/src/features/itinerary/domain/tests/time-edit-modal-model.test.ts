import { describe, expect, it } from "vitest";
import { buildTimeEditModalModel } from "../time-edit-modal-model";

describe("buildTimeEditModalModel", () => {
  it("builds a cross-day preview and duration label", () => {
    const model = buildTimeEditModalModel({
      endOffsetDays: 1,
      endTime: "01:15",
      locale: "en",
      startTime: "23:30",
    });

    expect(model.startError).toBeNull();
    expect(model.endError).toBeNull();
    expect(model.closeLabel).toBe("Close time editor");
    expect(model.nextDayEndLabel).toBe("next day end");
    expect(model.previewLabel).toBe("Display preview");
    expect(model.previewWindow).toBe("23:30 - 01:15 +1");
    expect(model.durationLabel).toBe("Duration: 1 h 45 m");
  });

  it("accepts a blank start time when an end time is entered", () => {
    const model = buildTimeEditModalModel({
      endOffsetDays: 0,
      endTime: "10:00",
      locale: "th",
      startTime: "",
    });

    expect(model.startError).toBeNull();
    expect(model.endError).toBeNull();
    expect(model.closeLabel).toBe("ปิดตัวแก้ไขเวลา");
    expect(model.nextDayEndLabel).toBe("จบวันถัดไป");
    expect(model.previewLabel).toBe("ตัวอย่างที่จะแสดง");
    expect(model.previewWindow).toBe("10:00");
    expect(model.durationLabel).toBe("ไม่แสดง duration");
  });

  it("reports a per-field error for an invalid start time", () => {
    const model = buildTimeEditModalModel({
      endOffsetDays: 0,
      endTime: "",
      locale: "en",
      startTime: "25:00",
    });

    expect(model.startError).toBe("Start time must use HH:MM, for example 09:30.");
    expect(model.endError).toBeNull();
  });

  it("reports a per-field error for an invalid end time", () => {
    const model = buildTimeEditModalModel({
      endOffsetDays: 0,
      endTime: "abc",
      locale: "en",
      startTime: "08:00",
    });

    expect(model.startError).toBeNull();
    expect(model.endError).toBe("End time must use HH:MM, for example 09:30.");
  });
});
