import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useWorkspaceChrome } from "../use-workspace-chrome";

describe("useWorkspaceChrome", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("keeps the context rail mounted during its close animation", () => {
    vi.useFakeTimers();
    const { result } = renderHook(() =>
      useWorkspaceChrome({ autoDismissToast: false }),
    );

    act(() => result.current.setContextRailVisibility(true));
    expect(result.current.contextRailOpen).toBe(true);
    expect(result.current.contextRailMounted).toBe(true);

    act(() => result.current.setContextRailVisibility(false));
    expect(result.current.contextRailOpen).toBe(false);
    expect(result.current.contextRailMounted).toBe(true);

    act(() => {
      vi.advanceTimersByTime(900);
    });
    expect(result.current.contextRailMounted).toBe(false);
  });

  it("closes the context rail from outside document clicks", () => {
    const { result } = renderHook(() =>
      useWorkspaceChrome({ autoDismissToast: false }),
    );

    act(() => result.current.setContextRailVisibility(true));
    act(() => {
      document.body.dispatchEvent(
        new PointerEvent("pointerdown", { bubbles: true }),
      );
    });

    expect(result.current.contextRailOpen).toBe(false);
  });

  it("auto-dismisses the workspace toast when requested", () => {
    vi.useFakeTimers();
    const { result } = renderHook(() =>
      useWorkspaceChrome({ autoDismissToast: true }),
    );

    expect(result.current.toastDismissed).toBe(false);
    act(() => {
      vi.advanceTimersByTime(6000);
    });
    expect(result.current.toastDismissing).toBe(true);

    act(() => {
      vi.advanceTimersByTime(220);
    });
    expect(result.current.toastDismissed).toBe(true);
  });
});
