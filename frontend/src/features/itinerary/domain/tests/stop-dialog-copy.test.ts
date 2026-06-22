import { describe, expect, it } from "vitest";
import { stopDialogCopy } from "../stop-dialog-copy";

describe("stopDialogCopy", () => {
  it("returns localized stop dialog labels", () => {
    expect(stopDialogCopy("en")).toMatchObject({
      editSubActivityTitle: "Edit sub-activity",
      moreDetailsLabel: "More details",
      timeWindow: {
        groupLabel: "Time window",
        nextDayLabel: "Next day",
        notSetLabel: "Not set",
      },
    });
    expect(stopDialogCopy("th")).toMatchObject({
      editSubActivityTitle: "แก้ไข sub-activity",
      moreDetailsLabel: "รายละเอียดเพิ่มเติม",
      timeWindow: {
        groupLabel: "ช่วงเวลา",
        nextDayLabel: "ข้ามวัน",
        notSetLabel: "ไม่ระบุ",
      },
    });
  });

  it("keeps next-day toggle labels stable for empty activities", () => {
    expect(
      stopDialogCopy("en").timeWindow.toggleNextDayLabel({ activity: "" }),
    ).toBe("Toggle next-day end activity");
    expect(
      stopDialogCopy("th").timeWindow.toggleNextDayLabel({
        activity: "Night flight",
      }),
    ).toBe("Toggle next-day end Night flight");
  });
});
