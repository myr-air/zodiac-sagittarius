import { describe, expect, it } from "vitest";
import { hongKongDay } from "../testing/fixtures/route-map-fixtures";
import {
  beginRouteMapViewCoordinateResolution,
  completeRouteMapViewCoordinateResolution,
  initialRouteMapViewState,
  setRouteMapActiveDay,
  settleRouteMapViewCoordinateResolution,
} from "../route-map-view-state";

describe("route map view state", () => {
  it("starts with all days selected and idle coordinate resolution", () => {
    expect(initialRouteMapViewState).toEqual({
      activeDay: "all",
      resolutionState: {
        resolutionResult: null,
        resolvingMissing: false,
      },
    });
  });

  it("updates active day without changing resolution state", () => {
    expect(setRouteMapActiveDay(initialRouteMapViewState, hongKongDay)).toEqual({
      ...initialRouteMapViewState,
      activeDay: hongKongDay,
    });
  });

  it("tracks coordinate resolution lifecycle", () => {
    const resolving = beginRouteMapViewCoordinateResolution(
      initialRouteMapViewState,
    );

    expect(resolving).toEqual({
      ...initialRouteMapViewState,
      resolutionState: {
        resolutionResult: null,
        resolvingMissing: true,
      },
    });

    expect(
      completeRouteMapViewCoordinateResolution(resolving, {
        attempted: 8,
        failed: 1,
        resolved: 3,
        skipped: 4,
      }),
    ).toEqual({
      ...initialRouteMapViewState,
      resolutionState: {
        resolutionResult: {
          attempted: 8,
          failed: 1,
          resolved: 3,
          skipped: 4,
        },
        resolvingMissing: false,
      },
    });
  });

  it("settles only in-flight coordinate resolution", () => {
    expect(settleRouteMapViewCoordinateResolution(initialRouteMapViewState)).toBe(
      initialRouteMapViewState,
    );
    expect(
      settleRouteMapViewCoordinateResolution(
        beginRouteMapViewCoordinateResolution(initialRouteMapViewState),
      ),
    ).toEqual(initialRouteMapViewState);
  });
});
