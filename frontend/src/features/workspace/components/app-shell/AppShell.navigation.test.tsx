import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { seedTrip } from "@/src/trip/seed";
import { appRoutes } from "@/src/trip/workspace/sagittarius-app/support";
import { renderAppShell } from "./AppShell.test-support";

describe("AppShell navigation", () => {
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
});
