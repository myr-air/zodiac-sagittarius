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

  it("shows transportation detail fields and submits a compatible travel payload", () => {
    const onSubmit = vi.fn();
    renderEn(<StopDialog mode="create" onClose={vi.fn()} onSubmit={onSubmit} />);

    fireEvent.change(screen.getByLabelText("Type"), { target: { value: "transportation" } });
    expect(screen.getByLabelText("Place")).not.toBeRequired();
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

  it("shows event fields and maps events to attraction itinerary items", () => {
    const onSubmit = vi.fn();
    renderEn(<StopDialog mode="create" onClose={vi.fn()} onSubmit={onSubmit} />);

    fireEvent.change(screen.getByLabelText("Type"), { target: { value: "event" } });
    expect(screen.getByLabelText("Round / time slot")).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Activity"), { target: { value: "Talent park light show" } });
    fireEvent.change(screen.getByLabelText("Place"), { target: { value: "Talent park" } });
    fireEvent.change(screen.getByLabelText("Round / time slot"), { target: { value: "19:30 / 20:30 / 21:30" } });
    fireEvent.submit(screen.getByRole("button", { name: "Save activity" }).closest("form")!);

    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({
      activityType: "attraction",
      details: {
        kind: "event",
        entryWindow: "19:30 / 20:30 / 21:30",
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
