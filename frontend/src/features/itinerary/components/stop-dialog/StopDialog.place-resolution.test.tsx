import { fireEvent, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { StopDialog } from "./StopDialog";
import { renderStopDialog as render, renderStopDialogEn as renderEn } from "./StopDialog.test-support";

describe("StopDialog place resolution", () => {
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

    expect(screen.getByRole("alert")).toHaveTextContent(
      /Coordinates could not be resolved|ยังหาพิกัดไม่ได้/i,
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

  it("submits organizer map links as first-class itinerary source data", async () => {
    const onSubmit = vi.fn();
    renderEn(<StopDialog mode="create" onClose={vi.fn()} onSubmit={onSubmit} />);

    fireEvent.change(screen.getByLabelText("Activity"), {
      target: { value: "Hong Kong Disneyland" },
    });
    fireEvent.change(screen.getByLabelText("Place"), {
      target: { value: "Hong Kong Disneyland" },
    });
    fireEvent.change(screen.getByLabelText("Map link"), {
      target: {
        value:
          "https://uri.amap.com/marker?position=114.0413,22.3129&name=Hong%20Kong%20Disneyland",
      },
    });
    fireEvent.submit(screen.getByRole("button", { name: "Save activity" }).closest("form")!);

    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({
      activity: "Hong Kong Disneyland",
      mapLink:
        "https://uri.amap.com/marker?position=114.0413,22.3129&name=Hong%20Kong%20Disneyland",
      place: "Hong Kong Disneyland",
    }));
  });
});
