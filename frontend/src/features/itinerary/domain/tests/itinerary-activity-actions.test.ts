import { describe, expect, it } from "vitest";
import {
  activityActionMenuLabel,
  activityBlockToggleLabel,
  activityMapActionLabel,
  activityNoteActionLabel,
} from "../itinerary-activity-actions";

describe("itinerary activity action labels", () => {
  const item = { activity: "Airport Express", place: "Hong Kong Station" };

  it("builds localized action menu and note labels", () => {
    expect(activityActionMenuLabel(item, "en")).toBe(
      "Activity actions for Airport Express",
    );
    expect(activityActionMenuLabel(item, "th")).toBe(
      "จัดการกิจกรรม Airport Express",
    );
    expect(activityNoteActionLabel(item, "en")).toBe(
      "Add note for Airport Express",
    );
    expect(activityNoteActionLabel(item, "th")).toBe(
      "เพิ่มโน้ต Airport Express",
    );
  });

  it("shows contextual note labels based on whether a note exists", () => {
    expect(activityNoteActionLabel(item, "en", "")).toBe(
      "Add note for Airport Express",
    );
    expect(activityNoteActionLabel(item, "en", "Boarding gate 7")).toBe(
      "View note for Airport Express",
    );
    expect(activityNoteActionLabel(item, "th", "")).toBe(
      "เพิ่มโน้ต Airport Express",
    );
    expect(activityNoteActionLabel(item, "th", "ประตูขึ้นเครื่อง 7")).toBe(
      "ดูโน้ต Airport Express",
    );
  });

  it("uses place before activity for map labels", () => {
    expect(activityMapActionLabel(item, "Open map")).toBe(
      "Open map: Hong Kong Station",
    );
    expect(
      activityMapActionLabel({ activity: "Airport Express", place: "" }, "Map"),
    ).toBe("Map: Airport Express");
  });

  it("builds localized activity block toggle labels", () => {
    expect(activityBlockToggleLabel(item, "en", false)).toBe(
      "Convert Airport Express to activity block",
    );
    expect(activityBlockToggleLabel(item, "en", true)).toBe(
      "Undo activity block for Airport Express",
    );
    expect(activityBlockToggleLabel(item, "th", false)).toBe(
      "เปลี่ยน Airport Express เป็น activity block",
    );
    expect(activityBlockToggleLabel(item, "th", true)).toBe(
      "เลิก activity block Airport Express",
    );
  });
});
