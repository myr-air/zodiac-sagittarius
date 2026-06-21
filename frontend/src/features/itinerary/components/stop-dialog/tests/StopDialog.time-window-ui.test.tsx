import { fireEvent, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { StopDialog } from "../StopDialog";
import {
  renderStopDialog as render,
  renderStopDialogEn as renderEn,
} from "../testing/support/stop-dialog-render";

describe("StopDialog time window UI", () => {
  it("uses Joii time inputs, derived duration text, and a standard close icon", () => {
    render(<StopDialog mode="create" onClose={vi.fn()} onSubmit={vi.fn()} />);

    expect(screen.getByLabelText("เวลาเริ่ม")).toHaveAttribute("type", "text");
    expect(screen.getByRole("group", { name: "ช่วงเวลา" })).toBeInTheDocument();
    expect(screen.getByText("ระยะเวลา")).toBeInTheDocument();
    expect(screen.getByText("ไม่ระบุ")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Toggle next-day end activity" }),
    ).toHaveTextContent("+1");
    expect(screen.getByRole("dialog", { name: "เพิ่มกิจกรรม" })).toHaveClass(
      "stop-dialog",
      "shadow-[0_14px_34px_rgb(15_23_42_/_0.16)]",
    );
    expect(
      screen.getByRole("dialog", { name: "เพิ่มกิจกรรม" }).className,
    ).not.toContain("0_24px_70px");
    expect(screen.getAllByRole("button", { name: "Open time picker" })).toHaveLength(2);
    expect(screen.getByLabelText("เวลาเริ่ม")).toHaveAttribute(
      "id",
      "stop-start-time",
    );
    expect(screen.getByText("เวลาเริ่ม").closest("label")).toHaveAttribute(
      "for",
      "stop-start-time",
    );
    expect(screen.getByLabelText("เวลาจบ")).toHaveAttribute(
      "id",
      "stop-end-time",
    );
    expect(screen.getByLabelText("เวลาจบ")).not.toBeRequired();
    expect(screen.getByText("ระยะเวลา")).toBeInTheDocument();
    expect(screen.getByText("ไม่ระบุ")).toBeInTheDocument();
    expect(screen.queryByLabelText("ชั่วโมง")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("นาที")).not.toBeInTheDocument();
    expect(
      screen
        .getByRole("button", { name: "ปิดฟอร์ม" })
        .querySelector("svg path"),
    ).toHaveAttribute("d", "M18 6 6 18M6 6l12 12");
    expect(screen.queryByRole("button", { name: "ลบจุดนี้" })).not.toBeInTheDocument();
    expect(screen.queryByLabelText("วัน")).not.toBeInTheDocument();
  });

  it("derives duration from start and end time", () => {
    renderEn(<StopDialog mode="create" onClose={vi.fn()} onSubmit={vi.fn()} />);

    expect(screen.getByLabelText("End time")).toHaveValue("");
    expect(screen.getByText("Not set")).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("End time"), {
      target: { value: "18:00" },
    });
    expect(screen.getByText("1 h 30 m")).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("End time"), { target: { value: "" } });
    expect(screen.getByText("Not set")).toBeInTheDocument();
  });

  it("clears stale hidden times when switching to flexible time", () => {
    const onSubmit = vi.fn();
    renderEn(<StopDialog mode="create" onClose={vi.fn()} onSubmit={onSubmit} />);

    fireEvent.change(screen.getByLabelText("End time"), {
      target: { value: "21:30" },
    });
    expect(screen.getByText("5 h")).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Time mode"), {
      target: { value: "flexible" },
    });
    expect(screen.getByLabelText("Start time")).toHaveValue("");
    expect(screen.getByLabelText("End time")).toHaveValue("");

    fireEvent.change(screen.getByLabelText("Activity"), {
      target: { value: "Tsim Sha Tsui shopping" },
    });
    fireEvent.change(screen.getByLabelText("Place"), {
      target: { value: "Tsim Sha Tsui" },
    });
    fireEvent.submit(
      screen.getByRole("button", { name: "Save activity" }).closest("form")!,
    );

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        timeMode: "flexible",
        startTime: "",
        endTime: null,
        endOffsetDays: 0,
        durationMinutes: null,
      }),
    );
  });

  it("submits explicit cross-day end time windows", () => {
    const onSubmit = vi.fn();
    renderEn(<StopDialog mode="create" onClose={vi.fn()} onSubmit={onSubmit} />);

    fireEvent.change(screen.getByLabelText("Activity"), {
      target: { value: "Night flight" },
    });
    fireEvent.change(screen.getByLabelText("Place"), {
      target: { value: "Airport" },
    });
    fireEvent.change(screen.getByLabelText("Start time"), {
      target: { value: "23:00" },
    });
    fireEvent.change(screen.getByLabelText("End time"), {
      target: { value: "02:00" },
    });
    fireEvent.submit(
      screen.getByRole("button", { name: "Save activity" }).closest("form")!,
    );

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        startTime: "23:00",
        endTime: "02:00",
        endOffsetDays: 1,
        durationMinutes: 180,
      }),
    );
  });

  it("recomputes cross-day duration when the start time moves after the end time", () => {
    const onSubmit = vi.fn();
    renderEn(<StopDialog mode="create" onClose={vi.fn()} onSubmit={onSubmit} />);

    fireEvent.change(screen.getByLabelText("Activity"), {
      target: { value: "Night flight" },
    });
    fireEvent.change(screen.getByLabelText("Place"), {
      target: { value: "Airport" },
    });
    fireEvent.change(screen.getByLabelText("End time"), {
      target: { value: "02:00" },
    });
    fireEvent.change(screen.getByLabelText("Start time"), {
      target: { value: "23:00" },
    });

    expect(screen.getByText("3 h")).toBeInTheDocument();
    fireEvent.submit(
      screen.getByRole("button", { name: "Save activity" }).closest("form")!,
    );

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        startTime: "23:00",
        endTime: "02:00",
        endOffsetDays: 1,
        durationMinutes: 180,
      }),
    );
  });
});
