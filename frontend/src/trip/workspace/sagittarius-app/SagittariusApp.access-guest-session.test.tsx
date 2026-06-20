import { fireEvent, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { SagittariusApp } from "@/src/app/SagittariusApp";
import { appRoutes } from "@/src/trip/workspace/sagittarius-app/support";
import {
  installLocalStorageStub,
  installSessionStorageStub,
  render,
} from "./sagittarius-app.test-support";

describe("Sagittarius cockpit guest participant sessions", () => {
  beforeEach(() => {
    installLocalStorageStub();
    installSessionStorageStub();
    window.history.pushState(null, "", appRoutes.home());
  });

  it("lets a guest participant leave their local session and choose another identity", async () => {
    const user = userEvent.setup();
    const confirm = vi.spyOn(window, "confirm");
    render(<SagittariusApp requireJoin />);

    fireEvent.change(screen.getByLabelText(/Trip ID/i), {
      target: { value: "HK-SZ-2025" },
    });
    fireEvent.change(screen.getByLabelText(/^Trip password$/i), {
      target: { value: "seed-trip-pass" },
    });
    await user.click(screen.getByRole("button", { name: /เข้าห้อง trip/i }));
    await user.click(screen.getByRole("button", { name: /Explorer Friend/i }));
    fireEvent.change(screen.getByLabelText(/ตั้งรหัสสำหรับ Explorer Friend/i), {
      target: { value: "traveler-pin" },
    });
    await user.click(screen.getByRole("button", { name: /เริ่มใช้งาน/i }));

    await user.click(screen.getByRole("button", { name: /เปลี่ยนตัวตน/i }));
    await user.click(
      within(screen.getByRole("dialog", { name: /เปลี่ยนตัวตน/i })).getByRole(
        "button",
        { name: /เปลี่ยนตัวตน/i },
      ),
    );

    expect(confirm).not.toHaveBeenCalled();
    expect(
      screen.getByRole("main", { name: /Account access/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /เข้าห้อง trip/i }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("navigation", { name: /เมนูวางแผน Joii/i }),
    ).not.toBeInTheDocument();
  }, 45_000);

  it("persists guest participant claims across a fresh app mount", async () => {
    const user = userEvent.setup();
    installLocalStorageStub();
    const { unmount } = render(<SagittariusApp requireJoin />);

    fireEvent.change(screen.getByLabelText(/Trip ID/i), {
      target: { value: "HK-SZ-2025" },
    });
    fireEvent.change(screen.getByLabelText(/^Trip password$/i), {
      target: { value: "seed-trip-pass" },
    });
    await user.click(screen.getByRole("button", { name: /เข้าห้อง trip/i }));
    await user.click(screen.getByRole("button", { name: /Explorer Friend/i }));
    fireEvent.change(screen.getByLabelText(/ตั้งรหัสสำหรับ Explorer Friend/i), {
      target: { value: "traveler-pin" },
    });
    await user.click(screen.getByRole("button", { name: /เริ่มใช้งาน/i }));
    await user.click(screen.getByRole("button", { name: /เปลี่ยนตัวตน/i }));
    await user.click(
      within(screen.getByRole("dialog", { name: /เปลี่ยนตัวตน/i })).getByRole(
        "button",
        { name: /เปลี่ยนตัวตน/i },
      ),
    );

    unmount();
    render(<SagittariusApp requireJoin />);

    fireEvent.change(screen.getByLabelText(/Trip ID/i), {
      target: { value: "HK-SZ-2025" },
    });
    fireEvent.change(screen.getByLabelText(/^Trip password$/i), {
      target: { value: "seed-trip-pass" },
    });
    await user.click(screen.getByRole("button", { name: /เข้าห้อง trip/i }));
    await user.click(screen.getByRole("button", { name: /Explorer Friend/i }));

    expect(
      screen.getByLabelText(/รหัสของ Explorer Friend/i),
    ).toBeInTheDocument();
    expect(
      screen.queryByLabelText(/ตั้งรหัสสำหรับ Explorer Friend/i),
    ).not.toBeInTheDocument();
  });
});
