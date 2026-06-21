import { fireEvent, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { seedTrip } from "@/src/trip/seed";
import { renderMembersPage } from "../testing/support/render-members-page";

describe("TripMembersPage management", () => {
  it("handles successful member-management actions", async () => {
    const user = userEvent.setup();
    const confirm = vi.spyOn(window, "confirm");
    const prompt = vi.spyOn(window, "prompt");
    const alert = vi.spyOn(window, "alert");
    const claimedTrip = {
      ...seedTrip,
      members: seedTrip.members.map((member) =>
        member.id === "member-beam" ? { ...member, claimPasswordHash: "hash" } : member,
      ),
    };
    const props = renderMembersPage({ trip: claimedTrip });

    expect(screen.getByRole("region", { name: /สมาชิกทริป/i })).toHaveClass(
      "members-page",
      "grid",
      "gap-3",
    );
    expect(screen.getByRole("region", { name: /สรุปสมาชิก/i })).toHaveClass(
      "member-stat-grid",
      "grid",
      "gap-3",
    );
    expect(screen.getAllByText(/สมาชิกทั้งหมด/i)[0].closest(".member-stat")).toHaveClass(
      "member-stat",
      "grid",
      "rounded-(--radius-md)",
      "shadow-[0_1px_0_rgb(15_23_42_/_0.04)]",
    );
    expect(
      screen.getAllByText(/สมาชิกทั้งหมด/i)[0].closest(".member-stat")?.className,
    ).not.toContain("0_10px_24px");
    expect(screen.getByRole("region", { name: /แถบคำสั่งสมาชิก/i })).toHaveClass(
      "member-command-bar",
      "grid",
      "gap-3",
    );
    expect(screen.getByRole("region", { name: /แถบคำสั่งสมาชิก/i })).toHaveClass(
      "shadow-[0_1px_0_rgb(15_23_42_/_0.04)]",
    );

    fireEvent.click(screen.getByRole("button", { name: /รีเซ็ตรหัสผ่าน Travel Mate/i }));
    await user.click(screen.getByRole("button", { name: /รีเซ็ตตัวตน/i }));
    expect(props.onResetMemberClaim).toHaveBeenCalledWith("member-beam");

    fireEvent.click(screen.getByRole("button", { name: /ปิดสิทธิ์ Explorer Friend/i }));
    await user.click(screen.getByRole("button", { name: /ยืนยัน/i }));
    expect(props.onChangeMemberAccessStatus).toHaveBeenCalledWith("member-nam", "disabled");

    fireEvent.click(screen.getByRole("button", { name: /เปลี่ยนรหัสผ่าน Demo Traveler/i }));
    const passwordDialog = screen.getByRole("dialog", {
      name: /เปลี่ยนรหัสผ่าน Demo Traveler/i,
    });
    await user.type(within(passwordDialog).getByLabelText(/รหัสผ่านใหม่/i), "fresh-pin");
    await user.click(within(passwordDialog).getByRole("button", { name: /บันทึกรหัสผ่าน/i }));
    expect(props.onChangeMemberPassword).toHaveBeenCalledWith("member-aom", "fresh-pin");
    expect(confirm).not.toHaveBeenCalled();
    expect(prompt).not.toHaveBeenCalled();
    expect(alert).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: /เปิดฟอร์มเพิ่มสมาชิก/i }));
    expect(screen.getByRole("region", { name: /เพิ่มสมาชิก/i })).toHaveClass(
      "member-create-panel",
      "grid",
      "rounded-(--radius-lg)",
    );
    expect(screen.getByRole("region", { name: /เพิ่มสมาชิก/i })).toHaveClass(
      "shadow-[0_1px_0_rgb(15_23_42_/_0.04)]",
    );
    expect(screen.getByLabelText(/ชื่อสมาชิกใหม่/i).closest("form")).toHaveClass(
      "member-create-form",
      "grid",
      "gap-3",
    );
    fireEvent.change(screen.getByLabelText(/ชื่อสมาชิกใหม่/i), {
      target: { value: "Guide" },
    });
    fireEvent.change(screen.getByLabelText(/สิทธิ์สมาชิกใหม่/i), {
      target: { value: "organizer" },
    });
    fireEvent.click(screen.getByRole("button", { name: /บันทึกสมาชิก/i }));
    expect(props.onCreateMember).toHaveBeenCalledWith({
      displayName: "Guide",
      role: "organizer",
    });

    prompt.mockRestore();
    confirm.mockRestore();
    alert.mockRestore();
  }, 30_000);

  it("keeps destructive and password prompts cancelable", async () => {
    const user = userEvent.setup();
    const confirm = vi.spyOn(window, "confirm");
    const prompt = vi.spyOn(window, "prompt");
    const alert = vi.spyOn(window, "alert");
    const props = renderMembersPage();

    await user.click(screen.getByRole("button", { name: /ปิดสิทธิ์ Explorer Friend/i }));
    await user.click(screen.getByRole("button", { name: /ยกเลิก/i }));
    expect(props.onChangeMemberAccessStatus).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: /เปลี่ยนรหัสผ่าน Demo Traveler/i }));
    await user.click(screen.getByRole("button", { name: /ยกเลิก/i }));
    await user.click(screen.getByRole("button", { name: /เปลี่ยนรหัสผ่าน Demo Traveler/i }));
    const passwordDialog = screen.getByRole("dialog", {
      name: /เปลี่ยนรหัสผ่าน Demo Traveler/i,
    });
    expect(passwordDialog).toHaveClass(
      "member-task-dialog",
      "shadow-[0_10px_18px_rgb(15_23_42_/_0.14)]",
    );
    expect(passwordDialog.className).not.toContain("0_24px_70px");
    expect(passwordDialog.className).not.toContain("0_14px_34px");
    await user.type(within(passwordDialog).getByLabelText(/รหัสผ่านใหม่/i), "123");
    await user.click(within(passwordDialog).getByRole("button", { name: /บันทึกรหัสผ่าน/i }));
    expect(within(passwordDialog).getByRole("alert")).toHaveTextContent(
      "รหัสผ่านต้องมีอย่างน้อย 4 ตัวอักษร",
    );
    expect(props.onChangeMemberPassword).not.toHaveBeenCalled();
    expect(confirm).not.toHaveBeenCalled();
    expect(prompt).not.toHaveBeenCalled();
    expect(alert).not.toHaveBeenCalled();

    prompt.mockRestore();
    confirm.mockRestore();
    alert.mockRestore();
  });
});
