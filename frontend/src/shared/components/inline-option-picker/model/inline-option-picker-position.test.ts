import { describe, expect, it } from "vitest";
import {
  inlineOptionPickerMenuPosition,
  inlineOptionPickerSideMenuPosition,
} from "./inline-option-picker-position";

describe("inline option picker positioning", () => {
  it("places the main menu below the trigger when there is room", () => {
    expect(
      inlineOptionPickerMenuPosition({
        anchorRect: { left: 40, top: 100, bottom: 132, width: 120 },
        optionCount: 3,
        viewport: { width: 800, height: 600 },
      }),
    ).toEqual({ left: 40, top: 138, width: 180 });
  });

  it("places the main menu above the trigger when the viewport bottom is tight", () => {
    expect(
      inlineOptionPickerMenuPosition({
        anchorRect: { left: 720, top: 560, bottom: 592, width: 160 },
        optionCount: 4,
        viewport: { width: 800, height: 620 },
      }),
    ).toEqual({ left: 612, top: 410, width: 180 });
  });

  it("opens the side menu to the right when it fits", () => {
    expect(
      inlineOptionPickerSideMenuPosition({
        activeIndex: 2,
        menuLeft: 100,
        menuTop: 120,
        menuWidth: 180,
        sideMenuWidth: 180,
        sideOptionCount: 3,
        viewport: { width: 800, height: 600 },
      }),
    ).toEqual({ left: 286, top: 188 });
  });

  it("flips the side menu left when the right side is tight", () => {
    expect(
      inlineOptionPickerSideMenuPosition({
        activeIndex: 0,
        menuLeft: 560,
        menuTop: 120,
        menuWidth: 180,
        sideMenuWidth: 180,
        sideOptionCount: 3,
        viewport: { width: 760, height: 600 },
      }),
    ).toEqual({ left: 374, top: 120 });
  });
});
