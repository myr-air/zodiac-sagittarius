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

    expect(model.errorMessage).toBeNull();
    expect(model.previewWindow).toBe("23:30 - 01:15 +1");
    expect(model.durationLabel).toBe("Duration: 1 h 45 m");
  });

  it("requires a start time when an end time is entered", () => {
    const model = buildTimeEditModalModel({
      endOffsetDays: 0,
      endTime: "10:00",
      locale: "th",
      startTime: "",
    });

    expect(model.errorMessage).toBe("ใส่เวลาเริ่มก่อนใส่เวลาจบ");
    expect(model.previewWindow).toBe("--:--");
    expect(model.durationLabel).toBe("ไม่แสดง duration");
  });
});
