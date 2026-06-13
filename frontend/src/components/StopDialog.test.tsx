import { fireEvent, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { tripFixture } from "@/src/trip/trip-fixtures";
import { renderWithI18n } from "@/src/i18n/test-utils";
import { StopDialog } from "./StopDialog";

const render = (ui: Parameters<typeof renderWithI18n>[0]) => renderWithI18n(ui, { locale: "th" });
const renderEn = (ui: Parameters<typeof renderWithI18n>[0]) => renderWithI18n(ui, { locale: "en" });

describe("StopDialog", () => {
  it("trims submitted values and clamps invalid durations", async () => {
    const onSubmit = vi.fn();
    render(<StopDialog mode="create" onClose={vi.fn()} onSubmit={onSubmit} />);

    fireEvent.change(screen.getByLabelText("กิจกรรม"), { target: { value: "  Dessert stop  " } });
    fireEvent.change(screen.getByLabelText("สถานที่"), { target: { value: "  Central  " } });
    fireEvent.change(screen.getByLabelText("ชั่วโมง"), { target: { value: "0" } });
    fireEvent.change(screen.getByLabelText("นาที"), { target: { value: "0" } });
    fireEvent.change(screen.getByLabelText("ประเภท"), { target: { value: "experience" } });
    fireEvent.change(screen.getByLabelText("การเดินทาง"), { target: { value: "  walk  " } });
    fireEvent.change(screen.getByLabelText("โน้ต"), { target: { value: "  book ahead  " } });
    fireEvent.submit(screen.getByRole("button", { name: "บันทึกกิจกรรม" }).closest("form")!);

    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({
      activity: "Dessert stop",
      place: "Central",
      durationMinutes: 1,
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

    expect(screen.getByLabelText("Plan block")).toBeDisabled();
    expect(screen.getByLabelText("Plan block")).not.toBeChecked();

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

  it("uses the Joii time input, split duration controls, and a standard close icon", () => {
    render(<StopDialog mode="create" onClose={vi.fn()} onSubmit={vi.fn()} />);

    expect(screen.getByLabelText("เวลาเริ่ม")).toHaveAttribute("type", "text");
    expect(screen.getByRole("dialog", { name: "เพิ่มกิจกรรม" })).toHaveClass(
      "stop-dialog",
      "shadow-[0_14px_34px_rgb(15_23_42_/_0.16)]",
    );
    expect(screen.getByRole("dialog", { name: "เพิ่มกิจกรรม" }).className).not.toContain("0_24px_70px");
    expect(screen.getAllByRole("button", { name: "Open time picker" })).toHaveLength(2);
    expect(screen.getByLabelText("เวลาเริ่ม")).toHaveAttribute("id", "stop-start-time");
    expect(screen.getByText("เวลาเริ่ม").closest("label")).toHaveAttribute("for", "stop-start-time");
    expect(screen.getByLabelText("เวลาจบ")).toHaveAttribute("id", "stop-end-time");
    expect(screen.getByLabelText("ชั่วโมง")).toBeInTheDocument();
    expect(screen.getByLabelText("นาที")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "ปิดฟอร์ม" }).querySelector("svg path")).toHaveAttribute("d", "M18 6 6 18M6 6l12 12");
    expect(screen.queryByRole("button", { name: "ลบจุดนี้" })).not.toBeInTheDocument();
    expect(screen.queryByLabelText("วัน")).not.toBeInTheDocument();
  });

  it("keeps end time and duration synchronized", () => {
    renderEn(<StopDialog mode="create" onClose={vi.fn()} onSubmit={vi.fn()} />);

    expect(screen.getByLabelText("End time")).toHaveValue("17:15");

    fireEvent.change(screen.getByLabelText("End time"), { target: { value: "18:00" } });
    expect(screen.getByLabelText("Hours")).toHaveValue(1);
    expect(screen.getByLabelText("Minutes")).toHaveValue("30");

    fireEvent.change(screen.getByLabelText("Hours"), { target: { value: "2" } });
    fireEvent.change(screen.getByLabelText("Minutes"), { target: { value: "0" } });
    expect(screen.getByLabelText("End time")).toHaveValue("18:30");
  });

  it("submits explicit cross-day end time windows", () => {
    const onSubmit = vi.fn();
    renderEn(<StopDialog mode="create" onClose={vi.fn()} onSubmit={onSubmit} />);

    fireEvent.change(screen.getByLabelText("Activity"), { target: { value: "Night flight" } });
    fireEvent.change(screen.getByLabelText("Place"), { target: { value: "Airport" } });
    fireEvent.change(screen.getByLabelText("Start time"), { target: { value: "23:00" } });
    fireEvent.change(screen.getByLabelText("End time"), { target: { value: "02:00" } });
    fireEvent.submit(screen.getByRole("button", { name: "Save activity" }).closest("form")!);

    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({
      startTime: "23:00",
      endTime: "02:00",
      endOffsetDays: 1,
      durationMinutes: 180,
    }));
  });

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
    expect(screen.getByLabelText("Hours")).toHaveValue(0);
    expect(screen.getByLabelText("Minutes")).toHaveValue("14");
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
          { id: "main", name: "Main" },
          { id: "path-2026-06-19-sub-a", name: "Plan A" },
          { id: "path-2026-06-19-sub-b", name: "Plan B" },
        ]}
        onClose={vi.fn()}
        onSubmit={onSubmit}
      />,
    );

    fireEvent.change(screen.getByLabelText("แผน"), { target: { value: "path-2026-06-19-sub-b" } });
    fireEvent.submit(screen.getByRole("button", { name: "บันทึกการแก้ไข" }).closest("form")!);

    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ pathId: "path-2026-06-19-sub-b" }));
  });

  it("shows ambiguous place candidates and submits the selected candidate", async () => {
    const onSubmit = vi.fn();
    render(
      <StopDialog
        mode="create"
        onClose={vi.fn()}
        onSubmit={onSubmit}
        placeResolution={{
          state: "ambiguous",
          candidates: [{
            name: "The Elements",
            address: "Austin Road West, Hong Kong",
            coordinates: { lat: 22.3049, lng: 114.1617 },
            mapLink: "https://www.openstreetmap.org/?mlat=22.3049&mlon=114.1617#map=17/22.3049/114.1617",
            confidence: 0.92,
            source: "nominatim",
            evidence: ["brave: The Elements"],
          }],
        }}
      />,
    );

    await userEvent.click(screen.getByRole("button", { name: /เลือก The Elements/i }));
    fireEvent.change(screen.getByLabelText("กิจกรรม"), { target: { value: "Dim Dim Sum" } });
    fireEvent.change(screen.getByLabelText("สถานที่"), { target: { value: "ติ่มซำ แถว Elements" } });
    fireEvent.submit(screen.getByRole("button", { name: "บันทึกกิจกรรม" }).closest("form")!);

    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({
      resolvedPlace: expect.objectContaining({
        name: "The Elements",
        coordinates: { lat: 22.3049, lng: 114.1617 },
      }),
      saveUnresolved: false,
    }));
  });

  it("allows saving an unresolved place when no candidate is chosen", async () => {
    const onSubmit = vi.fn();
    render(
      <StopDialog
        mode="create"
        onClose={vi.fn()}
        onSubmit={onSubmit}
        placeResolution={{ state: "unresolved", candidates: [] }}
      />,
    );

    fireEvent.change(screen.getByLabelText("กิจกรรม"), { target: { value: "Late snack" } });
    fireEvent.change(screen.getByLabelText("สถานที่"), { target: { value: "near hotel" } });
    await userEvent.click(screen.getByRole("button", { name: /บันทึกแบบยังไม่ระบุพิกัด/i }));

    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({
      activity: "Late snack",
      place: "near hotel",
      saveUnresolved: true,
    }));
  });
});
