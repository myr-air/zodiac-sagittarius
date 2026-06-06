import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { renderWithI18n } from "@/src/i18n/test-utils";
import { PeoplePanel } from "./PeoplePanel";
import { TripMembersPage } from "./TripMembersPage";
import { seedTrip } from "@/src/trip/seed";

const render = (ui: Parameters<typeof renderWithI18n>[0]) => renderWithI18n(ui, { locale: "th" });
const renderEn = (ui: Parameters<typeof renderWithI18n>[0]) => renderWithI18n(ui, { locale: "en" });

describe("PeoplePanel", () => {
  it("localizes standalone panel copy for English", () => {
    renderEn(
      <PeoplePanel
        members={seedTrip.members}
        currentMemberId="member-aom"
        canManagePeople
      />,
    );

    expect(screen.getByRole("region", { name: /People and presence/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /Members and status/i })).toBeInTheDocument();
    expect(screen.getByText("Demo Traveler (You)")).toBeInTheDocument();
    expect(screen.getAllByText("Active").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Pending").length).toBeGreaterThan(0);
    expect(screen.getByRole("button", { name: /Change password Demo Traveler/i })).toBeInTheDocument();
  });

  it("lets organizers reset a claimed participant password", async () => {
    const user = userEvent.setup();
    const onResetMemberClaim = vi.fn();
    const members = seedTrip.members.map((member) =>
      member.id === "member-nam"
        ? { ...member, claimPasswordHash: "local_hash_old", claimedAt: "2026-05-28T00:00:00.000Z" }
        : member,
    );

    render(
      <PeoplePanel
        members={members}
        currentMemberId="member-aom"
        canManagePeople
        onResetMemberClaim={onResetMemberClaim}
      />,
    );

    await user.click(screen.getByRole("button", { name: /รีเซ็ตรหัสผ่าน Explorer Friend/i }));

    expect(onResetMemberClaim).toHaveBeenCalledWith("member-nam");
  });

  it("hides reset password for another member until they join", () => {
    render(
      <PeoplePanel
        members={seedTrip.members}
        currentMemberId="member-aom"
        canManagePeople
      />,
    );

    expect(screen.queryByRole("button", { name: /รีเซ็ตรหัสผ่าน Travel Mate/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /รีเซ็ตรหัสผ่าน Explorer Friend/i })).not.toBeInTheDocument();
  });

  it("lets the owner change their own password", async () => {
    const user = userEvent.setup();
    const onChangeCurrentMemberPassword = vi.fn();

    render(
      <PeoplePanel
        members={seedTrip.members}
        currentMemberId="member-aom"
        canManagePeople
        onChangeCurrentMemberPassword={onChangeCurrentMemberPassword}
      />,
    );

    await user.click(screen.getByRole("button", { name: /เปลี่ยนรหัสผ่าน Demo Traveler/i }));

    expect(onChangeCurrentMemberPassword).toHaveBeenCalledWith("member-aom");
  });

  it("lets organizers change roles and disable participant access", async () => {
    const user = userEvent.setup();
    const onChangeMemberRole = vi.fn();
    const onChangeMemberAccessStatus = vi.fn();

    render(
      <PeoplePanel
        members={seedTrip.members}
        currentMemberId="member-aom"
        canManagePeople
        onChangeMemberAccessStatus={onChangeMemberAccessStatus}
        onChangeMemberRole={onChangeMemberRole}
      />,
    );

    expect(screen.getByRole("region", { name: /People and presence/i })).toHaveClass("detail-section", "people-module", "grid", "gap-3");
    expect(screen.getAllByText(/Explorer Friend/i)[0].closest(".person-row")).toHaveClass(
      "person-row",
      "grid",
      "rounded-(--radius-sm)",
    );
    expect(screen.getByLabelText(/Status for Explorer Friend/i)).toHaveClass("member-status-stack", "flex", "flex-wrap");
    expect(screen.getByLabelText(/Role for Explorer Friend/i)).toHaveClass("member-role-select", "min-h-8");
    expect(screen.getByRole("button", { name: /ปิดสิทธิ์ Explorer Friend/i })).toHaveClass("reset-claim-button", "inline-flex");

    await user.selectOptions(screen.getByLabelText(/Role for Explorer Friend/i), "organizer");
    await user.click(screen.getByRole("button", { name: /ปิดสิทธิ์ Explorer Friend/i }));

    expect(onChangeMemberRole).toHaveBeenCalledWith("member-nam", "organizer");
    expect(onChangeMemberAccessStatus).toHaveBeenCalledWith("member-nam", "disabled");
  });

  it("asks for confirmation before disabling participant access", async () => {
    const user = userEvent.setup();
    const onChangeMemberAccessStatus = vi.fn();

    render(
      <TripMembersPage
        trip={seedTrip}
        currentMember={seedTrip.members[0]}
        canManagePeople
        onChangeMemberAccessStatus={onChangeMemberAccessStatus}
        onChangeMemberRole={vi.fn()}
        onCreateMember={vi.fn()}
        onChangeMemberPassword={vi.fn()}
        onResetMemberClaim={vi.fn()}
      />,
    );

    await user.click(screen.getByRole("button", { name: /ปิดสิทธิ์ Explorer Friend/i }));

    expect(screen.getByRole("dialog", { name: /ปิดสิทธิ์ Explorer Friend/i })).toBeInTheDocument();
    expect(onChangeMemberAccessStatus).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: /ยกเลิก/i }));
    expect(onChangeMemberAccessStatus).not.toHaveBeenCalled();
  });

  it("confirms reset, re-enable, and invite copy error paths", async () => {
    const user = userEvent.setup();
    const onResetMemberClaim = vi.fn();
    const onChangeMemberAccessStatus = vi.fn();
    const writeText = vi.fn().mockRejectedValue(new Error("denied"));
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText },
    });
    const trip = {
      ...seedTrip,
      members: seedTrip.members.map((member) => {
        if (member.id === "member-nam") return { ...member, claimPasswordHash: "local_hash_old", claimedAt: "2026-05-28T00:00:00.000Z" };
        if (member.id === "member-family") return { ...member, accessStatus: "disabled" as const };
        return member;
      }),
    };

    render(
      <TripMembersPage
        trip={trip}
        currentMember={trip.members[0]}
        canManagePeople
        onChangeMemberAccessStatus={onChangeMemberAccessStatus}
        onChangeMemberPassword={vi.fn()}
        onChangeMemberRole={vi.fn()}
        onCreateMember={vi.fn()}
        onResetMemberClaim={onResetMemberClaim}
      />,
    );

    await user.click(screen.getByRole("button", { name: /รีเซ็ตรหัสผ่าน Explorer Friend/i }));
    await user.click(within(screen.getByRole("dialog", { name: /รีเซ็ตตัวตน Explorer Friend/i })).getByRole("button", { name: /รีเซ็ตตัวตน/i }));
    await user.click(screen.getByRole("button", { name: /เปิดสิทธิ์ Family Member/i }));
    await user.click(within(screen.getByRole("dialog", { name: /เปิดสิทธิ์ Family Member/i })).getByRole("button", { name: /ยืนยัน/i }));
    await user.click(screen.getByRole("button", { name: /คัดลอกลิงก์เชิญ/i }));

    expect(onResetMemberClaim).toHaveBeenCalledWith("member-nam");
    expect(onChangeMemberAccessStatus).toHaveBeenCalledWith("member-family", "active");
    expect(screen.getByText("คัดลอกไม่สำเร็จ")).toBeInTheDocument();
  });

  it("ignores canceled password dialogs and blank new-member submissions", async () => {
    const user = userEvent.setup();
    const onChangeMemberPassword = vi.fn();
    const onCreateMember = vi.fn();

    render(
      <TripMembersPage
        trip={seedTrip}
        currentMember={seedTrip.members[0]}
        canManagePeople
        onChangeMemberAccessStatus={vi.fn()}
        onChangeMemberPassword={onChangeMemberPassword}
        onChangeMemberRole={vi.fn()}
        onCreateMember={onCreateMember}
        onResetMemberClaim={vi.fn()}
      />,
    );

    await user.click(screen.getByRole("button", { name: /เปลี่ยนรหัสผ่าน Demo Traveler/i }));
    await user.click(screen.getByRole("button", { name: /ยกเลิก/i }));
    await user.click(screen.getByRole("button", { name: /เปิดฟอร์มเพิ่มสมาชิก/i }));
    expect(screen.getByRole("button", { name: /บันทึกสมาชิก/i })).toBeDisabled();

    expect(onChangeMemberPassword).not.toHaveBeenCalled();
    expect(onCreateMember).not.toHaveBeenCalled();
  });

  it("asks the owner for a new password before changing it", async () => {
    const user = userEvent.setup();
    const onChangeMemberPassword = vi.fn();

    render(
      <TripMembersPage
        trip={seedTrip}
        currentMember={seedTrip.members[0]}
        canManagePeople
        onChangeMemberAccessStatus={vi.fn()}
        onChangeMemberPassword={onChangeMemberPassword}
        onChangeMemberRole={vi.fn()}
        onCreateMember={vi.fn()}
        onResetMemberClaim={vi.fn()}
      />,
    );

    await user.click(screen.getByRole("button", { name: /เปลี่ยนรหัสผ่าน Demo Traveler/i }));
    const passwordDialog = screen.getByRole("dialog", { name: /เปลี่ยนรหัสผ่าน Demo Traveler/i });
    await user.type(within(passwordDialog).getByLabelText(/รหัสผ่านใหม่/i), "owner-new-pin");
    await user.click(within(passwordDialog).getByRole("button", { name: /บันทึกรหัสผ่าน/i }));

    expect(onChangeMemberPassword).toHaveBeenCalledWith("member-aom", "owner-new-pin");
  });

  it("does not change the owner password when the new password is too short", async () => {
    const user = userEvent.setup();
    const onChangeMemberPassword = vi.fn();

    render(
      <TripMembersPage
        trip={seedTrip}
        currentMember={seedTrip.members[0]}
        canManagePeople
        onChangeMemberAccessStatus={vi.fn()}
        onChangeMemberPassword={onChangeMemberPassword}
        onChangeMemberRole={vi.fn()}
        onCreateMember={vi.fn()}
        onResetMemberClaim={vi.fn()}
      />,
    );

    await user.click(screen.getByRole("button", { name: /เปลี่ยนรหัสผ่าน Demo Traveler/i }));
    const passwordDialog = screen.getByRole("dialog", { name: /เปลี่ยนรหัสผ่าน Demo Traveler/i });
    await user.type(within(passwordDialog).getByLabelText(/รหัสผ่านใหม่/i), "123");
    await user.click(within(passwordDialog).getByRole("button", { name: /บันทึกรหัสผ่าน/i }));

    expect(within(passwordDialog).getByRole("alert")).toHaveTextContent("รหัสผ่านต้องมีอย่างน้อย 4 ตัวอักษร");
    expect(onChangeMemberPassword).not.toHaveBeenCalled();
  });

  it("shows a read-only command center for non-managers", () => {
    render(
      <TripMembersPage
        trip={seedTrip}
        currentMember={seedTrip.members[2]}
        canManagePeople={false}
        onChangeMemberAccessStatus={vi.fn()}
        onChangeMemberPassword={vi.fn()}
        onChangeMemberRole={vi.fn()}
        onCreateMember={vi.fn()}
        onResetMemberClaim={vi.fn()}
      />,
    );

    expect(screen.getByText(/ออฟไลน์ 1 ชม./i)).toHaveClass("presence-pill", "inline-flex", "whitespace-nowrap");
    expect(screen.queryByLabelText(/Role for Explorer Friend/i)).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /คัดลอกลิงก์เชิญ/i })).toBeDisabled();
    expect(screen.getByRole("button", { name: /เปิดฟอร์มเพิ่มสมาชิก/i })).toBeDisabled();
  });

  it("bridges the empty member state to Tailwind classes", () => {
    render(
      <PeoplePanel
        members={[]}
        currentMemberId="member-aom"
        emptyMessage="ไม่มีสมาชิกในตัวกรองนี้"
        onResetFilters={vi.fn()}
      />,
    );

    expect(screen.getByText("ไม่มีสมาชิกในตัวกรองนี้").closest(".members-empty-state")).toHaveClass(
      "members-empty-state",
      "grid",
      "rounded-(--radius-md)",
    );
    expect(screen.getByRole("button", { name: /ล้างตัวกรอง/i })).toHaveClass("reset-claim-button", "inline-flex");
  });

  it("lets organizers create a new trip member", async () => {
    const user = userEvent.setup();
    const onCreateMember = vi.fn();

    render(
      <TripMembersPage
        trip={seedTrip}
        currentMember={seedTrip.members[0]}
        canManagePeople
        onChangeMemberAccessStatus={vi.fn()}
        onChangeMemberPassword={vi.fn()}
        onChangeMemberRole={vi.fn()}
        onCreateMember={onCreateMember}
        onResetMemberClaim={vi.fn()}
      />,
    );

    await user.click(screen.getByRole("button", { name: /เปิดฟอร์มเพิ่มสมาชิก/i }));
    await user.type(screen.getByLabelText(/ชื่อสมาชิกใหม่/i), "New Cousin");
    await user.selectOptions(screen.getByLabelText(/สิทธิ์สมาชิกใหม่/i), "viewer");
    await user.click(screen.getByRole("button", { name: /บันทึกสมาชิก/i }));

    expect(onCreateMember).toHaveBeenCalledWith({ displayName: "New Cousin", role: "viewer" });
  });
});
