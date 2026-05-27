import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { SagittariusApp } from "@/src/app/SagittariusApp";

describe("Sagittarius cockpit UI", () => {
  it("opens directly into the planning cockpit instead of a marketing landing page", () => {
    render(<SagittariusApp />);

    expect(screen.getByRole("heading", { name: /Hong Kong \+ Shenzhen Trip/i })).toBeInTheDocument();
    expect(screen.getByRole("navigation", { name: /Sagittarius planning navigation/i })).toBeInTheDocument();
    expect(screen.getByRole("region", { name: /Smart itinerary table/i })).toBeInTheDocument();
    expect(screen.queryByText(/hero/i)).not.toBeInTheDocument();
  });

  it("matches the dense planning cockpit skeleton from the reference", () => {
    render(<SagittariusApp />);

    expect(screen.getByRole("banner", { name: /Trip command bar/i })).toHaveClass("top-app-bar");
    expect(screen.getByRole("link", { name: /แผนการเดินทาง/i })).toHaveClass("rail-link--active");
    expect(screen.getByRole("tablist", { name: /Planning views/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /Smart Itinerary Table/i })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("columnheader", { name: /^เวลา$/i })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: /แผนที่ \/ ลิงก์/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Select stop Dim Dim Sum/i })).toBeInTheDocument();
    expect(screen.queryByLabelText(/Plan variant/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/Selected day/i)).not.toBeInTheDocument();
  });

  it("collapses the left rail and keeps labels accessible", async () => {
    const user = userEvent.setup();
    render(<SagittariusApp />);

    await user.click(screen.getByRole("button", { name: /Collapse navigation/i }));

    const nav = screen.getByRole("navigation", { name: /Sagittarius planning navigation/i });
    expect(nav).toHaveAttribute("data-collapsed", "true");
    expect(screen.getByRole("button", { name: /Expand navigation/i })).toHaveAttribute("aria-expanded", "false");
  });

  it("uses selected table row to drive the right context rail", async () => {
    const user = userEvent.setup();
    render(<SagittariusApp />);

    await user.click(screen.getByRole("button", { name: /Select stop Victoria Peak/i }));

    const context = screen.getByRole("complementary", { name: /Planning context/i });
    expect(within(context).getByRole("heading", { name: /Victoria Peak/i })).toBeInTheDocument();
    expect(within(context).getAllByText(/The Peak Tram/i).length).toBeGreaterThan(0);
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
