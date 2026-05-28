import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { PeoplePanel } from "./PeoplePanel";
import { seedTrip } from "@/src/trip/seed";

describe("PeoplePanel", () => {
  it("lets organizers reset a claimed participant identity", async () => {
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

    await user.click(screen.getByRole("button", { name: /รีเซ็ตรหัส/i }));

    expect(onResetMemberClaim).toHaveBeenCalledWith("member-nam");
  });
});
