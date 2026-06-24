import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { enMessages } from "@/src/i18n/messages/en";
import { thMessages } from "@/src/i18n/messages/th";
import { seedTrip } from "@/src/trip/seed";
import { peoplePanelCopy } from "../people-panel.copy";
import { PeoplePanelRowControls } from "../PeoplePanelRowControls";

const organizer = seedTrip.members.find((member) => member.id === "member-nam")!;
const owner = seedTrip.members.find((member) => member.id === "member-aom")!;

describe("PeoplePanelRowControls", () => {
  it("routes role, access, password, and ownership actions for a managed member", async () => {
    const user = userEvent.setup();
    const onChangeMemberRole = vi.fn();
    const onChangeMemberAccessStatus = vi.fn();
    const onResetMemberClaim = vi.fn();
    const onTransferOwnership = vi.fn();
    render(
      <PeoplePanelRowControls
        canChangePassword
        canTransferOwner
        copy={peoplePanelCopy("en")}
        currentMemberId="member-aom"
        member={{ ...organizer, claimPasswordHash: "local_hash", userId: "user-nam" }}
        onChangeMemberAccessStatus={onChangeMemberAccessStatus}
        onChangeMemberRole={onChangeMemberRole}
        onResetMemberClaim={onResetMemberClaim}
        onTransferOwnership={onTransferOwnership}
        roleLabels={enMessages.appShell.roles}
      />,
    );

    await user.selectOptions(screen.getByLabelText(/Role for Explorer Friend/i), "viewer");
    await user.click(screen.getByRole("button", { name: /Reset password Explorer Friend/i }));
    await user.click(screen.getByRole("button", { name: /Disable Explorer Friend/i }));
    await user.click(screen.getByRole("button", { name: /Transfer owner to Explorer Friend/i }));

    expect(onChangeMemberRole).toHaveBeenCalledWith("member-nam", "viewer");
    expect(onResetMemberClaim).toHaveBeenCalledWith("member-nam");
    expect(onChangeMemberAccessStatus).toHaveBeenCalledWith("member-nam", "disabled");
    expect(onTransferOwnership).toHaveBeenCalledWith("member-nam");
  });

  it("routes current owner password changes without role or access controls", async () => {
    const user = userEvent.setup();
    const onChangeCurrentMemberPassword = vi.fn();
    render(
      <PeoplePanelRowControls
        canChangePassword
        canTransferOwner={false}
        copy={peoplePanelCopy("th")}
        currentMemberId="member-aom"
        member={owner}
        onChangeCurrentMemberPassword={onChangeCurrentMemberPassword}
        roleLabels={thMessages.appShell.roles}
      />,
    );

    await user.click(screen.getByRole("button", { name: /เปลี่ยนรหัสผ่าน Demo Traveler/i }));

    expect(onChangeCurrentMemberPassword).toHaveBeenCalledWith("member-aom");
    expect(screen.queryByLabelText(/Role for Demo Traveler/i)).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /ปิดสิทธิ์ Demo Traveler/i })).not.toBeInTheDocument();
  });
});
