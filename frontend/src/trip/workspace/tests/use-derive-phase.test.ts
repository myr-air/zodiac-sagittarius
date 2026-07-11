import { describe, it, expect } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";
import { useDerivePhase } from "../use-derive-phase";
import type { DerivePhaseInput } from "../derive-phase";

function makeInput(overrides: Partial<DerivePhaseInput> = {}): DerivePhaseInput {
  return {
    name: "Test Trip",
    destinationLabel: "Bangkok",
    startDate: "2027-03-15",
    endDate: "2027-03-22",
    activityCount: 0,
    hasWaypoints: false,
    hasDateWindow: false,
    memberCount: 1,
    isTripActive: false,
    ...overrides,
  };
}

describe("useDerivePhase", () => {
  it("initializes currentPhase from data-derived default", () => {
    const { result } = renderHook(() => useDerivePhase(makeInput()));
    expect(result.current.currentPhase).toBe("dreamer");
  });

  it("returns availablePhases from derivePhase", () => {
    const { result } = renderHook(() =>
      useDerivePhase(makeInput({ activityCount: 5, memberCount: 3, isTripActive: true })),
    );
    expect(result.current.availablePhases.has("detail-planner")).toBe(true);
    expect(result.current.availablePhases.has("group-wrangler")).toBe(true);
    expect(result.current.availablePhases.has("on-trip-companion")).toBe(true);
  });

  it("setPhase overrides the derived default when the phase is available", () => {
    const { result } = renderHook(
      (input) => useDerivePhase(input),
      { initialProps: makeInput({ hasDateWindow: true }) },
    );
    // Default is flexible-hunter because date window is set
    expect(result.current.currentPhase).toBe("flexible-hunter");

    // Override to dreamer (always available)
    act(() => result.current.setPhase("dreamer"));
    expect(result.current.currentPhase).toBe("dreamer");
  });

  it("setPhase is a no-op when the phase is not available", () => {
    const { result } = renderHook(
      (input) => useDerivePhase(input),
      { initialProps: makeInput() },
    );
    // Trip has only name+destination — only dreamer is available
    expect(result.current.availablePhases.has("route-builder")).toBe(false);

    act(() => result.current.setPhase("route-builder"));
    // Should still be dreamer
    expect(result.current.currentPhase).toBe("dreamer");
  });

  it("user override clears when trip data changes (re-derive on data change)", async () => {
    const input1 = makeInput({ hasDateWindow: true });
    const { result, rerender } = renderHook(
      (input) => useDerivePhase(input),
      { initialProps: input1 },
    );

    // Default is flexible-hunter because date window is set
    expect(result.current.currentPhase).toBe("flexible-hunter");

    // Override to dreamer (always available)
    act(() => result.current.setPhase("dreamer"));
    expect(result.current.currentPhase).toBe("dreamer");

    // Change trip data — override should clear, re-derive
    const input3 = makeInput({ hasDateWindow: true, activityCount: 3 });
    rerender(input3);

    // useEffect clears the override asynchronously — wait for it
    await waitFor(() => {
      expect(result.current.currentPhase).toBe("detail-planner");
    });
  });

  it("members overlay availablePhases includes group-wrangler without changing default", () => {
    const { result } = renderHook(() =>
      useDerivePhase(makeInput({ memberCount: 4 })),
    );
    expect(result.current.currentPhase).toBe("dreamer");
    expect(result.current.availablePhases.has("group-wrangler")).toBe(true);
  });

  it("active trip availablePhases includes on-trip-companion without changing default", () => {
    const { result } = renderHook(() =>
      useDerivePhase(makeInput({ isTripActive: true, activityCount: 2 })),
    );
    expect(result.current.currentPhase).toBe("detail-planner");
    expect(result.current.availablePhases.has("on-trip-companion")).toBe(true);
  });
});
