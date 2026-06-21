import { fireEvent, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { tripFixture } from "@/src/trip/trip-fixtures";
import { StopDialog } from "../StopDialog";
import { renderStopDialogEn as renderEn } from "../testing/support/stop-dialog-render";

describe("StopDialog category details", () => {
  it("shows transportation detail fields and submits a compatible travel payload", () => {
    const onSubmit = vi.fn();
    renderEn(<StopDialog mode="create" onClose={vi.fn()} onSubmit={onSubmit} />);

    fireEvent.change(screen.getByLabelText("Type"), { target: { value: "transportation" } });
    expect(screen.getByLabelText("Place")).not.toBeRequired();
    expect(screen.getByLabelText("Plan block")).toBeChecked();
    fireEvent.change(screen.getByLabelText("Activity"), { target: { value: "DMK -> HKG" } });
    fireEvent.change(screen.getByLabelText("From"), { target: { value: "Don Mueang International Airport (DMK)" } });
    fireEvent.change(screen.getByLabelText("To"), { target: { value: "Hong Kong International Airport (HKG)" } });
    fireEvent.change(screen.getByLabelText("By"), { target: { value: "Plane" } });
    fireEvent.change(screen.getByLabelText("Ticket / pass"), { target: { value: "FD ticket" } });
    fireEvent.change(screen.getByLabelText("Cost / spend note"), { target: { value: "prepaid" } });
    fireEvent.submit(screen.getByRole("button", { name: "Save activity" }).closest("form")!);

    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({
      activity: "DMK -> HKG",
      activityType: "travel",
      itemKind: "travel",
      isPlanBlock: true,
      details: {
        kind: "transportation",
        origin: "Don Mueang International Airport (DMK)",
        destination: "Hong Kong International Airport (HKG)",
        mode: "Plane",
        ticketRef: "FD ticket",
        costNote: "prepaid",
      },
      place: "Hong Kong International Airport (HKG)",
      transportation: "",
      note: "",
    }));
  });

  it("uses note templates for flexible planning notes without required times", () => {
    const onSubmit = vi.fn();
    renderEn(<StopDialog mode="create" onClose={vi.fn()} onSubmit={onSubmit} />);

    fireEvent.change(screen.getByLabelText("Type"), { target: { value: "task" } });
    fireEvent.change(screen.getByLabelText("Activity"), { target: { value: "Collect passport spelling" } });
    fireEvent.change(screen.getByLabelText("Place"), { target: { value: "Shared sheet" } });
    fireEvent.change(screen.getByLabelText("Detail"), { target: { value: "Ask everyone before ticket issue" } });
    fireEvent.submit(screen.getByRole("button", { name: "Save activity" }).closest("form")!);

    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({
      activityType: "experience",
      itemKind: "note",
      timeMode: "flexible",
      startTime: "",
      endTime: null,
      durationMinutes: null,
      details: {
        kind: "task",
        detail: "Ask everyone before ticket issue",
      },
    }));
  });

  it("prefills structured category detail fields when editing a stop", () => {
    renderEn(
      <StopDialog
        mode="edit"
        initialItem={{
          ...tripFixture.planItems[0],
          activity: "DMK -> HKG",
          activityType: "travel",
          place: "",
          transportation: "Plane",
          details: {
            kind: "transportation",
            origin: "Don Mueang International Airport",
            destination: "Hong Kong International Airport",
            mode: "Plane",
            ticketRef: "FD ticket",
            costNote: "Prepaid group fare",
          },
        }}
        onClose={vi.fn()}
        onSubmit={vi.fn()}
      />,
    );

    expect(screen.getByLabelText("Type")).toHaveValue("transportation");
    expect(screen.getByLabelText("From")).toHaveValue("Don Mueang International Airport");
    expect(screen.getByLabelText("To")).toHaveValue("Hong Kong International Airport");
    expect(screen.getByLabelText("By")).toHaveValue("Plane");
    expect(screen.getByLabelText("Ticket / pass")).toHaveValue("FD ticket");
    expect(screen.queryByLabelText("Transportation")).not.toBeInTheDocument();
  });

  it("detects route activity text and fills transportation times", () => {
    renderEn(<StopDialog mode="create" onClose={vi.fn()} onSubmit={vi.fn()} />);

    fireEvent.change(screen.getByLabelText("Activity"), { target: { value: "Shenzhen -> Hongkong (8.22am -8.36am)" } });

    expect(screen.getByLabelText("Type")).toHaveValue("transportation");
    expect(screen.getByLabelText("From")).toHaveValue("Shenzhen");
    expect(screen.getByLabelText("To")).toHaveValue("Hongkong");
    expect(screen.getByLabelText("Start time")).toHaveValue("08:22");
    expect(screen.getByLabelText("End time")).toHaveValue("08:36");
    expect(screen.getByText("14 m")).toBeInTheDocument();
  });

  it("uses the generic activity template for ordinary places and activities", () => {
    const onSubmit = vi.fn();
    renderEn(<StopDialog mode="create" onClose={vi.fn()} onSubmit={onSubmit} />);

    fireEvent.change(screen.getByLabelText("Type"), { target: { value: "experience" } });
    expect(screen.getByLabelText("Provider")).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Activity"), { target: { value: "Talent park light show" } });
    fireEvent.change(screen.getByLabelText("Place"), { target: { value: "Talent park" } });
    fireEvent.change(screen.getByLabelText("Provider"), { target: { value: "City park" } });
    fireEvent.submit(screen.getByRole("button", { name: "Save activity" }).closest("form")!);

    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({
      activityType: "experience",
      details: {
        kind: "experience",
        provider: "City park",
      },
      note: "",
    }));
  });
});
