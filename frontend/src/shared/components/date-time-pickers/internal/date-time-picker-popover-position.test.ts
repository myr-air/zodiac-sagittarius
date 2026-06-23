import { describe, expect, it } from "vitest";
import {
  calculatePickerPanelInitialPosition,
  calculatePickerPanelPosition,
} from "./date-time-picker-popover-position";

describe("date time picker popover position", () => {
  it("places the panel below the trigger when there is room", () => {
    expect(
      calculatePickerPanelPosition({
        panelHeight: 240,
        triggerRect: { bottom: 120, left: 40, top: 90 },
        viewportHeight: 700,
        viewportWidth: 900,
        width: 320,
      }),
    ).toEqual({ left: 40, top: 126, width: 320 });
  });

  it("clamps horizontal position and width to the viewport", () => {
    expect(
      calculatePickerPanelPosition({
        panelHeight: 240,
        triggerRect: { bottom: 80, left: 700, top: 50 },
        viewportHeight: 700,
        viewportWidth: 360,
        width: 420,
      }),
    ).toEqual({ left: 8, top: 86, width: 344 });
  });

  it("moves above the trigger when the below placement would overflow", () => {
    expect(
      calculatePickerPanelPosition({
        panelHeight: 240,
        triggerRect: { bottom: 680, left: 48, top: 650 },
        viewportHeight: 700,
        viewportWidth: 900,
        width: 320,
      }),
    ).toEqual({ left: 48, top: 404, width: 320 });
  });

  it("preserves the initial below-trigger placement before panel height is measured", () => {
    expect(
      calculatePickerPanelInitialPosition({
        triggerRect: { bottom: 720, left: 12 },
        viewportHeight: 700,
        viewportWidth: 360,
        width: 420,
      }),
    ).toEqual({ left: 12, top: 692, width: 344 });
  });
});
