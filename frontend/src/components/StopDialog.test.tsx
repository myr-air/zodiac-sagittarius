import { fireEvent, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { tripFixture } from "@/src/trip/trip-fixtures";
import { renderWithI18n } from "@/src/i18n/test-utils";
import { StopDialog } from "./StopDialog";

const render = (ui: Parameters<typeof renderWithI18n>[0]) => renderWithI18n(ui, { locale: "th" });

describe("StopDialog", () => {
  it("trims submitted values and clamps invalid durations", async () => {
    const onSubmit = vi.fn();
    render(<StopDialog mode="create" onClose={vi.fn()} onSubmit={onSubmit} />);

    fireEvent.change(screen.getByLabelText("กิจกรรม"), { target: { value: "  Dessert stop  " } });
    fireEvent.change(screen.getByLabelText("สถานที่"), { target: { value: "  Central  " } });
    fireEvent.change(screen.getByLabelText("ชั่วโมง"), { target: { value: "0" } });
    fireEvent.change(screen.getByLabelText("นาที"), { target: { value: "0" } });
    fireEvent.change(screen.getByLabelText("ประเภท"), { target: { value: "food" } });
    fireEvent.change(screen.getByLabelText("การเดินทาง"), { target: { value: "  walk  " } });
    fireEvent.change(screen.getByLabelText("โน้ต"), { target: { value: "  book ahead  " } });
    fireEvent.submit(screen.getByRole("button", { name: "บันทึกกิจกรรม" }).closest("form")!);

    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({
      activity: "Dessert stop",
      place: "Central",
      durationMinutes: 1,
      activityType: "food",
      transportation: "walk",
      note: "book ahead",
    }));
  });

  it("prefills edit mode from the selected itinerary item and closes from both controls", async () => {
    const onClose = vi.fn();
    const onDelete = vi.fn();
    render(<StopDialog mode="edit" startDate="2026-06-18" endDate="2026-06-23" initialItem={tripFixture.planItems[0]} onClose={onClose} onDelete={onDelete} onSubmit={vi.fn()} />);

    expect(screen.getByRole("heading", { name: "แก้ไขรายละเอียด" })).toBeInTheDocument();
    expect(screen.getByDisplayValue(tripFixture.planItems[0].activity)).toBeInTheDocument();
    expect(screen.getByLabelText("วัน")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "ลบจุดนี้" }));
    expect(onDelete).toHaveBeenCalledTimes(1);

    await userEvent.click(screen.getByRole("button", { name: "ยกเลิก" }));
    await userEvent.click(screen.getByRole("button", { name: "ปิดฟอร์ม" }));
    expect(onClose).toHaveBeenCalledTimes(2);
  });

  it("uses native time input, split duration controls, and a standard close icon", () => {
    render(<StopDialog mode="create" onClose={vi.fn()} onSubmit={vi.fn()} />);

    expect(screen.getByLabelText("เวลา")).toHaveAttribute("type", "time");
    expect(screen.getByLabelText("เวลา")).toHaveAttribute("id", "stop-start-time");
    expect(screen.getByText("เวลา").closest("label")).toHaveAttribute("for", "stop-start-time");
    expect(screen.getByLabelText("ชั่วโมง")).toBeInTheDocument();
    expect(screen.getByLabelText("นาที")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "ปิดฟอร์ม" }).querySelector("svg path")).toHaveAttribute("d", "M18 6 6 18M6 6l12 12");
    expect(screen.queryByRole("button", { name: "ลบจุดนี้" })).not.toBeInTheDocument();
    expect(screen.queryByLabelText("วัน")).not.toBeInTheDocument();
  });

  it("submits the selected day when editing one stop", async () => {
    const onSubmit = vi.fn();
    render(<StopDialog mode="edit" startDate="2026-06-18" endDate="2026-06-23" initialItem={tripFixture.planItems[0]} onClose={vi.fn()} onSubmit={onSubmit} />);

    fireEvent.change(screen.getByLabelText("วัน"), { target: { value: "2026-06-20" } });
    fireEvent.submit(screen.getByRole("button", { name: "บันทึกการแก้ไข" }).closest("form")!);

    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ day: "2026-06-20" }));
  });
});
