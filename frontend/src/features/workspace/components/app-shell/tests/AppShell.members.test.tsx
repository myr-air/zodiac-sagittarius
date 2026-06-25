import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { appRoutes } from "@/src/routes/app-routes";
import { getTripFixtureMember } from "@/src/trip/testing/fixtures/trip-fixtures";
import { renderAppShell } from "../testing/support/render-app-shell";

describe("AppShell members", () => {
  it("labels traveler and viewer roles and exposes leave-session action", async () => {
    const user = userEvent.setup();
    const onLeaveParticipantSession = vi.fn();
    const { unmount } = renderAppShell({
      currentMember: getTripFixtureMember("traveler"),
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
      currentMember: getTripFixtureMember("viewer"),
    });

    await screen.findByText("ผู้ชม");
    expect(screen.getByText("Family Member").closest(".member-card")).toHaveTextContent("ผู้ชม");
    expect(screen.getByRole("button", { name: "ขยายเมนู" })).toHaveClass("rail-toggle", "inline-flex", "rounded-full");
  });

  it("labels organizer members", async () => {
    renderAppShell({
      currentMember: getTripFixtureMember("organizer"),
    });

    await screen.findByText("ผู้จัดทริป");
    expect(screen.getByText("Travel Mate").closest(".member-card")).toHaveTextContent("ผู้จัดทริป");
  });

  it("adds account portal navigation to the identity card when an account session is available", async () => {
    const owner = getTripFixtureMember("owner");
    renderAppShell({
      accountPortalHref: appRoutes.portalMyTrips(),
      currentMember: owner,
    });

    const memberCard = screen.getByText(owner.displayName).closest(".member-card") as HTMLElement;
    expect(within(memberCard).getByRole("link", { name: /ทริปของฉัน/i })).toHaveAttribute(
      "href",
      appRoutes.portalMyTrips(),
    );
  });

  it("does not show account portal navigation for a trip-only session", async () => {
    const owner = getTripFixtureMember("owner");
    renderAppShell({
      currentMember: owner,
    });

    const memberCard = screen.getByText(owner.displayName).closest(".member-card") as HTMLElement;
    expect(within(memberCard).queryByRole("link", { name: /ทริปของฉัน/i })).not.toBeInTheDocument();
  });
});
