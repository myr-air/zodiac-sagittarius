import { fireEvent, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { pathIdMain, pathIdStoryPlanA, pathIdStoryPlanB } from "@/src/features/itinerary/testing";
import { tripFixture } from "@/src/trip/testing/fixtures/trip-fixtures";
import { StopDialog } from "../StopDialog";
import { renderStopDialog as render } from "../testing/support/stop-dialog-render";

describe("StopDialog edit mode", () => {
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
