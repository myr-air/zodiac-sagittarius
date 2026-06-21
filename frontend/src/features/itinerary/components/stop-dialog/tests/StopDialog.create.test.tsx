import { fireEvent, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { StopDialog } from "../StopDialog";
import {
  renderStopDialog as render,
  renderStopDialogEn as renderEn,
} from "../testing/StopDialog.test-support";

describe("StopDialog create mode", () => {
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
});
