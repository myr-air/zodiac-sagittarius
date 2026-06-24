import { describe, expect, it } from "vitest";
import {
  generatedDayFromSubPathId,
  generatedSubPathForIndex,
  generatedSubPathIndexFromId,
  generatedSubPathNameFromId,
} from "../../../itinerary-paths";

describe("generated itinerary sub paths", () => {
  it("builds generated day path ids and display names from one source", () => {
    expect(generatedSubPathForIndex("2026-06-19", 0)).toEqual({
      pathId: "path-2026-06-19-sub-a",
      pathName: "Plan A",
    });
    expect(generatedSubPathForIndex("2026-06-19", 27)).toEqual({
      pathId: "path-2026-06-19-sub-ab",
      pathName: "Plan AB",
    });
  });

  it("parses generated day path metadata for option completion and manual paths", () => {
    const pathId = "path-2026-06-19-sub-b";

    expect(generatedDayFromSubPathId(pathId)).toBe("2026-06-19");
    expect(generatedSubPathIndexFromId(pathId)).toBe(1);
    expect(generatedSubPathNameFromId(pathId)).toBe("Plan B");
  });

  it("ignores non-generated path ids", () => {
    expect(generatedDayFromSubPathId("path-rain")).toBeNull();
    expect(generatedSubPathIndexFromId("path-rain")).toBe(-1);
    expect(generatedSubPathNameFromId("path-rain")).toBeNull();
  });
});
