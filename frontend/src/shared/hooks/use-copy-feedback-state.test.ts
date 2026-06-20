import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  copyFeedbackStateValues,
  useCopyFeedbackState,
} from "./use-copy-feedback-state";

describe("useCopyFeedbackState", () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("keeps feedback states in lifecycle order", () => {
    expect(copyFeedbackStateValues).toEqual(["idle", "copied", "error"]);
  });

  it("copies text, reports success, and resets after the delay", async () => {
    vi.useFakeTimers();
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText },
    });
    const { result } = renderHook(() =>
      useCopyFeedbackState({ resetDelayMs: 1000 }),
    );

    await act(async () => {
      await result.current.copyText("Trip invite");
    });

    expect(writeText).toHaveBeenCalledWith("Trip invite");
    expect(result.current.hasCopied).toBe(true);
    expect(result.current.copyState).toBe("copied");

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(result.current.copyState).toBe("idle");
    expect(result.current.hasCopied).toBe(false);
  });

  it("reports copy errors without running the success callback", async () => {
    const writeText = vi.fn().mockRejectedValue(new Error("denied"));
    const afterCopy = vi.fn();
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText },
    });
    const { result } = renderHook(() => useCopyFeedbackState());

    let copied = true;
    await act(async () => {
      copied = await result.current.copyText("Trip invite", afterCopy);
    });

    expect(copied).toBe(false);
    expect(afterCopy).not.toHaveBeenCalled();
    expect(result.current.copyState).toBe("error");
    expect(result.current.hasCopied).toBe(false);
  });
});
