import { describe, expect, it } from "vitest";

import {
  initialRouteLiveMapLifecycleState,
  retryRouteLiveMap,
  setRouteLiveMapState,
} from "../route-live-map-state";

describe("route live map lifecycle state", () => {
  it("starts idle with the first retry key", () => {
    expect(initialRouteLiveMapLifecycleState).toEqual({
      retryKey: 0,
      state: "idle",
    });
  });

  it("updates the live map state without changing retry key", () => {
    expect(
      setRouteLiveMapState(
        {
          retryKey: 2,
          state: "loading",
        },
        "ready",
      ),
    ).toEqual({
      retryKey: 2,
      state: "ready",
    });
  });

  it("resets to idle and advances retry key on retry", () => {
    expect(
      retryRouteLiveMap({
        retryKey: 2,
        state: "error",
      }),
    ).toEqual({
      retryKey: 3,
      state: "idle",
    });
  });
});
