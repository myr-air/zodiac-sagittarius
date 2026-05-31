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
    const confirm = vi.spyOn(window, "confirm").mockReturnValue(true);
    await user.click(within(memberCard).getByRole("button", { name: "เปลี่ยนตัวตน" }));
    expect(confirm).toHaveBeenCalledWith(expect.stringContaining("Explorer Friend"));
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

  it("links workspace navigation to the active trip route scope", () => {
    const onOpenExpenses = vi.fn();
    render(
      <AppShell
        activeView="itinerary"
        collapsed={false}
        currentMember={seedTrip.members[0]}
        onOpenExpenses={onOpenExpenses}
        onToggleCollapsed={vi.fn()}
        trip={seedTrip}
      >
        <main>content</main>
      </AppShell>,
    );

    expect(screen.getByRole("link", { name: /ภาพรวม/ })).toHaveAttribute("href", "/trips/trip-hong-kong-shenzhen");
    expect(screen.getByRole("link", { name: /แผนการเดินทาง/ })).toHaveAttribute("href", "/trips/trip-hong-kong-shenzhen/itinerary");
    expect(screen.getByRole("link", { name: /แผนที่/ })).toHaveAttribute("href", "/trips/trip-hong-kong-shenzhen/map");
    expect(screen.getByRole("link", { name: /ไทม์ไลน์/ })).toHaveAttribute("href", "/trips/trip-hong-kong-shenzhen/timeline");
    expect(screen.getByRole("link", { name: /สมาชิก/ })).toHaveAttribute("href", "/trips/trip-hong-kong-shenzhen/members");
    expect(screen.getByRole("button", { name: /ค่าใช้จ่าย/ })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "ดูสรุปรายละเอียด" })).toHaveAttribute("href", "/trips/trip-hong-kong-shenzhen");
  });
});
