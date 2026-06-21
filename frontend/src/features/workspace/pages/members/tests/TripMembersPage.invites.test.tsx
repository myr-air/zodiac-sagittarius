import { act, fireEvent, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { appRoutes } from "@/src/trip/workspace/sagittarius-app/support";
import { renderMembersPage } from "../testing/support/render-members-page";

describe("TripMembersPage invites", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("copies invite links and reports clipboard failures", async () => {
    const user = userEvent.setup();
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText },
    });
    renderMembersPage();

    fireEvent.click(screen.getByRole("button", { name: /คัดลอกลิงก์เชิญ/i }));
    await act(async () => {
      await Promise.resolve();
    });
    expect(writeText).toHaveBeenCalledWith(
      expect.stringContaining(appRoutes.join("HK-SZ-2025")),
    );
    expect(screen.getByRole("status")).toHaveTextContent("คัดลอกแล้ว");

    writeText.mockRejectedValueOnce(new Error("clipboard unavailable"));
    await user.click(screen.getByRole("button", { name: /คัดลอกลิงก์เชิญ/i }));
    expect(screen.getByRole("status")).toHaveTextContent("คัดลอกไม่สำเร็จ");
  });

  it("resets invite copy feedback after a short confirmation window", async () => {
    vi.useFakeTimers();
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText: vi.fn().mockResolvedValue(undefined) },
    });
    renderMembersPage();

    fireEvent.click(screen.getByRole("button", { name: /คัดลอกลิงก์เชิญ/i }));
    await act(async () => {
      await Promise.resolve();
    });
    expect(screen.getByRole("status")).toHaveTextContent("คัดลอกแล้ว");

    act(() => {
      vi.advanceTimersByTime(2500);
    });
    expect(screen.getByRole("status")).toHaveTextContent("พร้อมเชิญสมาชิก");
  });
});
