import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useEscapeToClose } from "../use-escape-to-close";

describe("useEscapeToClose", () => {
  it("runs the close handler when Escape is pressed", () => {
    const onClose = vi.fn();
    renderHook(() => useEscapeToClose(onClose));

    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter" }));
    expect(onClose).not.toHaveBeenCalled();

    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("removes the keydown listener on unmount", () => {
    const onClose = vi.fn();
    const { unmount } = renderHook(() => useEscapeToClose(onClose));

    unmount();
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));

    expect(onClose).not.toHaveBeenCalled();
  });
});
