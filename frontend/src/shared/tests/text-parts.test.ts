import { describe, expect, it } from "vitest";

import {
  displayNameListOrFallback,
  displayNameOrFallback,
  displayNullableTextOrFallback,
  displayTextOrFallback,
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

  it("formats display fallbacks and display-name lists", () => {
    expect(displayTextOrFallback("Provider", "No provider")).toBe("Provider");
    expect(displayTextOrFallback("", "No provider")).toBe("No provider");
    expect(displayNullableTextOrFallback("", "No provider")).toBe("");
    expect(displayNullableTextOrFallback(null, "No provider")).toBe("No provider");
    expect(displayNameOrFallback({ displayName: "Aom" }, "No owner")).toBe("Aom");
    expect(displayNameOrFallback(null, "No owner")).toBe("No owner");
    expect(displayNameListOrFallback([
      { displayName: "Aom" },
      { displayName: "Beam" },
    ], "No travelers")).toBe("Aom, Beam");
    expect(displayNameListOrFallback([], "No travelers")).toBe("No travelers");
  });
});
