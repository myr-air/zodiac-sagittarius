import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { tripFixture } from "@/src/demo/trip-fixtures";
import { StopDialog } from "./StopDialog";

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
    render(<StopDialog mode="edit" initialItem={tripFixture.planItems[0]} onClose={onClose} onSubmit={vi.fn()} />);

    expect(screen.getByRole("heading", { name: "แก้ไขรายละเอียด" })).toBeInTheDocument();
    expect(screen.getByDisplayValue(tripFixture.planItems[0].activity)).toBeInTheDocument();

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
  });
});
