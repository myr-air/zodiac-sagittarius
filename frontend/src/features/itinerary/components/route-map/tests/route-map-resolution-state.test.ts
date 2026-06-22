import { describe, expect, it } from "vitest";

import {
  beginRouteMapCoordinateResolution,
  completeRouteMapCoordinateResolution,
  initialRouteMapResolutionState,
} from "../route-map-resolution-state";

describe("route map resolution state", () => {
  it("starts idle with no resolution result", () => {
    expect(initialRouteMapResolutionState).toEqual({
      resolutionResult: null,
      resolvingMissing: false,
    });
  });

  it("clears stale results when coordinate resolution begins", () => {
    expect(beginRouteMapCoordinateResolution()).toEqual({
      resolutionResult: null,
      resolvingMissing: true,
    });
  });

  it("stores successful coordinate resolution summaries", () => {
    expect(
      completeRouteMapCoordinateResolution({
        attempted: 8,
        failed: 1,
        resolved: 3,
        skipped: 4,
      }),
    ).toEqual({
      resolutionResult: {
        attempted: 8,
        failed: 1,
        resolved: 3,
        skipped: 4,
      },
      resolvingMissing: false,
    });
  });

  it("returns to idle without a result when the resolver has no summary", () => {
    expect(completeRouteMapCoordinateResolution()).toEqual({
      resolutionResult: null,
      resolvingMissing: false,
    });
  });
});
