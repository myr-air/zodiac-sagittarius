import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { SagittariusApp } from "@/src/app/SagittariusApp";
import { tripParticipantSessionStorageKey } from "@/src/trip/auth";
import { seedTrip } from "@/src/trip/seed";

describe("Sagittarius cockpit UI", () => {
  it("can require trip participant authentication before opening the cockpit", async () => {
    const user = userEvent.setup();
    render(<SagittariusApp requireJoin />);

    expect(screen.getByRole("main", { name: /Join trip/i })).toBeInTheDocument();
    expect(screen.queryByRole("navigation", { name: /Sagittarius planning navigation/i })).not.toBeInTheDocument();

    await user.type(screen.getByLabelText(/Trip ID/i), "HK-SZ-2025");
    await user.type(screen.getByLabelText(/Trip password/i), "dim-sum-run");
    await user.click(screen.getByRole("button", { name: /เข้าห้อง trip/i }));
    await user.click(screen.getByRole("button", { name: /Explorer Friend/i }));
    await user.type(screen.getByLabelText(/ตั้งรหัสสำหรับ Explorer Friend/i), "traveler-pin");
    await user.click(screen.getByRole("button", { name: /เริ่มใช้งาน/i }));

    expect(screen.getByRole("navigation", { name: /Sagittarius planning navigation/i })).toBeInTheDocument();
    expect(screen.getAllByRole("heading", { name: /Hong Kong \+ Shenzhen Trip/i }).length).toBeGreaterThan(0);
    expect(screen.getByRole("region", { name: /Trip overview/i })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /เพิ่มสถานที่ \/ กิจกรรม/i })).not.toBeInTheDocument();
  }, 15_000);

  it("lets a guest participant leave their local session and choose another identity", async () => {
    const user = userEvent.setup();
    render(<SagittariusApp requireJoin />);

    await user.type(screen.getByLabelText(/Trip ID/i), "HK-SZ-2025");
    await user.type(screen.getByLabelText(/Trip password/i), "dim-sum-run");
    await user.click(screen.getByRole("button", { name: /เข้าห้อง trip/i }));
    await user.click(screen.getByRole("button", { name: /Explorer Friend/i }));
    await user.type(screen.getByLabelText(/ตั้งรหัสสำหรับ Explorer Friend/i), "traveler-pin");
    await user.click(screen.getByRole("button", { name: /เริ่มใช้งาน/i }));

    await user.click(screen.getByRole("button", { name: /เปลี่ยนตัวตน/i }));

    expect(screen.getByRole("main", { name: /Join trip/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /เข้าห้อง trip/i })).toBeInTheDocument();
    expect(screen.queryByRole("navigation", { name: /Sagittarius planning navigation/i })).not.toBeInTheDocument();
  });

  it("persists guest participant claims across a fresh app mount", async () => {
    const user = userEvent.setup();
    installLocalStorageStub();
    const { unmount } = render(<SagittariusApp requireJoin />);

    await user.type(screen.getByLabelText(/Trip ID/i), "HK-SZ-2025");
    await user.type(screen.getByLabelText(/Trip password/i), "dim-sum-run");
    await user.click(screen.getByRole("button", { name: /เข้าห้อง trip/i }));
    await user.click(screen.getByRole("button", { name: /Explorer Friend/i }));
    await user.type(screen.getByLabelText(/ตั้งรหัสสำหรับ Explorer Friend/i), "traveler-pin");
    await user.click(screen.getByRole("button", { name: /เริ่มใช้งาน/i }));
    await user.click(screen.getByRole("button", { name: /เปลี่ยนตัวตน/i }));

    unmount();
    render(<SagittariusApp requireJoin />);

    await user.type(screen.getByLabelText(/Trip ID/i), "HK-SZ-2025");
    await user.type(screen.getByLabelText(/Trip password/i), "dim-sum-run");
    await user.click(screen.getByRole("button", { name: /เข้าห้อง trip/i }));
    await user.click(screen.getByRole("button", { name: /Explorer Friend/i }));

    expect(screen.getByLabelText(/รหัสของ Explorer Friend/i)).toBeInTheDocument();
    expect(screen.queryByLabelText(/ตั้งรหัสสำหรับ Explorer Friend/i)).not.toBeInTheDocument();
  });

  it("opens directly into the trip overview instead of a marketing landing page", () => {
    const { container } = render(<SagittariusApp />);
    const workspaceGrid = container.querySelector(".workspace-grid");
    const planningMain = container.querySelector(".planning-main");

    expect(screen.getAllByRole("heading", { name: /Hong Kong \+ Shenzhen Trip/i }).length).toBeGreaterThan(0);
    expect(screen.getByRole("navigation", { name: /Sagittarius planning navigation/i })).toBeInTheDocument();
    expect(screen.getByRole("banner", { name: /Trip command bar/i })).toHaveClass("top-app-bar");
    expect(workspaceGrid).toBeInTheDocument();
    expect(workspaceGrid).toContainElement(planningMain as HTMLElement);
    expect(planningMain).toContainElement(screen.getByRole("region", { name: /Trip overview/i }));
    expect(screen.getByRole("region", { name: /Trip overview/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /คุมทริปให้พร้อม/i })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /เพิ่มสถานที่ \/ กิจกรรม/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Open details/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Undo/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Redo/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /More actions/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("region", { name: /Smart itinerary table/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("region", { name: /Route map/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("region", { name: /Trip timeline/i })).not.toBeInTheDocument();
    expect(screen.queryByText(/hero/i)).not.toBeInTheDocument();
  });

  it("manages trip tasks from the overview checklist", async () => {
    const user = userEvent.setup();
    render(<SagittariusApp />);

    expect(screen.getByRole("region", { name: /Trip readiness/i })).toBeInTheDocument();
    const tasks = screen.getByRole("region", { name: /Trip checklist/i });
    expect(within(tasks).getByRole("button", { name: /ของฉัน/i })).toHaveClass("overview-task-filter--active");
    expect(within(tasks).getAllByText(/ส่วนตัว/i).length).toBeGreaterThan(0);
    expect(within(tasks).getAllByText(/แชร์ในทริป/i).length).toBeGreaterThan(0);
    expect(within(tasks).getByRole("checkbox", { name: /ซื้อ eSIM/i })).not.toBeChecked();

    await user.type(within(tasks).getByLabelText(/เพิ่มเช็กลิสต์/i), "แลกเงิน HKD");
    await user.selectOptions(within(tasks).getByLabelText(/เก็บไว้ที่/i), "shared");
    await user.selectOptions(within(tasks).getByLabelText(/ให้ใครดูแล/i), "member-nam");
    await user.click(within(tasks).getByRole("button", { name: /เพิ่มเช็กลิสต์/i }));

    const newTask = within(tasks).getByRole("listitem", { name: /แลกเงิน HKD/i });
    expect(within(newTask).getByText(/Explorer Friend/i)).toBeInTheDocument();
    expect(within(newTask).getByText(/แชร์ในทริป/i)).toBeInTheDocument();

    await user.click(within(newTask).getByRole("checkbox", { name: /แลกเงิน HKD/i }));
    expect(within(newTask).getByRole("checkbox", { name: /แลกเงิน HKD/i })).toBeChecked();

    await user.click(within(tasks).getByRole("button", { name: /เสร็จแล้ว/i }));

    expect(within(tasks).getByText(/แลกเงิน HKD/i)).toBeInTheDocument();
    expect(within(tasks).queryByText(/ซื้อ eSIM/i)).not.toBeInTheDocument();

    await user.click(within(tasks).getByRole("button", { name: /แชร์ในทริป/i }));
    expect(within(tasks).getByText(/จอง Peak Tram/i)).toBeInTheDocument();

    await user.click(within(tasks).getByRole("button", { name: /ของฉัน/i }));
    await user.click(within(tasks).getByRole("button", { name: /ทุกสถานะ/i }));
    expect(within(tasks).getByText(/ซื้อ eSIM/i)).toBeInTheDocument();
    expect(within(tasks).queryByText(/จอง Peak Tram/i)).not.toBeInTheDocument();
  });

  it("keeps the left navigation simple and only links to implemented views", () => {
    render(<SagittariusApp />);

    const navigation = screen.getByRole("navigation", { name: /Sagittarius planning navigation/i });
    const railLinks = navigation.querySelector(".rail-links");
    expect(railLinks).not.toBeNull();
    const links = within(railLinks as HTMLElement).getAllByRole("link");

    expect(links.map((link) => link.textContent?.trim())).toEqual([
      "ภาพรวม",
      "แผนการเดินทาง",
      "แผนที่",
      "ไทม์ไลน์",
      "สมาชิก",
    ]);
    expect(within(navigation).getByRole("link", { name: /ภาพรวม/i })).toHaveClass("rail-link--active");
    expect(within(navigation).queryByRole("link", { name: /งบประมาณ/i })).not.toBeInTheDocument();
    expect(within(navigation).queryByRole("link", { name: /รายการจอง/i })).not.toBeInTheDocument();
    expect(within(navigation).queryByRole("link", { name: /ตั้งค่า/i })).not.toBeInTheDocument();
  });

  it("matches the dense planning cockpit skeleton from the reference", () => {
    render(<SagittariusApp initialView="itinerary" />);

    expect(screen.getByRole("banner", { name: /Trip command bar/i })).toHaveClass("top-app-bar");
    expect(screen.getByRole("link", { name: /แผนการเดินทาง/i })).toHaveClass("rail-link--active");
    expect(screen.queryByRole("tablist", { name: /Planning views/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("tab", { name: /Smart Itinerary Table/i })).not.toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: /^เวลา$/i })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: /แผนที่ \/ ลิงก์/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Select stop Dim Dim Sum/i })).toBeInTheDocument();
    expect(screen.queryByRole("columnheader", { name: /ตั้งค่าตาราง/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Duplicate Dim Dim Sum/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /More actions for Dim Dim Sum/i })).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/Plan variant/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/Selected day/i)).not.toBeInTheDocument();
  }, 10_000);

  it("renders only the surface that belongs to the current URL view", () => {
    const { rerender } = render(<SagittariusApp initialView="itinerary" />);

    expect(screen.getByRole("region", { name: /Smart itinerary table/i })).toBeInTheDocument();
    expect(screen.queryByRole("region", { name: /Route map/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("region", { name: /Trip timeline/i })).not.toBeInTheDocument();

    rerender(<SagittariusApp initialView="map" />);

    const map = screen.getByRole("region", { name: /Route map/i });
    expect(screen.queryByRole("region", { name: /Smart itinerary table/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("region", { name: /Trip timeline/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Open details/i })).not.toBeInTheDocument();
    expect(within(map).getByRole("button", { name: /ทุกวัน/i })).toBeInTheDocument();
    expect(within(map).getByRole("button", { name: /Day 2/i })).toBeInTheDocument();
    expect(within(map).queryByRole("button", { name: /โหลด OpenFreeMap/i })).not.toBeInTheDocument();
    expect(within(map).queryByRole("button", { name: /Select map stop Victoria Peak/i })).not.toBeInTheDocument();
    expect(within(map).queryByRole("button", { name: /Select route stop Dim Dim Sum/i })).not.toBeInTheDocument();

    rerender(<SagittariusApp initialView="timeline" />);

    const timeline = screen.getByRole("region", { name: /Timeline/i });

    expect(screen.queryByRole("region", { name: /Smart itinerary table/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("region", { name: /Route map/i })).not.toBeInTheDocument();
    expect(within(timeline).getByRole("button", { name: /Select timeline stop Dim Dim Sum/i })).toBeInTheDocument();
    expect(within(timeline).getAllByText(/Hong Kong City Day/i).length).toBeGreaterThan(0);
  });

  it("renders trip members as their own workspace page", () => {
    render(<SagittariusApp initialView="members" />);

    const navigation = screen.getByRole("navigation", { name: /Sagittarius planning navigation/i });
    const membersLink = within(navigation).getByRole("link", { name: /สมาชิก/i });

    expect(membersLink).toHaveClass("rail-link--active");
    expect(membersLink).toHaveAttribute("href", "/members");
    expect(screen.getByRole("main", { name: /Trip members/i })).toBeInTheDocument();
    expect(screen.getByRole("region", { name: /People and presence/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /สมาชิกในทริป/i })).toBeInTheDocument();
    expect(screen.queryByRole("region", { name: /Smart itinerary table/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("region", { name: /Route map/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("region", { name: /Trip timeline/i })).not.toBeInTheDocument();
  });

  it("renders members inside the shared command workspace without itinerary-only controls", () => {
    const { container } = render(<SagittariusApp initialView="members" />);
    const workspaceGrid = container.querySelector(".workspace-grid");
    const planningMain = container.querySelector(".planning-main");

    expect(screen.getByRole("banner", { name: /Trip command bar/i })).toHaveClass("top-app-bar");
    expect(workspaceGrid).toBeInTheDocument();
    expect(workspaceGrid).toContainElement(planningMain as HTMLElement);
    expect(planningMain).toContainElement(screen.getByRole("main", { name: /Trip members/i }));
    expect(screen.queryByRole("button", { name: /เพิ่มสถานที่ \/ กิจกรรม/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Open details/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Undo/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Redo/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /More actions/i })).not.toBeInTheDocument();
  });

  it("shows the current member as confirmed on the members page", async () => {
    const user = userEvent.setup();
    render(<SagittariusApp initialView="members" />);

    const currentMemberRow = screen.getByText(/Demo Traveler \(คุณ\)/i).closest(".person-row");
    expect(currentMemberRow).not.toBeNull();
    expect(within(currentMemberRow as HTMLElement).getByText(/ยืนยันแล้ว/i)).toBeInTheDocument();
    expect(within(currentMemberRow as HTMLElement).queryByText(/รอเข้าร่วม/i)).not.toBeInTheDocument();

    await user.selectOptions(screen.getByLabelText(/^สถานะ$/i), "pending");

    expect(screen.queryByText(/Demo Traveler \(คุณ\)/i)).not.toBeInTheDocument();
  });

  it("starts hydration from the join gate even when a remembered participant session exists", async () => {
    installLocalStorageStub();
    window.localStorage.setItem(
      tripParticipantSessionStorageKey,
      JSON.stringify({
        tripId: seedTrip.id,
        memberId: "member-aom",
        sessionToken: "local_hydration_test",
        createdAt: "2026-05-28T00:00:00.000Z",
        expiresAt: "2026-06-28T00:00:00.000Z",
      }),
    );

    render(<SagittariusApp initialView="members" requireJoin />);

    expect(screen.getByRole("main", { name: /Join trip/i })).toBeInTheDocument();
    expect(screen.queryByRole("navigation", { name: /Sagittarius planning navigation/i })).not.toBeInTheDocument();
    expect(await screen.findByRole("navigation", { name: /Sagittarius planning navigation/i })).toBeInTheDocument();
  });

  it("filters trip members and can reset an empty member search", async () => {
    const user = userEvent.setup();
    render(<SagittariusApp initialView="members" />);

    await user.type(screen.getByLabelText(/ค้นหาสมาชิก/i), "Family");

    const membersPage = screen.getByRole("main", { name: /Trip members/i });
    expect(within(membersPage).getByRole("button", { name: /ปิดสิทธิ์ Family Member/i })).toBeInTheDocument();
    expect(within(membersPage).queryByText(/Travel Mate/i)).not.toBeInTheDocument();

    await user.selectOptions(screen.getByLabelText(/^สิทธิ์$/i), "organizer");

    expect(screen.getByText(/ไม่พบสมาชิกที่ตรงกับตัวกรอง/i)).toBeInTheDocument();

    await user.click(screen.getAllByRole("button", { name: /ล้างตัวกรอง/i })[0]);

    expect(screen.getByRole("button", { name: /ปิดสิทธิ์ Travel Mate/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /ปิดสิทธิ์ Explorer Friend/i })).toBeInTheDocument();
  });

  it("copies the trip invite link from the members command center", async () => {
    const user = userEvent.setup();
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText },
    });

    render(<SagittariusApp initialView="members" />);

    await user.click(screen.getByRole("button", { name: /คัดลอกลิงก์เชิญ/i }));

    expect(writeText).toHaveBeenCalledWith(expect.stringContaining("/members?trip=HK-SZ-2025"));
    expect(screen.getByText(/คัดลอกแล้ว/i)).toBeInTheDocument();
  });

  it("creates new members from the members command center", async () => {
    const user = userEvent.setup();
    render(<SagittariusApp initialView="members" />);

    await user.click(screen.getByRole("button", { name: /เปิดฟอร์มเพิ่มสมาชิก/i }));
    await user.type(screen.getByLabelText(/ชื่อสมาชิกใหม่/i), "New Cousin");
    await user.selectOptions(screen.getByLabelText(/สิทธิ์สมาชิกใหม่/i), "viewer");
    await user.click(screen.getByRole("button", { name: /บันทึกสมาชิก/i }));

    const newMemberRow = screen.getAllByText("New Cousin")[0].closest(".person-row");
    expect(newMemberRow).not.toBeNull();
    expect(within(newMemberRow as HTMLElement).getByText(/ดูได้/i)).toBeInTheDocument();
    expect(within(newMemberRow as HTMLElement).getByText(/รอเข้าร่วม/i)).toBeInTheDocument();
  });

  it("can start on real route paths with the right surface first", () => {
    const { rerender } = render(<SagittariusApp initialView="map" />);

    const navigation = screen.getByRole("navigation", { name: /Sagittarius planning navigation/i });
    expect(within(navigation).getByRole("link", { name: /แผนที่/i })).toHaveClass("rail-link--active");
    expect(document.querySelector(".planning-main")?.firstElementChild).toHaveClass("route-map-panel");
    expect(screen.queryByRole("region", { name: /Smart itinerary table/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("region", { name: /Trip timeline/i })).not.toBeInTheDocument();

    rerender(<SagittariusApp initialView="timeline" />);

    expect(within(navigation).getByRole("link", { name: /ไทม์ไลน์/i })).toHaveClass("rail-link--active");
    expect(document.querySelector(".planning-main")?.firstElementChild).toHaveClass("timeline-panel");
    expect(screen.queryByRole("region", { name: /Smart itinerary table/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("region", { name: /Route map/i })).not.toBeInTheDocument();
  });

  it("uses timeline selections for details while map day filters stay local", async () => {
    const user = userEvent.setup();
    const { unmount } = render(<SagittariusApp initialView="timeline" />);

    await user.click(within(screen.getByRole("region", { name: /Timeline/i })).getByRole("button", { name: /Select timeline stop Victoria Peak/i }));
    expect(within(screen.getByRole("complementary", { name: /Planning context/i })).getByRole("heading", { name: /Victoria Peak/i })).toBeInTheDocument();

    unmount();
    render(<SagittariusApp initialView="map" />);

    expect(screen.queryByRole("button", { name: /Open details/i })).not.toBeInTheDocument();
    await user.click(within(screen.getByRole("region", { name: /Route map/i })).getByRole("button", { name: /Day 2/i }));
    expect(screen.queryByRole("complementary", { name: /Planning context/i })).not.toBeInTheDocument();
    expect(screen.getByText(/6\/15 stops visible/i)).toBeInTheDocument();
  });

  it("collapses the left rail and keeps labels accessible", async () => {
    const user = userEvent.setup();
    render(<SagittariusApp initialView="itinerary" />);

    await user.click(screen.getByRole("button", { name: /Collapse navigation/i }));

    const nav = screen.getByRole("navigation", { name: /Sagittarius planning navigation/i });
    expect(nav).toHaveAttribute("data-collapsed", "true");
    expect(screen.getByRole("button", { name: /Expand navigation/i })).toHaveAttribute("aria-expanded", "false");

    await user.click(screen.getByRole("button", { name: /Expand navigation/i }));

    expect(nav).toHaveAttribute("data-collapsed", "false");
    expect(screen.getByRole("button", { name: /Collapse navigation/i })).toHaveAttribute("aria-expanded", "true");
  });

  it("starts with the right context drawer hidden so the table can expand", async () => {
    const user = userEvent.setup();
    const { container } = render(<SagittariusApp initialView="itinerary" />);

    expect(screen.queryByRole("complementary", { name: /Planning context/i })).not.toBeInTheDocument();
    expect(container.querySelector(".workspace-grid")).toHaveAttribute("data-context-rail", "closed");
    expect(screen.getByRole("button", { name: /Open details/i })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Open details/i }));

    expect(screen.getByRole("complementary", { name: /Planning context/i })).toBeInTheDocument();
    expect(container.querySelector(".workspace-grid")).toHaveAttribute("data-context-rail", "open");
  });

  it("opens the right context drawer when selecting a row while details are hidden", async () => {
    const user = userEvent.setup();
    const { container } = render(<SagittariusApp initialView="itinerary" />);

    expect(container.querySelector(".workspace-grid")).toHaveAttribute("data-context-rail", "closed");

    await user.click(screen.getByRole("button", { name: /Select stop Victoria Peak/i }));

    const context = screen.getByRole("complementary", { name: /Planning context/i });
    expect(container.querySelector(".workspace-grid")).toHaveAttribute("data-context-rail", "open");
    expect(within(context).getByRole("heading", { name: /Victoria Peak/i })).toBeInTheDocument();
  });

  it("keeps trip member management out of the right context drawer", async () => {
    const user = userEvent.setup();
    render(<SagittariusApp initialView="itinerary" />);

    await user.click(screen.getByRole("button", { name: /Open details/i }));

    const context = screen.getByRole("complementary", { name: /Planning context/i });
    expect(within(context).queryByRole("region", { name: /People and presence/i })).not.toBeInTheDocument();
    expect(within(context).queryByRole("heading", { name: /สมาชิกและสถานะ/i })).not.toBeInTheDocument();
  });

  it("uses selected table row to drive the right context rail", async () => {
    const user = userEvent.setup();
    render(<SagittariusApp initialView="itinerary" />);

    await user.click(screen.getByRole("button", { name: /Select stop Victoria Peak/i }));

    const context = screen.getByRole("complementary", { name: /Planning context/i });
    expect(within(context).getByRole("heading", { name: /Victoria Peak/i })).toBeInTheDocument();
    expect(within(context).getAllByText(/The Peak Tram/i).length).toBeGreaterThan(0);
  });

  it("opens details when clicking anywhere on an itinerary row", async () => {
    const { container } = render(<SagittariusApp initialView="itinerary" />);

    expect(container.querySelector(".workspace-grid")).toHaveAttribute("data-context-rail", "closed");

    fireEvent.click(screen.getByRole("row", { name: /Open details for Victoria Peak/i }));

    const context = screen.getByRole("complementary", { name: /Planning context/i });
    expect(within(context).getByRole("heading", { name: /Victoria Peak/i })).toBeInTheDocument();
    expect(container.querySelector(".workspace-grid")).toHaveAttribute("data-context-rail", "open");
  });

  it("closes the right context drawer when clicking outside it", async () => {
    const user = userEvent.setup();
    const { container } = render(<SagittariusApp initialView="itinerary" />);

    await user.click(screen.getByRole("button", { name: /Open details/i }));
    expect(container.querySelector(".workspace-grid")).toHaveAttribute("data-context-rail", "open");

    await user.click(screen.getByRole("region", { name: /Smart itinerary table/i }));

    expect(container.querySelector(".workspace-grid")).toHaveAttribute("data-context-rail", "closed");
    expect(screen.queryByRole("complementary", { name: /Planning context/i })).not.toBeInTheDocument();
  });

  it("keeps the right context drawer open when clicking inside it", async () => {
    const user = userEvent.setup();
    const { container } = render(<SagittariusApp initialView="itinerary" />);

    await user.click(screen.getByRole("button", { name: /Open details/i }));
    const context = screen.getByRole("complementary", { name: /Planning context/i });

    await user.click(context);

    expect(container.querySelector(".workspace-grid")).toHaveAttribute("data-context-rail", "open");
    expect(screen.getByRole("complementary", { name: /Planning context/i })).toBeInTheDocument();
  });

  it("collapses and expands day groups", async () => {
    const user = userEvent.setup();
    render(<SagittariusApp initialView="itinerary" />);

    await user.click(screen.getByRole("button", { name: /Collapse Day 2/i }));

    expect(screen.queryByRole("button", { name: /Select stop Dim Dim Sum/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Select stop Victoria Peak/i })).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Expand Day 2/i }));

    expect(screen.getByRole("button", { name: /Select stop Dim Dim Sum/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Select stop Victoria Peak/i })).toBeInTheDocument();
  });

  it("reorders itinerary rows with drag and drop", () => {
    render(<SagittariusApp initialView="itinerary" />);

    const dataTransfer = createDataTransfer();
    const victoriaSelectBefore = screen.getByRole("button", { name: /Select stop Victoria Peak/i });
    const dimDimSelectBefore = screen.getByRole("button", { name: /Select stop Dim Dim Sum/i });
    expect(dimDimSelectBefore.compareDocumentPosition(victoriaSelectBefore) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();

    fireEvent.dragStart(screen.getByRole("button", { name: /Drag Victoria Peak/i }), { dataTransfer });
    fireEvent.dragOver(screen.getByRole("button", { name: /Select stop Dim Dim Sum/i }), { dataTransfer });
    fireEvent.drop(screen.getByRole("button", { name: /Select stop Dim Dim Sum/i }), { dataTransfer });

    const victoriaSelectAfter = screen.getByRole("button", { name: /Select stop Victoria Peak/i });
    const dimDimSelectAfter = screen.getByRole("button", { name: /Select stop Dim Dim Sum/i });
    expect(victoriaSelectAfter.compareDocumentPosition(dimDimSelectAfter) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it("shows a drop preview before placing a dragged itinerary row", () => {
    render(<SagittariusApp initialView="itinerary" />);

    const dataTransfer = createDataTransfer();
    const victoriaRow = screen.getByRole("button", { name: /Select stop Victoria Peak/i }).closest("tr");
    const dimDimRow = screen.getByRole("button", { name: /Select stop Dim Dim Sum/i }).closest("tr");

    fireEvent.dragStart(screen.getByRole("button", { name: /Drag Victoria Peak/i }), { dataTransfer });
    fireEvent.dragOver(dimDimRow!, { dataTransfer });

    expect(victoriaRow).toHaveClass("data-row--dragging");
    expect(dimDimRow).toHaveClass("data-row--drop-target");

    fireEvent.drop(dimDimRow!, { dataTransfer });

    expect(dimDimRow).not.toHaveClass("data-row--drop-target");
  });

  it("changes edit affordances by role capability", async () => {
    const user = userEvent.setup();
    render(<SagittariusApp initialView="itinerary" />);

    expect(screen.getByRole("button", { name: /เพิ่มสถานที่ \/ กิจกรรม/i })).toBeEnabled();

    await user.selectOptions(screen.getByLabelText(/Role preview/i), "member-viewer");

    expect(screen.getByRole("button", { name: /เพิ่มสถานที่ \/ กิจกรรม/i })).toBeDisabled();
    expect(screen.getByText(/editing requires organizer access/i)).toBeInTheDocument();
  });

  it("lets travelers submit a suggestion instead of directly editing a stop", async () => {
    const user = userEvent.setup();
    render(<SagittariusApp initialView="itinerary" />);

    await user.selectOptions(screen.getByLabelText(/Role preview/i), "member-nam");
    await user.click(screen.getByRole("button", { name: /Open details/i }));
    await user.click(screen.getByRole("button", { name: /เสนอแก้ไข/i }));

    expect(screen.getByText(/คำแนะนำ \(3\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Explorer Friend suggested an update/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /ปรับเวลาอัตโนมัติ/i })).toBeDisabled();
  });

  it("uses the stop workspace for notes, booking prep, and suggestion review", async () => {
    const user = userEvent.setup();
    render(<SagittariusApp initialView="itinerary" />);

    await user.click(screen.getByRole("button", { name: /Open details/i }));

    const context = screen.getByRole("complementary", { name: /Planning context/i });
    expect(within(context).getByRole("tab", { name: /โน้ต/i })).toHaveAttribute("aria-selected", "true");
    expect(within(context).getByRole("tab", { name: /การจอง/i })).toBeInTheDocument();
    expect(within(context).getByRole("tab", { name: /ข้อเสนอ/i })).toBeInTheDocument();
    expect(within(context).getByRole("region", { name: /Stop notes/i })).toBeInTheDocument();

    await user.type(within(context).getByLabelText(/เพิ่มโน้ตสำหรับจุดนี้/i), "ถามร้านว่ามีโต๊ะริมหน้าต่างไหม");
    await user.click(within(context).getByRole("button", { name: /บันทึกโน้ต/i }));
    expect(within(context).getByText(/ถามร้านว่ามีโต๊ะริมหน้าต่างไหม/i)).toBeInTheDocument();

    await user.click(within(context).getByRole("tab", { name: /การจอง/i }));
    expect(within(context).getByRole("region", { name: /Booking and prep for this stop/i })).toBeInTheDocument();
    expect(within(context).getByText(/จองล่วงหน้าแนะนำ/i)).toBeInTheDocument();

    await user.click(within(context).getByRole("tab", { name: /ข้อเสนอ/i }));
    expect(within(context).getByRole("region", { name: /Suggestion review/i })).toBeInTheDocument();
    await user.click(within(context).getByRole("button", { name: /อนุมัติ ร้านนี้ได้รับคะแนนสูง/i }));
    expect(within(context).queryByText(/ร้านนี้ได้รับคะแนนสูง 4.3\/5 จาก 8,332 รีวิว/i)).not.toBeInTheDocument();

    await user.click(within(context).getByRole("button", { name: /ปฏิเสธ แนะนำให้จองคิวล่วงหน้า/i }));
    expect(within(context).queryByText(/แนะนำให้จองคิวล่วงหน้า โดยเฉพาะช่วงสุดสัปดาห์/i)).not.toBeInTheDocument();
  });

  it("adds a new itinerary stop from the header action", async () => {
    const user = userEvent.setup();
    render(<SagittariusApp initialView="itinerary" />);

    await user.click(screen.getByRole("button", { name: /เพิ่มสถานที่ \/ กิจกรรม/i }));

    const dialog = screen.getByRole("dialog", { name: /เพิ่มกิจกรรม/i });
    await user.clear(within(dialog).getByLabelText(/^เวลา$/i));
    await user.type(within(dialog).getByLabelText(/^เวลา$/i), "16:45");
    await user.clear(within(dialog).getByLabelText(/กิจกรรม/i));
    await user.type(within(dialog).getByLabelText(/กิจกรรม/i), "Coffee break at K11 Musea");
    await user.clear(within(dialog).getByLabelText(/สถานที่/i));
    await user.type(within(dialog).getByLabelText(/สถานที่/i), "K11 Musea");
    await user.clear(within(dialog).getByLabelText(/^ระยะเวลา$/i));
    await user.type(within(dialog).getByLabelText(/^ระยะเวลา$/i), "45");
    await user.clear(within(dialog).getByLabelText(/การเดินทาง/i));
    await user.type(within(dialog).getByLabelText(/การเดินทาง/i), "เดิน");
    await user.click(within(dialog).getByRole("button", { name: /บันทึกกิจกรรม/i }));

    expect(screen.queryByRole("dialog", { name: /เพิ่มกิจกรรม/i })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Select stop Coffee break at K11 Musea/i })).toBeInTheDocument();
    expect(within(screen.getByRole("complementary", { name: /Planning context/i })).getByRole("heading", { name: /Coffee break at K11 Musea/i })).toBeInTheDocument();
  });

  it("edits the selected stop and supports undo redo", async () => {
    const user = userEvent.setup();
    render(<SagittariusApp initialView="itinerary" />);

    await user.click(screen.getByRole("button", { name: /Open details/i }));
    await user.click(screen.getByRole("button", { name: /แก้ไขรายละเอียด/i }));

    const dialog = screen.getByRole("dialog", { name: /แก้ไขรายละเอียด/i });
    await user.clear(within(dialog).getByLabelText(/กิจกรรม/i));
    await user.type(within(dialog).getByLabelText(/กิจกรรม/i), "Dim Dim Sum revised");
    await user.click(within(dialog).getByRole("button", { name: /บันทึกการแก้ไข/i }));

    const context = screen.getByRole("complementary", { name: /Planning context/i });
    expect(within(context).getByRole("heading", { name: /Dim Dim Sum revised/i })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Undo/i }));
    expect(within(context).getByRole("heading", { name: /Dim Dim Sum ที่ Tim Ho Wan/i })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Redo/i }));
    expect(within(context).getByRole("heading", { name: /Dim Dim Sum revised/i })).toBeInTheDocument();
  });
});

function createDataTransfer() {
  const values = new Map<string, string>();

  return {
    dropEffect: "move",
    effectAllowed: "move",
    getData: (type: string) => values.get(type) ?? "",
    setData: (type: string, value: string) => values.set(type, value),
  };
}

function installLocalStorageStub() {
  const values = new Map<string, string>();
  Object.defineProperty(window, "localStorage", {
    configurable: true,
    value: {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => values.set(key, value),
      removeItem: (key: string) => values.delete(key),
      clear: () => values.clear(),
    },
  });
}
