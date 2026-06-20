import {
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { SagittariusApp } from "@/src/app/SagittariusApp";
import { tripStorageKey } from "@/src/trip/repository";
import { seedTrip } from "@/src/trip/seed";
import { appRoutes } from "@/src/trip/workspace/sagittarius-app/support";
import {
  installLocalStorageStub,
  render,
  resetSagittariusAppTestEnvironment,
} from "./sagittarius-app.test-support";

describe("Sagittarius cockpit member actions", () => {
  beforeEach(() => {
    resetSagittariusAppTestEnvironment();
  });

  it("copies the trip invite link from the members command center", async () => {
    const user = userEvent.setup();
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText },
    });

    render(<SagittariusApp initialView="members" />);

    await user.click(screen.getByRole("button", { name: /คัดลอกลิงก์เชิญ/i }));

    expect(writeText).toHaveBeenCalledWith(
      expect.stringContaining(appRoutes.join("HK-SZ-2025")),
    );
    expect(screen.getByText(/คัดลอกแล้ว/i)).toBeInTheDocument();
  });

  it("creates new members from the members command center", async () => {
    const user = userEvent.setup();
    render(<SagittariusApp initialView="members" />);

    await user.click(
      screen.getByRole("button", { name: /เปิดฟอร์มเพิ่มสมาชิก/i }),
    );
    await user.type(screen.getByLabelText(/ชื่อสมาชิกใหม่/i), "New Cousin");
    await user.selectOptions(
      screen.getByLabelText(/สิทธิ์สมาชิกใหม่/i),
      "viewer",
    );
    await user.click(screen.getByRole("button", { name: /บันทึกสมาชิก/i }));

    const newMemberRow = screen
      .getAllByText("New Cousin")[0]
      .closest(".person-row");
    expect(newMemberRow).not.toBeNull();
    expect(
      within(newMemberRow as HTMLElement).getByText(/ดูได้/i),
    ).toBeInTheDocument();
    expect(
      within(newMemberRow as HTMLElement).getByText(/รอเข้าร่วม/i),
    ).toBeInTheDocument();
  });

  it("manages member roles, access, claim reset, and current member password from the app state", async () => {
    const user = userEvent.setup();
    const confirm = vi.spyOn(window, "confirm");
    const prompt = vi.spyOn(window, "prompt");
    render(<SagittariusApp initialView="members" />);

    await user.selectOptions(
      screen.getByLabelText(/Role for Explorer Friend/i),
      "organizer",
    );
    expect(
      screen.getByText("Explorer Friend").closest(".person-row"),
    ).toHaveTextContent("ผู้จัดทริป");

    await user.click(
      screen.getByRole("button", { name: /ปิดสิทธิ์ Explorer Friend/i }),
    );
    await user.click(screen.getByRole("button", { name: /ยืนยัน/i }));
    expect(
      screen.getByRole("button", { name: /เปิดสิทธิ์ Explorer Friend/i }),
    ).toBeInTheDocument();

    await user.click(
      screen.getByRole("button", { name: /เปิดสิทธิ์ Explorer Friend/i }),
    );
    await user.click(screen.getByRole("button", { name: /ยืนยัน/i }));
    expect(
      screen.getByRole("button", { name: /ปิดสิทธิ์ Explorer Friend/i }),
    ).toBeInTheDocument();

    await user.click(
      screen.getByRole("button", { name: /เปลี่ยนรหัสผ่าน Demo Traveler/i }),
    );
    const passwordDialog = screen.getByRole("dialog", {
      name: /เปลี่ยนรหัสผ่าน Demo Traveler/i,
    });
    await user.type(
      within(passwordDialog).getByLabelText(/รหัสผ่านใหม่/i),
      "owner-new-pin",
    );
    await user.click(
      within(passwordDialog).getByRole("button", { name: /บันทึกรหัสผ่าน/i }),
    );

    expect(prompt).not.toHaveBeenCalled();
    expect(confirm).not.toHaveBeenCalled();

    prompt.mockRestore();
    confirm.mockRestore();
  });

  it("resets a claimed non-owner member loaded from a persisted draft", async () => {
    const user = userEvent.setup();
    const confirm = vi.spyOn(window, "confirm");
    const storage = installLocalStorageStub();
    storage.setItem(
      tripStorageKey,
      JSON.stringify({
        ...seedTrip,
        members: seedTrip.members.map((member) =>
          member.id === "member-beam"
            ? {
                ...member,
                claimPasswordHash: "local_hash_old",
                claimedAt: "2026-05-28T00:00:00.000Z",
              }
            : member,
        ),
      }),
    );

    render(<SagittariusApp initialView="members" />);

    await user.click(
      await screen.findByRole("button", {
        name: /รีเซ็ตรหัสผ่าน Travel Mate/i,
      }),
    );
    await user.click(
      within(
        screen.getByRole("dialog", { name: /รีเซ็ตตัวตน Travel Mate/i }),
      ).getByRole("button", { name: /รีเซ็ตตัวตน/i }),
    );

    expect(confirm).not.toHaveBeenCalled();
    await waitFor(() =>
      expect(
        screen.queryByRole("button", { name: /รีเซ็ตรหัสผ่าน Travel Mate/i }),
      ).not.toBeInTheDocument(),
    );

    confirm.mockRestore();
  });
});
