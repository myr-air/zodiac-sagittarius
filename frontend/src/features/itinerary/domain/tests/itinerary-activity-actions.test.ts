import { describe, expect, it } from "vitest";
import {
  activityActionMenuLabel,
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

  it("uses place before activity for map labels", () => {
    expect(activityMapActionLabel(item, "Open map")).toBe(
      "Open map: Hong Kong Station",
    );
    expect(
      activityMapActionLabel({ activity: "Airport Express", place: "" }, "Map"),
    ).toBe("Map: Airport Express");
  });
});
