import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { SagittariusApp } from "@/src/app/SagittariusApp";

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
    expect(screen.getByRole("heading", { name: /Hong Kong \+ Shenzhen Trip/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /เพิ่มสถานที่ \/ กิจกรรม/i })).toBeDisabled();
  });

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

  it("opens directly into the planning cockpit instead of a marketing landing page", () => {
    render(<SagittariusApp />);

    expect(screen.getByRole("heading", { name: /Hong Kong \+ Shenzhen Trip/i })).toBeInTheDocument();
    expect(screen.getByRole("navigation", { name: /Sagittarius planning navigation/i })).toBeInTheDocument();
    expect(screen.getByRole("region", { name: /Smart itinerary table/i })).toBeInTheDocument();
    expect(screen.queryByRole("region", { name: /Route map/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("region", { name: /Trip timeline/i })).not.toBeInTheDocument();
    expect(screen.queryByText(/hero/i)).not.toBeInTheDocument();
  });

  it("matches the dense planning cockpit skeleton from the reference", () => {
    render(<SagittariusApp />);

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
    const { rerender } = render(<SagittariusApp />);

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
    render(<SagittariusApp />);

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
    const { container } = render(<SagittariusApp />);

    expect(screen.queryByRole("complementary", { name: /Planning context/i })).not.toBeInTheDocument();
    expect(container.querySelector(".workspace-grid")).toHaveAttribute("data-context-rail", "closed");
    expect(screen.getByRole("button", { name: /Open details/i })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Open details/i }));

    expect(screen.getByRole("complementary", { name: /Planning context/i })).toBeInTheDocument();
    expect(container.querySelector(".workspace-grid")).toHaveAttribute("data-context-rail", "open");
  });

  it("opens the right context drawer when selecting a row while details are hidden", async () => {
    const user = userEvent.setup();
    const { container } = render(<SagittariusApp />);

    expect(container.querySelector(".workspace-grid")).toHaveAttribute("data-context-rail", "closed");

    await user.click(screen.getByRole("button", { name: /Select stop Victoria Peak/i }));

    const context = screen.getByRole("complementary", { name: /Planning context/i });
    expect(container.querySelector(".workspace-grid")).toHaveAttribute("data-context-rail", "open");
    expect(within(context).getByRole("heading", { name: /Victoria Peak/i })).toBeInTheDocument();
  });

  it("uses selected table row to drive the right context rail", async () => {
    const user = userEvent.setup();
    render(<SagittariusApp />);

    await user.click(screen.getByRole("button", { name: /Select stop Victoria Peak/i }));

    const context = screen.getByRole("complementary", { name: /Planning context/i });
    expect(within(context).getByRole("heading", { name: /Victoria Peak/i })).toBeInTheDocument();
    expect(within(context).getAllByText(/The Peak Tram/i).length).toBeGreaterThan(0);
  });

  it("opens details when clicking anywhere on an itinerary row", async () => {
    const { container } = render(<SagittariusApp />);

    expect(container.querySelector(".workspace-grid")).toHaveAttribute("data-context-rail", "closed");

    fireEvent.click(screen.getByRole("row", { name: /Open details for Victoria Peak/i }));

    const context = screen.getByRole("complementary", { name: /Planning context/i });
    expect(within(context).getByRole("heading", { name: /Victoria Peak/i })).toBeInTheDocument();
    expect(container.querySelector(".workspace-grid")).toHaveAttribute("data-context-rail", "open");
  });

  it("closes the right context drawer when clicking outside it", async () => {
    const user = userEvent.setup();
    const { container } = render(<SagittariusApp />);

    await user.click(screen.getByRole("button", { name: /Open details/i }));
    expect(container.querySelector(".workspace-grid")).toHaveAttribute("data-context-rail", "open");

    await user.click(screen.getByRole("region", { name: /Smart itinerary table/i }));

    expect(container.querySelector(".workspace-grid")).toHaveAttribute("data-context-rail", "closed");
    expect(screen.queryByRole("complementary", { name: /Planning context/i })).not.toBeInTheDocument();
  });

  it("keeps the right context drawer open when clicking inside it", async () => {
    const user = userEvent.setup();
    const { container } = render(<SagittariusApp />);

    await user.click(screen.getByRole("button", { name: /Open details/i }));
    const context = screen.getByRole("complementary", { name: /Planning context/i });

    await user.click(context);

    expect(container.querySelector(".workspace-grid")).toHaveAttribute("data-context-rail", "open");
    expect(screen.getByRole("complementary", { name: /Planning context/i })).toBeInTheDocument();
  });

  it("collapses and expands day groups", async () => {
    const user = userEvent.setup();
    render(<SagittariusApp />);

    await user.click(screen.getByRole("button", { name: /Collapse Day 2/i }));

    expect(screen.queryByRole("button", { name: /Select stop Dim Dim Sum/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Select stop Victoria Peak/i })).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Expand Day 2/i }));

    expect(screen.getByRole("button", { name: /Select stop Dim Dim Sum/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Select stop Victoria Peak/i })).toBeInTheDocument();
  });

  it("reorders itinerary rows with drag and drop", () => {
    render(<SagittariusApp />);

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
    render(<SagittariusApp />);

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
    render(<SagittariusApp />);

    expect(screen.getByRole("button", { name: /เพิ่มสถานที่ \/ กิจกรรม/i })).toBeEnabled();

    await user.selectOptions(screen.getByLabelText(/Role preview/i), "member-viewer");

    expect(screen.getByRole("button", { name: /เพิ่มสถานที่ \/ กิจกรรม/i })).toBeDisabled();
    expect(screen.getByText(/editing requires organizer access/i)).toBeInTheDocument();
  });

  it("adds a new itinerary stop from the header action", async () => {
    const user = userEvent.setup();
    render(<SagittariusApp />);

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
    render(<SagittariusApp />);

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
