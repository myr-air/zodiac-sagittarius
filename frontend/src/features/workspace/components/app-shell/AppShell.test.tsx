import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { seedTrip } from "@/src/trip/seed";
import { appRoutes, tripRoutes } from "@/src/trip/workspace/sagittarius-app/support";
import { resolveViewFromPath } from "./AppShell";
import {
  installLocalStorageStub,
  renderAppShell,
} from "./AppShell.test-support";

installLocalStorageStub();

describe("AppShell", () => {
  it("owns the workspace grid and side rail responsive classes", async () => {
    const { container } = renderAppShell();

    await screen.findByRole("navigation", { name: /เมนูวางแผน Joii/i });
    expect(container.querySelector(".app-layout")).toHaveClass(
      "grid",
      "grid-cols-[236px_minmax(0,1fr)]",
      "data-[sidebar-collapsed=true]:grid-cols-[74px_minmax(0,1fr)]",
      "max-[767px]:block",
      "max-[767px]:max-w-[100vw]",
      "max-[767px]:overflow-x-hidden",
    );
    expect(screen.getByRole("navigation", { name: /เมนูวางแผน Joii/i })).toHaveClass(
      "side-rail",
      "sticky",
      "grid-rows-[70px_1fr_auto_auto]",
      "data-[collapsed=true]:grid-rows-[84px_1fr_auto_auto]",
      "max-[1199px]:grid-rows-[70px_1fr_auto_auto]",
      "max-[767px]:sticky",
      "max-[767px]:z-40",
      "max-[767px]:grid-rows-[auto]",
    );
    expect(container.querySelector(".brand-row")).toHaveClass(
      "w-full",
      "box-border",
      "data-[collapsed=true]:flex-col",
      "data-[collapsed=true]:justify-center",
      "max-[1199px]:justify-center",
      "max-[767px]:min-h-12",
      "max-[767px]:grid",
      "max-[767px]:grid-cols-[minmax(64px,auto)_minmax(0,1fr)_44px]",
    );
    expect(container.querySelector(".rail-toggle")).toHaveClass(
      "data-[collapsed=true]:min-h-7",
      "data-[collapsed=true]:w-7",
      "max-[1199px]:hidden",
    );
    expect(screen.getByText(seedTrip.name)).toHaveClass("hidden");
    expect(container.querySelector(".mobile-page-title")).toHaveTextContent("ภาพรวม");
    expect(container.querySelector(".mobile-page-title")).toHaveClass("max-[767px]:block");
    expect(screen.getByRole("button", { name: "เปิดเมนู" })).toHaveClass("mobile-menu-button", "max-[767px]:inline-flex");
    expect(container.querySelector(".rail-links")).toHaveClass(
      "w-full",
      "box-border",
      "overflow-x-hidden",
      "data-[collapsed=true]:px-1.5",
      "max-[1199px]:px-1.5",
      "max-[767px]:fixed",
      "max-[767px]:top-12",
      "max-[767px]:data-[mobile-open=false]:opacity-0",
      "max-[767px]:data-[mobile-open=true]:opacity-100",
    );
    expect(container.querySelector(".rail-link")).toHaveClass(
      "max-[767px]:min-h-11",
      "max-[767px]:w-full",
    );
  });

  it("opens mobile navigation from the merged top header", async () => {
    const user = userEvent.setup();
    renderAppShell({ activeView: "bookings", locale: "en" });

    expect(document.querySelector(".mobile-page-title")).toHaveTextContent("Bookings & Docs");
    const menu = document.querySelector(".rail-links");
    expect(menu).toHaveAttribute("data-mobile-open", "false");

    await user.click(screen.getByRole("button", { name: "Open navigation" }));
    expect(menu).toHaveAttribute("data-mobile-open", "true");
    expect(screen.getByRole("button", { name: "Close navigation" })).toHaveAttribute("aria-expanded", "true");
  });

  it("keeps the active mobile navigation item centered when the view changes", async () => {
    const scrollIntoView = vi.fn();
    Object.defineProperty(Element.prototype, "scrollIntoView", {
      configurable: true,
      value: scrollIntoView,
    });

    const firstRender = renderAppShell();

    await waitFor(() => expect(scrollIntoView).toHaveBeenCalledWith({ block: "nearest", inline: "center" }));
    scrollIntoView.mockClear();
    firstRender.unmount();

    renderAppShell({ activeView: "photos" });

    await waitFor(() => expect(scrollIntoView).toHaveBeenCalledWith({ block: "nearest", inline: "center" }));
    expect(screen.getByRole("link", { name: /รูปภาพ/i })).toHaveAttribute("data-active", "true");
  });

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

  it("links workspace navigation to the active trip route scope", async () => {
    const overviewPath = appRoutes.tripOverview(seedTrip.id);
    renderAppShell({ activeView: "itinerary" });

    await screen.findByRole("link", { name: /ภาพรวม/ });
    expect(screen.getByRole("link", { name: /ภาพรวม/ })).toHaveAttribute("href", overviewPath);
    expect(screen.getByRole("link", { name: /แผนการเดินทาง/ })).toHaveAttribute("href", appRoutes.tripItinerary(seedTrip.id));
    expect(screen.getByRole("link", { name: /แผนที่/ })).toHaveAttribute("href", appRoutes.tripMap(seedTrip.id));
    expect(screen.getByRole("link", { name: /ไทม์ไลน์/ })).toHaveAttribute("href", appRoutes.tripTimeline(seedTrip.id));
    expect(screen.getByRole("link", { name: /ตั๋วและเอกสาร/ })).toHaveAttribute("href", appRoutes.tripBookings(seedTrip.id));
    expect(screen.getByRole("link", { name: /รูปภาพ/ })).toHaveAttribute("href", appRoutes.tripPhotos(seedTrip.id));
    expect(screen.getByRole("link", { name: /สมาชิก/ })).toHaveAttribute("href", appRoutes.tripMembers(seedTrip.id));
    expect(screen.getByRole("link", { name: /ค่าใช้จ่าย/ })).toHaveAttribute("href", appRoutes.tripExpenses(seedTrip.id));
    expect(screen.getByRole("link", { name: /^ตั้งค่า$/ })).toHaveAttribute("href", appRoutes.tripSettings(seedTrip.id));
    expect(screen.queryByText("Trip ID 018f4e")).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "ดูสรุปรายละเอียด" })).not.toBeInTheDocument();
  });

  it("renders English shell labels by default and can switch to Thai", async () => {
    const user = userEvent.setup();
    renderAppShell({
      currentMember: seedTrip.members.find((member) => member.role === "traveler")!,
      locale: "en",
      onToggleCollapsed: () => {},
    });

    expect(screen.getByRole("navigation", { name: /Joii planning navigation/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Overview/i })).toHaveAttribute("href", appRoutes.tripOverview(seedTrip.id));
    expect(screen.getByText("Traveler")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Language and currency" }));
    await user.click(screen.getByRole("menuitemradio", { name: "ภาษาไทย" }));

    expect(screen.getByRole("navigation", { name: /เมนูวางแผน Joii/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /ภาพรวม/i })).toHaveAttribute("href", appRoutes.tripOverview(seedTrip.id));
    expect(screen.getByText("ผู้ร่วมเดินทาง")).toBeInTheDocument();
  });

  it("decodes short trip IDs in route path when resolving active view", () => {
    expect(resolveViewFromPath(appRoutes.tripItinerary(seedTrip.id), seedTrip.id, "overview")).toBe("itinerary");
    expect(resolveViewFromPath(appRoutes.tripExpenses(seedTrip.id), seedTrip.id, "overview")).toBe("expenses");
    expect(resolveViewFromPath(tripRoutes.itinerary(seedTrip.id), seedTrip.id, "overview")).toBe("itinerary");
    expect(resolveViewFromPath(tripRoutes.expenses(seedTrip.id), seedTrip.id, "overview")).toBe("expenses");
    expect(resolveViewFromPath(appRoutes.tripOverview(seedTrip.id), seedTrip.id, "overview")).toBe("overview");
  });
});
