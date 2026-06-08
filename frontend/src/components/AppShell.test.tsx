import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { renderWithI18n } from "@/src/i18n/test-utils";
import { seedTrip } from "@/src/trip/seed";
import { encodeTripId } from "@/src/trip/ids";
import { AppShell, resolveViewFromPath } from "./AppShell";

installLocalStorageStub();

describe("AppShell", () => {
  it("owns the workspace grid and side rail responsive classes", async () => {
    const { container } = renderWithI18n(
      <AppShell
        activeView="overview"
        collapsed={false}
        currentMember={seedTrip.members[0]}
        onToggleCollapsed={vi.fn()}
        trip={seedTrip}
      >
        <main>content</main>
      </AppShell>,
      { locale: "th" },
    );

    await screen.findByRole("navigation", { name: /เมนูวางแผน Joii/i });
    expect(container.querySelector(".app-layout")).toHaveClass(
      "grid",
      "grid-cols-[228px_minmax(0,1fr)]",
      "data-[sidebar-collapsed=true]:grid-cols-[68px_minmax(0,1fr)]",
      "max-[767px]:block",
    );
    expect(screen.getByRole("navigation", { name: /เมนูวางแผน Joii/i })).toHaveClass(
      "side-rail",
      "sticky",
      "grid-rows-[62px_1fr_auto_auto]",
      "max-[767px]:static",
    );
    expect(container.querySelector(".rail-links")).toHaveClass(
      "max-[767px]:w-full",
      "max-[767px]:max-w-full",
      "max-[767px]:overflow-x-auto",
    );
    expect(container.querySelector(".rail-link")).toHaveClass(
      "max-[767px]:max-w-[118px]",
      "max-[767px]:shrink-0",
    );
  });

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
    const confirm = vi.spyOn(window, "confirm");
    await user.click(within(memberCard).getByRole("button", { name: "เปลี่ยนตัวตน" }));
    const dialog = screen.getByRole("dialog", { name: /เปลี่ยนตัวตน/i });
    expect(dialog).toHaveTextContent("Explorer Friend");
    await user.click(within(dialog).getByRole("button", { name: /เปลี่ยนตัวตน/i }));
    expect(confirm).not.toHaveBeenCalled();
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
    expect(screen.getByRole("button", { name: "ขยายเมนู" })).toHaveClass("rail-toggle", "inline-flex", "data-[collapsed=true]:border");
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
    const shortTripId = encodeTripId(seedTrip.id);
    renderWithI18n(
      <AppShell
        activeView="itinerary"
        collapsed={false}
        currentMember={seedTrip.members[0]}
        onToggleCollapsed={vi.fn()}
        trip={seedTrip}
      >
        <main>content</main>
      </AppShell>,
      { locale: "th" },
    );

    await screen.findByRole("link", { name: /ภาพรวม/ });
    expect(screen.getByRole("link", { name: /ภาพรวม/ })).toHaveAttribute("href", `/trips/${shortTripId}`);
    expect(screen.getByRole("link", { name: /แผนการเดินทาง/ })).toHaveAttribute("href", `/trips/${shortTripId}/itinerary`);
    expect(screen.getByRole("link", { name: /แผนที่/ })).toHaveAttribute("href", `/trips/${shortTripId}/map`);
    expect(screen.getByRole("link", { name: /ไทม์ไลน์/ })).toHaveAttribute("href", `/trips/${shortTripId}/timeline`);
    expect(screen.getByRole("link", { name: /ตั๋วและเอกสาร/ })).toHaveAttribute("href", `/trips/${shortTripId}/bookings`);
    expect(screen.getByRole("link", { name: /รูปภาพ/ })).toHaveAttribute("href", `/trips/${shortTripId}/photos`);
    expect(screen.getByRole("link", { name: /สมาชิก/ })).toHaveAttribute("href", `/trips/${shortTripId}/members`);
    expect(screen.getByRole("link", { name: /ค่าใช้จ่าย/ })).toHaveAttribute("href", `/trips/${shortTripId}/expenses`);
    expect(screen.getByRole("link", { name: /^ตั้งค่า$/ })).toHaveAttribute("href", `/trips/${shortTripId}/settings`);
    expect(screen.queryByText("Trip ID 018f4e")).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "ดูสรุปรายละเอียด" })).not.toBeInTheDocument();
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
    expect(screen.getByRole("link", { name: /Overview/i })).toHaveAttribute("href", `/trips/${encodeTripId(seedTrip.id)}`);
    expect(screen.getByText("Traveler")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "ภาษาไทย" }));

    expect(screen.getByRole("navigation", { name: /เมนูวางแผน Joii/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /ภาพรวม/i })).toHaveAttribute("href", `/trips/${encodeTripId(seedTrip.id)}`);
    expect(screen.getByText("ผู้ร่วมเดินทาง")).toBeInTheDocument();
  });

  it("decodes short trip IDs in route path when resolving active view", () => {
    const shortTripId = encodeTripId(seedTrip.id);

    expect(resolveViewFromPath(`/trips/${shortTripId}/itinerary`, seedTrip.id, "overview")).toBe("itinerary");
    expect(resolveViewFromPath(`/trips/${shortTripId}/expenses`, seedTrip.id, "overview")).toBe("expenses");
    expect(resolveViewFromPath(`/trips/${seedTrip.id}/itinerary`, seedTrip.id, "overview")).toBe("itinerary");
    expect(resolveViewFromPath(`/trips/trip%201`, seedTrip.id, "overview")).toBe("overview");
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
