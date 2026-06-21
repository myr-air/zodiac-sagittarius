import { fireEvent, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { tripFixture } from "@/src/trip/trip-fixtures";
import { StopDialog } from "../StopDialog";
import { renderStopDialogEn as renderEn } from "../testing/support/stop-dialog-render";

describe("StopDialog sub-activity handling", () => {
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
});
