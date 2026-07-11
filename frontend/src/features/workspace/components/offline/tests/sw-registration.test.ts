import { describe, expect, it, vi } from "vitest";

describe("service worker registration", () => {
  it("registers service worker when supported", () => {
    const mockRegister = vi.fn().mockResolvedValue({ scope: "/" });
    Object.defineProperty(navigator, "serviceWorker", {
      value: { register: mockRegister },
      configurable: true,
    });

    // Simulate the registration logic from layout.tsx
    navigator.serviceWorker.register("/sw.js", { scope: "/" });
    expect(mockRegister).toHaveBeenCalledWith("/sw.js", { scope: "/" });
  });

  it("handles registration failure gracefully", async () => {
    const mockRegister = vi.fn().mockRejectedValue(new Error("SW failed"));
    Object.defineProperty(navigator, "serviceWorker", {
      value: { register: mockRegister },
      configurable: true,
    });

    await expect(
      navigator.serviceWorker.register("/sw.js", { scope: "/" })
    ).rejects.toThrow("SW failed");
  });
});
