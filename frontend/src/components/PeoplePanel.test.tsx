import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { renderWithI18n } from "@/src/i18n/test-utils";
import { PeoplePanel } from "./PeoplePanel";
import { TripMembersPage } from "./TripMembersPage";
import { seedTrip } from "@/src/trip/seed";

const render = (ui: Parameters<typeof renderWithI18n>[0]) => renderWithI18n(ui, { locale: "th" });

describe("PeoplePanel", () => {
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

    await user.selectOptions(screen.getByLabelText(/Role for Explorer Friend/i), "organizer");
    await user.click(screen.getByRole("button", { name: /ปิดสิทธิ์ Explorer Friend/i }));

    expect(onChangeMemberRole).toHaveBeenCalledWith("member-nam", "organizer");
    expect(onChangeMemberAccessStatus).toHaveBeenCalledWith("member-nam", "disabled");
  });

  it("asks for confirmation before disabling participant access", async () => {
    const user = userEvent.setup();
    const onChangeMemberAccessStatus = vi.fn();
    const confirm = vi.spyOn(window, "confirm").mockReturnValue(false);

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

    expect(confirm).toHaveBeenCalledWith(expect.stringContaining("Explorer Friend"));
    expect(onChangeMemberAccessStatus).not.toHaveBeenCalled();

    confirm.mockRestore();
  });

  it("confirms reset, re-enable, and invite copy error paths", async () => {
    const user = userEvent.setup();
    const onResetMemberClaim = vi.fn();
    const onChangeMemberAccessStatus = vi.fn();
    const confirm = vi.spyOn(window, "confirm").mockReturnValue(true);
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
    await user.click(screen.getByRole("button", { name: /เปิดสิทธิ์ Family Member/i }));
    await user.click(screen.getByRole("button", { name: /คัดลอกลิงก์เชิญ/i }));

    expect(confirm).toHaveBeenCalledWith(expect.stringContaining("Explorer Friend"));
    expect(onResetMemberClaim).toHaveBeenCalledWith("member-nam");
    expect(onChangeMemberAccessStatus).toHaveBeenCalledWith("member-family", "active");
    expect(screen.getByText("คัดลอกไม่สำเร็จ")).toBeInTheDocument();

    confirm.mockRestore();
  });

  it("ignores null password prompts and blank new-member submissions", async () => {
    const user = userEvent.setup();
    const onChangeMemberPassword = vi.fn();
    const onCreateMember = vi.fn();
    const prompt = vi.spyOn(window, "prompt").mockReturnValue(null);

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
    await user.click(screen.getByRole("button", { name: /เปิดฟอร์มเพิ่มสมาชิก/i }));
    expect(screen.getByRole("button", { name: /บันทึกสมาชิก/i })).toBeDisabled();

    expect(onChangeMemberPassword).not.toHaveBeenCalled();
    expect(onCreateMember).not.toHaveBeenCalled();

    prompt.mockRestore();
  });

  it("asks the owner for a new password before changing it", async () => {
    const user = userEvent.setup();
    const onChangeMemberPassword = vi.fn();
    const prompt = vi.spyOn(window, "prompt").mockReturnValue("owner-new-pin");

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

    expect(prompt).toHaveBeenCalledWith(expect.stringContaining("Demo Traveler"));
    expect(onChangeMemberPassword).toHaveBeenCalledWith("member-aom", "owner-new-pin");

    prompt.mockRestore();
  });

  it("does not change the owner password when the new password is too short", async () => {
    const user = userEvent.setup();
    const onChangeMemberPassword = vi.fn();
    const prompt = vi.spyOn(window, "prompt").mockReturnValue("123");
    const alert = vi.spyOn(window, "alert").mockImplementation(() => undefined);

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

    expect(alert).toHaveBeenCalledWith(expect.stringContaining("อย่างน้อย 4"));
    expect(onChangeMemberPassword).not.toHaveBeenCalled();

    prompt.mockRestore();
    alert.mockRestore();
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

    expect(screen.queryByLabelText(/Role for Explorer Friend/i)).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /คัดลอกลิงก์เชิญ/i })).toBeDisabled();
    expect(screen.getByRole("button", { name: /เปิดฟอร์มเพิ่มสมาชิก/i })).toBeDisabled();
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
