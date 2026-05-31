import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { renderWithI18n } from "@/src/i18n/test-utils";
import { seedTrip } from "@/src/trip/seed";
import { AppShell } from "./AppShell";

installLocalStorageStub();

describe("AppShell", () => {
  it("labels traveler and viewer roles and exposes leave-session action", async () => {
    const user = userEvent.setup();
    const onLeaveParticipantSession = vi.fn();
    const { unmount } = renderWithI18n(
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
      { locale: "th" },
    );

    await screen.findByText("ผู้ร่วมเดินทาง");
    const memberCard = screen.getByText("Explorer Friend").closest(".member-card") as HTMLElement;
    expect(within(memberCard).getByText("ผู้ร่วมเดินทาง")).toBeInTheDocument();
    const confirm = vi.spyOn(window, "confirm").mockReturnValue(true);
    await user.click(within(memberCard).getByRole("button", { name: "เปลี่ยนตัวตน" }));
    expect(confirm).toHaveBeenCalledWith(expect.stringContaining("Explorer Friend"));
    expect(onLeaveParticipantSession).toHaveBeenCalled();

    unmount();
    renderWithI18n(
      <AppShell
        activeView="members"
        collapsed
        currentMember={seedTrip.members.find((member) => member.role === "viewer")!}
        onToggleCollapsed={vi.fn()}
        trip={seedTrip}
      >
        <main>content</main>
      </AppShell>,
      { locale: "th" },
    );

    await screen.findByText("ผู้ชม");
    expect(screen.getByText("Family Member").closest(".member-card")).toHaveTextContent("ผู้ชม");
    expect(screen.getByRole("button", { name: "ขยายเมนู" })).toBeInTheDocument();
  });

  it("labels organizer members", async () => {
    renderWithI18n(
      <AppShell
        activeView="overview"
        collapsed={false}
        currentMember={seedTrip.members.find((member) => member.role === "organizer")!}
        onToggleCollapsed={vi.fn()}
        trip={seedTrip}
      >
        <main>content</main>
      </AppShell>,
      { locale: "th" },
    );

    await screen.findByText("ผู้จัดทริป");
    expect(screen.getByText("Travel Mate").closest(".member-card")).toHaveTextContent("ผู้จัดทริป");
  });

  it("links workspace navigation to the active trip route scope", async () => {
    const onOpenExpenses = vi.fn();
    renderWithI18n(
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
      { locale: "th" },
    );

    await screen.findByRole("link", { name: /ภาพรวม/ });
    expect(screen.getByRole("link", { name: /ภาพรวม/ })).toHaveAttribute("href", "/trips/trip-hong-kong-shenzhen");
    expect(screen.getByRole("link", { name: /แผนการเดินทาง/ })).toHaveAttribute("href", "/trips/trip-hong-kong-shenzhen/itinerary");
    expect(screen.getByRole("link", { name: /แผนที่/ })).toHaveAttribute("href", "/trips/trip-hong-kong-shenzhen/map");
    expect(screen.getByRole("link", { name: /ไทม์ไลน์/ })).toHaveAttribute("href", "/trips/trip-hong-kong-shenzhen/timeline");
    expect(screen.getByRole("link", { name: /สมาชิก/ })).toHaveAttribute("href", "/trips/trip-hong-kong-shenzhen/members");
    expect(screen.getByRole("button", { name: /ค่าใช้จ่าย/ })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "ดูสรุปรายละเอียด" })).toHaveAttribute("href", "/trips/trip-hong-kong-shenzhen");
  });

  it("renders English shell labels by default and can switch to Thai", async () => {
    const user = userEvent.setup();
    renderWithI18n(
      <AppShell
        activeView="overview"
        collapsed={false}
        currentMember={seedTrip.members.find((member) => member.role === "traveler")!}
        trip={seedTrip}
        onToggleCollapsed={() => {}}
      >
        <main>content</main>
      </AppShell>,
    );

    expect(screen.getByRole("navigation", { name: /Joii planning navigation/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Overview/i })).toHaveAttribute("href", "/trips/trip-hong-kong-shenzhen");
    expect(screen.getByText("Traveler")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "ภาษาไทย" }));

    expect(screen.getByRole("navigation", { name: /เมนูวางแผน Joii/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /ภาพรวม/i })).toHaveAttribute("href", "/trips/trip-hong-kong-shenzhen");
    expect(screen.getByText("ผู้ร่วมเดินทาง")).toBeInTheDocument();
  });
});

function installLocalStorageStub() {
  const values = new Map<string, string>();
  const storage = {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
    removeItem: (key: string) => values.delete(key),
    clear: () => values.clear(),
  };

  Object.defineProperty(window, "localStorage", {
    configurable: true,
    value: storage,
  });

  return storage;
}
