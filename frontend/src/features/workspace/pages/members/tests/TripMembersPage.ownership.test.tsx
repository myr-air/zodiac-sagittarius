import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { seedTrip } from "@/src/trip/seed";
import { renderMembersPage } from "../testing/support/render-members-page";

describe("TripMembersPage ownership", () => {
  it("lets owners transfer ownership only to active account-linked members", async () => {
    const user = userEvent.setup();
    const confirm = vi.spyOn(window, "confirm");
    const accountLinkedTrip = {
      ...seedTrip,
      members: seedTrip.members.map((member) => {
        if (member.id === "member-nam") return { ...member, userId: "user-nam" };
        if (member.id === "member-family") {
          return { ...member, userId: "user-family", accessStatus: "disabled" as const };
        }
        return member;
      }),
    };
    const props = renderMembersPage({ trip: accountLinkedTrip });

    await user.click(screen.getByRole("button", { name: /โอน owner ให้ Explorer Friend/i }));
    await user.click(
      within(screen.getByRole("dialog", { name: /โอน owner ให้ Explorer Friend/i })).getByRole(
        "button",
        { name: /โอน owner/i },
      ),
    );

    expect(confirm).not.toHaveBeenCalled();
    expect(props.onTransferOwnership).toHaveBeenCalledWith("member-nam");
    expect(
      screen.queryByRole("button", { name: /โอน owner ให้ Family Member/i }),
    ).not.toBeInTheDocument();

    confirm.mockRestore();
  });
});
