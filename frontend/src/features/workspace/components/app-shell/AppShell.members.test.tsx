import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { seedTrip } from "@/src/trip/seed";
import { renderAppShell } from "./AppShell.test-support";

describe("AppShell members", () => {
  it("labels traveler and viewer roles and exposes leave-session action", async () => {
    const user = userEvent.setup();
    const onLeaveParticipantSession = vi.fn();
    const { unmount } = renderAppShell({
      currentMember: seedTrip.members.find((member) => member.role === "traveler")!,
      onLeaveParticipantSession,
    });

    await screen.findByText("ผู้ร่วมเดินทาง");
    const memberCard = screen.getByText("Explorer Friend").closest(".member-card") as HTMLElement;
    expect(within(memberCard).getByText("ผู้ร่วมเดินทาง")).toBeInTheDocument();
    const confirm = vi.spyOn(window, "confirm");
    await user.click(within(memberCard).getByRole("button", { name: "เปลี่ยนตัวตน" }));
    const dialog = screen.getByRole("dialog", { name: /เปลี่ยนตัวตน/i });
    expect(dialog).toHaveTextContent("Explorer Friend");
    expect(dialog).toHaveClass(
      "identity-switch-dialog",
      "shadow-[0_14px_34px_rgb(15_23_42_/_0.16)]",
    );
    expect(dialog.className).not.toContain("0_24px_70px");
    await user.click(within(dialog).getByRole("button", { name: /เปลี่ยนตัวตน/i }));
    expect(confirm).not.toHaveBeenCalled();
    expect(onLeaveParticipantSession).toHaveBeenCalled();

    unmount();
    renderAppShell({
      activeView: "members",
      collapsed: true,
      currentMember: seedTrip.members.find((member) => member.role === "viewer")!,
    });

    await screen.findByText("ผู้ชม");
    expect(screen.getByText("Family Member").closest(".member-card")).toHaveTextContent("ผู้ชม");
    expect(screen.getByRole("button", { name: "ขยายเมนู" })).toHaveClass("rail-toggle", "inline-flex", "rounded-full");
  });

  it("labels organizer members", async () => {
    renderAppShell({
      currentMember: seedTrip.members.find((member) => member.role === "organizer")!,
    });

    await screen.findByText("ผู้จัดทริป");
    expect(screen.getByText("Travel Mate").closest(".member-card")).toHaveTextContent("ผู้จัดทริป");
  });
});
