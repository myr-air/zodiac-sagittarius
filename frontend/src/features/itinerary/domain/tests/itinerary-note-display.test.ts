import { describe, expect, it } from "vitest";
import { itineraryNoteModalCopy } from "../itinerary-note-display";

describe("itineraryNoteModalCopy", () => {
  it("builds English note modal copy from the itinerary item", () => {
    expect(
      itineraryNoteModalCopy({ activity: "Airport Express" }, "en"),
    ).toMatchObject({
      cancel: "Cancel",
      close: "Close note modal",
      label: "Note",
      save: "Save note",
      title: "Note for Airport Express",
    });
  });

  it("builds Thai note modal copy from the itinerary item", () => {
    expect(
      itineraryNoteModalCopy({ activity: "Airport Express" }, "th"),
    ).toMatchObject({
      cancel: "ยกเลิก",
      close: "ปิด modal โน้ต",
      label: "โน้ต",
      save: "บันทึกโน้ต",
      title: "โน้ตสำหรับ Airport Express",
    });
  });
});
