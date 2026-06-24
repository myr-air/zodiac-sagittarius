import { describe, expect, it } from "vitest";

import {
  joinVisibleTextParts,
  visibleTextParts,
} from "../text-parts";

describe("text part helpers", () => {
  it("keeps only visible string parts in source order", () => {
    expect(visibleTextParts(["Rain", null, "", "12 mm", false, undefined, "4 h"])).toEqual([
      "Rain",
      "12 mm",
      "4 h",
    ]);
  });

  it("joins visible parts or returns null when nothing is visible", () => {
    expect(joinVisibleTextParts(["Rain", null, "12 mm"], " · ")).toBe("Rain · 12 mm");
    expect(joinVisibleTextParts([null, "", false, undefined], " · ")).toBeNull();
  });
});
