import { fireEvent, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { tripFixture } from "@/src/trip/trip-fixtures";
import { pathIdMain, pathIdStoryPlanA, pathIdStoryPlanB } from "@/src/features/itinerary/testing";
import { StopDialog } from "./StopDialog";
import { renderStopDialog as render, renderStopDialogEn as renderEn } from "./StopDialog.test-support";

describe("StopDialog", () => {
  it("trims submitted values and allows optional end time", async () => {
    const onSubmit = vi.fn();
    render(<StopDialog mode="create" onClose={vi.fn()} onSubmit={onSubmit} />);

    fireEvent.change(screen.getByLabelText("กิจกรรม"), { target: { value: "  Dessert stop  " } });
    fireEvent.change(screen.getByLabelText("สถานที่"), { target: { value: "  Central  " } });
    fireEvent.change(screen.getByLabelText("ประเภท"), { target: { value: "experience" } });
    fireEvent.change(screen.getByLabelText("การเดินทาง"), { target: { value: "  walk  " } });
    fireEvent.change(screen.getByLabelText("โน้ต"), { target: { value: "  book ahead  " } });
    fireEvent.submit(screen.getByRole("button", { name: "บันทึกกิจกรรม" }).closest("form")!);

    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({
      activity: "Dessert stop",
      place: "Central",
      endTime: null,
      durationMinutes: null,
      activityType: "experience",
      transportation: "walk",
      note: "book ahead",
    }));
  });

  it("keeps add templates intentionally small and hides technical fields behind more options", () => {
    renderEn(<StopDialog mode="create" onClose={vi.fn()} onSubmit={vi.fn()} />);

    expect(screen.getByLabelText("Type")).toHaveTextContent("Journey");
    expect(screen.getByLabelText("Type")).toHaveTextContent("Stay");
    expect(screen.getByLabelText("Type")).toHaveTextContent("Activity / place");
    expect(screen.getByLabelText("Type")).toHaveTextContent("Note / task");
    expect(screen.getByLabelText("Type")).not.toHaveTextContent("Food");
    expect(screen.getByLabelText("Type")).not.toHaveTextContent("Shopping");
    expect(screen.getByText("More options").closest("details")).not.toHaveAttribute("open");
    expect(screen.getByLabelText("Item kind")).toBeInTheDocument();
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

  it("does not let a sub-activity submit as a plan block", () => {
    const onSubmit = vi.fn();
    renderEn(
      <StopDialog
        mode="edit"
        initialItem={{
          ...tripFixture.planItems[1],
          id: "child-checkin",
          activity: "Check in",
          parentItemId: "block-flight",
          isPlanBlock: true,
        }}
        onClose={vi.fn()}
        onSubmit={onSubmit}
      />,
    );

    expect(screen.queryByLabelText("Plan block")).not.toBeInTheDocument();

    fireEvent.submit(screen.getByRole("button", { name: "Save changes" }).closest("form")!);

    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({
      parentItemId: "block-flight",
      isPlanBlock: false,
    }));
  });

  it("prefills a quick-created sub-activity parent in create mode", () => {
    const onSubmit = vi.fn();
    renderEn(
      <StopDialog
        mode="create"
        initialDay="2026-06-19"
        initialParentItemId="block-flight"
        onClose={vi.fn()}
        onSubmit={onSubmit}
      />,
    );

    expect(screen.getByLabelText("Plan block")).toBeDisabled();

    fireEvent.change(screen.getByLabelText("Activity"), { target: { value: "Check in" } });
    fireEvent.change(screen.getByLabelText("Place"), { target: { value: "DMK" } });
    fireEvent.submit(screen.getByRole("button", { name: "Save activity" }).closest("form")!);

    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({
      day: "2026-06-19",
      parentItemId: "block-flight",
      isPlanBlock: false,
    }));
  });

  it("shows a save error when async submit fails", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockRejectedValue(new Error("version conflict"));
    renderEn(<StopDialog mode="create" onClose={vi.fn()} onSubmit={onSubmit} />);

    fireEvent.change(screen.getByLabelText("Activity"), { target: { value: "Airport transfer" } });
    fireEvent.change(screen.getByLabelText("Place"), { target: { value: "HKG" } });
    await user.click(screen.getByRole("button", { name: "Save activity" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Could not save activity");
    expect(screen.getByRole("dialog", { name: "Add activity" })).toBeInTheDocument();
  });

  it("submits the selected day when editing one stop", async () => {
    const onSubmit = vi.fn();
    render(<StopDialog mode="edit" startDate="2026-06-18" endDate="2026-06-23" initialItem={tripFixture.planItems[0]} onClose={vi.fn()} onSubmit={onSubmit} />);

    fireEvent.change(screen.getByLabelText("วัน"), { target: { value: "2026-06-20" } });
    fireEvent.submit(screen.getByRole("button", { name: "บันทึกการแก้ไข" }).closest("form")!);

    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ day: "2026-06-20" }));
  });

  it("submits the selected manual plan path when editing one stop", () => {
    const onSubmit = vi.fn();
    render(
      <StopDialog
        mode="edit"
        startDate="2026-06-18"
        endDate="2026-06-23"
        initialItem={{ ...tripFixture.planItems[0], pathRole: "main" }}
        manualPathOptions={[
          { id: pathIdMain, name: "Main" },
          { id: pathIdStoryPlanA, name: "Plan A" },
          { id: pathIdStoryPlanB, name: "Plan B" },
        ]}
        onClose={vi.fn()}
        onSubmit={onSubmit}
      />,
    );

    fireEvent.change(screen.getByLabelText("แผน"), { target: { value: pathIdStoryPlanB } });
    fireEvent.submit(screen.getByRole("button", { name: "บันทึกการแก้ไข" }).closest("form")!);

    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ pathId: pathIdStoryPlanB }));
  });
});
