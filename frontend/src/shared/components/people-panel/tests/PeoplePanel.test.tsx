import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { renderWithI18n } from "@/src/i18n/test-utils";
import { seedTrip } from "@/src/trip/seed";
import { PeoplePanel } from "../PeoplePanel";

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

    expect(screen.getByRole("region", { name: /People and presence/i })).toHaveClass(
      "detail-section",
      "people-module",
      "grid",
      "gap-3",
      "shadow-[0_1px_0_rgb(15_23_42_/_0.04)]",
    );
    expect(screen.getAllByText(/Explorer Friend/i)[0].closest(".person-row")).toHaveClass(
      "person-row",
      "grid",
      "rounded-(--radius-sm)",
      "shadow-[0_1px_0_rgb(15_23_42_/_0.035)]",
    );
    expect(screen.getByLabelText(/Status for Explorer Friend/i)).toHaveClass("member-status-stack", "flex", "flex-wrap");
    expect(screen.getByLabelText(/Role for Explorer Friend/i)).toHaveClass("member-role-select", "min-h-8");
    expect(screen.getByRole("button", { name: /ปิดสิทธิ์ Explorer Friend/i })).toHaveClass("reset-claim-button", "inline-flex");

    await user.selectOptions(screen.getByLabelText(/Role for Explorer Friend/i), "organizer");
    await user.click(screen.getByRole("button", { name: /ปิดสิทธิ์ Explorer Friend/i }));

    expect(onChangeMemberRole).toHaveBeenCalledWith("member-nam", "organizer");
    expect(onChangeMemberAccessStatus).toHaveBeenCalledWith("member-nam", "disabled");
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
});
