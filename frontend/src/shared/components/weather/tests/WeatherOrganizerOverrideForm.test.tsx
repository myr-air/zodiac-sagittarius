import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { weatherBriefings } from "../testing/WeatherBriefing.fixtures";
import { WeatherOrganizerOverrideForm } from "../WeatherOrganizerOverrideForm";

describe("WeatherOrganizerOverrideForm", () => {
  it("submits trimmed overrides and clears blank fields to null", async () => {
    const onSaveOverrides = vi.fn();
    const briefing = {
      ...weatherBriefings[0],
      manualOverrides: {
        outfitAdvice: " Existing outfit note ",
        festivalNote: "Existing festival note",
        factsNote: "Existing fact note",
      },
    };
    render(<WeatherOrganizerOverrideForm briefing={briefing} locale="en" onSaveOverrides={onSaveOverrides} />);

    await userEvent.clear(screen.getByLabelText(/outfit advice override/i));
    await userEvent.type(screen.getByLabelText(/outfit advice override/i), "  Bring sandals  ");
    await userEvent.clear(screen.getByLabelText(/festival note override/i));
    await userEvent.clear(screen.getByLabelText(/facts note override/i));
    await userEvent.click(screen.getByRole("button", { name: /save/i }));

    expect(onSaveOverrides).toHaveBeenCalledWith("2026-07-11", 1, {
      outfitAdvice: "Bring sandals",
      festivalNote: null,
      factsNote: null,
    });
  });

  it("localizes organizer fields", () => {
    render(<WeatherOrganizerOverrideForm briefing={weatherBriefings[0]} locale="th" onSaveOverrides={() => {}} />);

    expect(screen.getByLabelText(/ปรับคำแนะนำการแต่งตัว/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/ปรับโน้ตเทศกาล/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/ปรับเกร็ดประจำวัน/i)).toBeInTheDocument();
  });
});
