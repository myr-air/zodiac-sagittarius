import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { messages } from "@/src/i18n/messages";
import { formatDuration } from "@/src/features/itinerary/lib/itinerary-display";
import { ItineraryHeaderMeta } from "../ItineraryHeaderMeta";

describe("ItineraryHeaderMeta", () => {
  it("renders shared trip header metadata from one source of truth", () => {
    render(
      <ItineraryHeaderMeta
        daysCount={3}
        endDate="2026-06-20"
        itemsCount={10}
        locale="en"
        startDate="2026-06-18"
        tDates={messages.en.dates}
        tItinerary={messages.en.itinerary}
        totalMinutes={135}
        warningCount={2}
      />,
    );

    expect(screen.getByText(/Jun 18/i)).toBeInTheDocument();
    expect(
      screen.getByText(messages.en.itinerary.dayItems({ days: 3, stops: 10 })),
    ).toBeInTheDocument();
    expect(
      screen.getByText(messages.en.dates.warningCount({ count: 2 })),
    ).toBeInTheDocument();
    expect(
      screen.getByText((content) =>
        content.includes(formatDuration(135, "en")),
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText((content) =>
        content.includes(messages.en.dates.planned),
      ),
    ).toBeInTheDocument();
  });
});
