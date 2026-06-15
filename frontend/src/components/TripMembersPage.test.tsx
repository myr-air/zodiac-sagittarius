import { act, fireEvent, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { renderWithI18n } from "@/src/i18n/test-utils";
import { seedTrip } from "@/src/trip/seed";
import { TripMembersPage } from "./TripMembersPage";

function renderMembers(overrides: Partial<Parameters<typeof TripMembersPage>[0]> = {}) {
  const props: Parameters<typeof TripMembersPage>[0] = {
    trip: seedTrip,
    currentMember: seedTrip.members[0],
    canManagePeople: true,
    onChangeMemberAccessStatus: vi.fn(),
    onChangeMemberPassword: vi.fn(),
    onChangeMemberRole: vi.fn(),
    onCreateMember: vi.fn(),
    onResetMemberClaim: vi.fn(),
    onTransferOwnership: vi.fn(),
    ...overrides,
  };
  renderWithI18n(<TripMembersPage {...props} />, { locale: "th" });
  return props;
}

describe("TripMembersPage", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("handles successful member-management actions", async () => {
    const user = userEvent.setup();
    const writeText = vi.fn().mockResolvedValue(undefined);
    const confirm = vi.spyOn(window, "confirm");
    const prompt = vi.spyOn(window, "prompt");
    const alert = vi.spyOn(window, "alert");
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText },
    });
    const claimedTrip = {
      ...seedTrip,
      members: seedTrip.members.map((member) => member.id === "member-beam" ? { ...member, claimPasswordHash: "hash" } : member),
    };
    const props = renderMembers({ trip: claimedTrip });

    expect(screen.getByRole("region", { name: /สมาชิกทริป/i })).toHaveClass("members-page", "grid", "gap-3");
    expect(screen.getByRole("region", { name: /สรุปสมาชิก/i })).toHaveClass("member-stat-grid", "grid", "gap-3");
    expect(screen.getAllByText(/สมาชิกทั้งหมด/i)[0].closest(".member-stat")).toHaveClass(
      "member-stat",
      "grid",
      "rounded-(--radius-md)",
      "shadow-[0_1px_0_rgb(15_23_42_/_0.04)]",
    );
    expect(screen.getAllByText(/สมาชิกทั้งหมด/i)[0].closest(".member-stat")?.className).not.toContain("0_10px_24px");
    expect(screen.getByRole("region", { name: /แถบคำสั่งสมาชิก/i })).toHaveClass("member-command-bar", "grid", "gap-3");
    expect(screen.getByRole("region", { name: /แถบคำสั่งสมาชิก/i })).toHaveClass("shadow-[0_1px_0_rgb(15_23_42_/_0.04)]");

    fireEvent.click(screen.getByRole("button", { name: /คัดลอกลิงก์เชิญ/i }));
    await act(async () => {
      await Promise.resolve();
    });
    expect(writeText).toHaveBeenCalledWith(expect.stringContaining("/join/HK-SZ-2025"));
    expect(screen.getByRole("status")).toHaveTextContent("คัดลอกแล้ว");

    fireEvent.click(screen.getByRole("button", { name: /รีเซ็ตรหัสผ่าน Travel Mate/i }));
    await user.click(screen.getByRole("button", { name: /รีเซ็ตตัวตน/i }));
    expect(props.onResetMemberClaim).toHaveBeenCalledWith("member-beam");

    fireEvent.click(screen.getByRole("button", { name: /ปิดสิทธิ์ Explorer Friend/i }));
    await user.click(screen.getByRole("button", { name: /ยืนยัน/i }));
    expect(props.onChangeMemberAccessStatus).toHaveBeenCalledWith("member-nam", "disabled");

    fireEvent.click(screen.getByRole("button", { name: /เปลี่ยนรหัสผ่าน Demo Traveler/i }));
    const passwordDialog = screen.getByRole("dialog", { name: /เปลี่ยนรหัสผ่าน Demo Traveler/i });
    await user.type(within(passwordDialog).getByLabelText(/รหัสผ่านใหม่/i), "fresh-pin");
    await user.click(within(passwordDialog).getByRole("button", { name: /บันทึกรหัสผ่าน/i }));
    expect(props.onChangeMemberPassword).toHaveBeenCalledWith("member-aom", "fresh-pin");
    expect(confirm).not.toHaveBeenCalled();
    expect(prompt).not.toHaveBeenCalled();
    expect(alert).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: /เปิดฟอร์มเพิ่มสมาชิก/i }));
    expect(screen.getByRole("region", { name: /เพิ่มสมาชิก/i })).toHaveClass("member-create-panel", "grid", "rounded-(--radius-lg)");
    expect(screen.getByRole("region", { name: /เพิ่มสมาชิก/i })).toHaveClass("shadow-[0_1px_0_rgb(15_23_42_/_0.04)]");
    expect(screen.getByLabelText(/ชื่อสมาชิกใหม่/i).closest("form")).toHaveClass("member-create-form", "grid", "gap-3");
    fireEvent.change(screen.getByLabelText(/ชื่อสมาชิกใหม่/i), { target: { value: "Guide" } });
    fireEvent.change(screen.getByLabelText(/สิทธิ์สมาชิกใหม่/i), { target: { value: "organizer" } });
    fireEvent.click(screen.getByRole("button", { name: /บันทึกสมาชิก/i }));
    expect(props.onCreateMember).toHaveBeenCalledWith({ displayName: "Guide", role: "organizer" });

    prompt.mockRestore();
    confirm.mockRestore();
    alert.mockRestore();
  }, 30_000);

  it("lets owners transfer ownership only to active account-linked members", async () => {
    const user = userEvent.setup();
    const confirm = vi.spyOn(window, "confirm");
    const accountLinkedTrip = {
      ...seedTrip,
      members: seedTrip.members.map((member) => {
        if (member.id === "member-nam") return { ...member, userId: "user-nam" };
        if (member.id === "member-family") return { ...member, userId: "user-family", accessStatus: "disabled" as const };
        return member;
      }),
    };
    const props = renderMembers({ trip: accountLinkedTrip });

    await user.click(screen.getByRole("button", { name: /โอน owner ให้ Explorer Friend/i }));
    await user.click(within(screen.getByRole("dialog", { name: /โอน owner ให้ Explorer Friend/i })).getByRole("button", { name: /โอน owner/i }));

    expect(confirm).not.toHaveBeenCalled();
    expect(props.onTransferOwnership).toHaveBeenCalledWith("member-nam");
    expect(screen.queryByRole("button", { name: /โอน owner ให้ Family Member/i })).not.toBeInTheDocument();

    confirm.mockRestore();
  });

  it("handles invite copy failures and cancelable member prompts", async () => {
    const user = userEvent.setup();
    const writeText = vi.fn().mockRejectedValue(new Error("clipboard unavailable"));
    const confirm = vi.spyOn(window, "confirm");
    const prompt = vi.spyOn(window, "prompt");
    const alert = vi.spyOn(window, "alert");
    const props = renderMembers();
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText },
    });

    await user.click(screen.getByRole("button", { name: /คัดลอกลิงก์เชิญ/i }));
    expect(screen.getByRole("status")).toHaveTextContent("คัดลอกไม่สำเร็จ");

    await user.click(screen.getByRole("button", { name: /ปิดสิทธิ์ Explorer Friend/i }));
    await user.click(screen.getByRole("button", { name: /ยกเลิก/i }));
    expect(props.onChangeMemberAccessStatus).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: /เปลี่ยนรหัสผ่าน Demo Traveler/i }));
    await user.click(screen.getByRole("button", { name: /ยกเลิก/i }));
    await user.click(screen.getByRole("button", { name: /เปลี่ยนรหัสผ่าน Demo Traveler/i }));
    const passwordDialog = screen.getByRole("dialog", { name: /เปลี่ยนรหัสผ่าน Demo Traveler/i });
    expect(passwordDialog).toHaveClass(
      "member-task-dialog",
      "shadow-[0_10px_18px_rgb(15_23_42_/_0.14)]",
    );
    expect(passwordDialog.className).not.toContain("0_24px_70px");
    expect(passwordDialog.className).not.toContain("0_14px_34px");
    await user.type(within(passwordDialog).getByLabelText(/รหัสผ่านใหม่/i), "123");
    await user.click(within(passwordDialog).getByRole("button", { name: /บันทึกรหัสผ่าน/i }));
    expect(within(passwordDialog).getByRole("alert")).toHaveTextContent("รหัสผ่านต้องมีอย่างน้อย 4 ตัวอักษร");
    expect(props.onChangeMemberPassword).not.toHaveBeenCalled();
    expect(confirm).not.toHaveBeenCalled();
    expect(prompt).not.toHaveBeenCalled();
    expect(alert).not.toHaveBeenCalled();

    prompt.mockRestore();
    confirm.mockRestore();
    alert.mockRestore();
  });

  it("resets filters and ignores empty member submissions", async () => {
    const user = userEvent.setup();
    const props = renderMembers();

    await user.type(screen.getByLabelText(/ค้นหาสมาชิก/i), "Family");
    await user.selectOptions(screen.getByLabelText(/^สถานะ$/i), "disabled");
    expect(screen.getByText(/ไม่พบสมาชิกที่ตรงกับตัวกรอง/i)).toBeInTheDocument();

    await user.selectOptions(screen.getByLabelText(/^สิทธิ์$/i), "viewer");
    expect(screen.getByText(/ไม่พบสมาชิกที่ตรงกับตัวกรอง/i)).toBeInTheDocument();

    await user.clear(screen.getByLabelText(/ค้นหาสมาชิก/i));
    await user.selectOptions(screen.getByLabelText(/^สิทธิ์$/i), "all");
    await user.selectOptions(screen.getByLabelText(/^สถานะ$/i), "claimed");
    expect(screen.getByText(/Demo Traveler/i)).toBeInTheDocument();

    await user.selectOptions(screen.getByLabelText(/^สถานะ$/i), "pending");
    expect(screen.getAllByText(/Family Member/i).length).toBeGreaterThan(0);

    await user.click(screen.getAllByRole("button", { name: /ล้างตัวกรอง/i })[0]);
    expect(screen.getAllByText(/Family Member/i).length).toBeGreaterThan(0);

    await user.click(screen.getByRole("button", { name: /เปิดฟอร์มเพิ่มสมาชิก/i }));
    fireEvent.submit(screen.getByLabelText(/ชื่อสมาชิกใหม่/i).closest("form")!);

    expect(props.onCreateMember).not.toHaveBeenCalled();
  });

  it("renders read-only member controls without management actions", () => {
    const props = renderMembers({ canManagePeople: false });

    expect(screen.queryByRole("button", { name: /คัดลอกลิงก์เชิญ/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /เปิดฟอร์มเพิ่มสมาชิก/i })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /ล้างตัวกรอง/i })).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("อ่านอย่างเดียว");
    expect(props.onCreateMember).not.toHaveBeenCalled();
  });

  it("resets invite copy feedback after a short confirmation window", async () => {
    vi.useFakeTimers();
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText: vi.fn().mockResolvedValue(undefined) },
    });
    renderMembers();

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
