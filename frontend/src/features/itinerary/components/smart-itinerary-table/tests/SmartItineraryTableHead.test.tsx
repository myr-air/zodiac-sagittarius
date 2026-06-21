import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { messages } from "@/src/i18n/messages";
import { SmartItineraryTableHead } from "../SmartItineraryTableHead";

describe("SmartItineraryTableHead", () => {
  it("renders itinerary column headers", () => {
    render(
      <table>
        <SmartItineraryTableHead labels={messages.en.itinerary.headers} />
      </table>,
    );

    expect(screen.getByText("Time")).toBeInTheDocument();
    expect(screen.getByText("Type")).toBeInTheDocument();
    expect(screen.getByText("Activity / place")).toBeInTheDocument();
    expect(screen.getByText("Actions")).toBeInTheDocument();
  });
});
