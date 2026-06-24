import { describe, expect, it } from "vitest";
import {
  itemBaseClassName,
  listClassName,
  panelClassName,
  titleButtonClassName,
  titleRowClassName,
} from "../suggestion-panel.styles";

describe("suggestion panel styles", () => {
  it("keeps suggestion panel layout classes centralized", () => {
    expect(panelClassName).toContain("suggestion-module");
    expect(titleRowClassName).toContain("module-title-row");
    expect(titleButtonClassName).toContain("hover:bg-(--color-primary-soft)");
    expect(listClassName).toContain("suggestion-list");
    expect(itemBaseClassName).toContain("suggestion-item");
    expect(itemBaseClassName).toContain("grid-cols-[18px_minmax(0,1fr)]");
  });
});
