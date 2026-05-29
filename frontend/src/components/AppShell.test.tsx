import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { seedTrip } from "@/src/trip/seed";
import { AppShell } from "./AppShell";

describe("AppShell", () => {
  it("labels traveler and viewer roles and exposes leave-session action", async () => {
    const user = userEvent.setup();
    const onLeaveParticipantSession = vi.fn();
    const { rerender } = render(
      <AppShell
        activeView="overview"
        collapsed={false}
        currentMember={seedTrip.members.find((member) => member.role === "traveler")!}
        onLeaveParticipantSession={onLeaveParticipantSession}
        onToggleCollapsed={vi.fn()}
        trip={seedTrip}
      >
        <main>content</main>
      </AppShell>,
    );

    const memberCard = screen.getByText("Explorer Friend").closest(".member-card") as HTMLElement;
    expect(within(memberCard).getByText("ผู้ร่วมเดินทาง")).toBeInTheDocument();
    await user.click(within(memberCard).getByRole("button", { name: "เปลี่ยนตัวตน" }));
    expect(onLeaveParticipantSession).toHaveBeenCalled();

    rerender(
      <AppShell
        activeView="members"
        collapsed
        currentMember={seedTrip.members.find((member) => member.role === "viewer")!}
        onToggleCollapsed={vi.fn()}
        trip={seedTrip}
      >
        <main>content</main>
      </AppShell>,
    );

    expect(screen.getByText("Family Member").closest(".member-card")).toHaveTextContent("ผู้ชม");
    expect(screen.getByRole("button", { name: "Expand navigation" })).toBeInTheDocument();
  });

  it("labels organizer members", () => {
    render(
      <AppShell
        activeView="overview"
        collapsed={false}
        currentMember={seedTrip.members.find((member) => member.role === "organizer")!}
        onToggleCollapsed={vi.fn()}
        trip={seedTrip}
      >
        <main>content</main>
      </AppShell>,
    );

    expect(screen.getByText("Travel Mate").closest(".member-card")).toHaveTextContent("ผู้จัดทริป");
  });
});
