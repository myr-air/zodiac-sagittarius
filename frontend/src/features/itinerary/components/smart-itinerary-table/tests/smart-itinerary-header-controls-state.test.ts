import { describe, expect, it } from "vitest";

import {
  closeSmartItineraryHeaderControls,
  initialSmartItineraryHeaderControlsState,
  toggleSmartItineraryHeaderControls,
  unmountClosedSmartItineraryHeaderControls,
} from "../smart-itinerary-header-controls-state";

describe("smart itinerary header controls state", () => {
  it("starts closed and unmounted", () => {
    expect(initialSmartItineraryHeaderControlsState).toEqual({
      expanded: false,
      render: false,
    });
  });

  it("opens and mounts the controls panel", () => {
    expect(
      toggleSmartItineraryHeaderControls(
        initialSmartItineraryHeaderControlsState,
      ),
    ).toEqual({
      expanded: true,
      render: true,
    });
  });

  it("closes without unmounting so the exit animation can run", () => {
    expect(
      toggleSmartItineraryHeaderControls({
        expanded: true,
        render: true,
      }),
    ).toEqual({
      expanded: false,
      render: true,
    });
  });

  it("dismisses controls without changing render lifecycle", () => {
    expect(
      closeSmartItineraryHeaderControls({
        expanded: true,
        render: true,
      }),
    ).toEqual({
      expanded: false,
      render: true,
    });
  });

  it("unmounts after the close animation completes", () => {
    expect(unmountClosedSmartItineraryHeaderControls()).toBe(
      initialSmartItineraryHeaderControlsState,
    );
  });
});
