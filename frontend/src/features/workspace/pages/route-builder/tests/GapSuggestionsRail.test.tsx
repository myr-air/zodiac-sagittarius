import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithI18n } from "@/src/i18n/test-utils";
import { GapSuggestionsRail } from "../GapSuggestionsRail";
import type { Waypoint } from "@/src/trip/waypoints/waypoint-types";

const tripId = "trip-1";

const closeWaypoints: Waypoint[] = [
  { id: "a", tripId, name: "A", lat: 0, lng: 0, sortOrder: 1 },
  { id: "b", tripId, name: "B", lat: 0, lng: 0.1, sortOrder: 2 },
];

const farWaypoints: Waypoint[] = [
  { id: "a", tripId, name: "A", lat: 0, lng: 0, sortOrder: 1 },
  { id: "b", tripId, name: "B", lat: 1, lng: 0, sortOrder: 2 },
];

describe("GapSuggestionsRail", () => {
  it("renders empty state when there are no large gaps", () => {
    renderWithI18n(
      <GapSuggestionsRail waypoints={closeWaypoints} onSelect={vi.fn()} />,
    );

    expect(screen.getByText("No suggestions — add a stop manually")).toBeInTheDocument();
  });

  it("renders a suggestion for each large gap", () => {
    renderWithI18n(
      <GapSuggestionsRail waypoints={farWaypoints} onSelect={vi.fn()} />,
    );

    expect(screen.getAllByTestId("gap-suggestion")).toHaveLength(1);
    expect(screen.getByText(/Stop between A and B/)).toBeInTheDocument();
  });

  it("calls onSelect when a suggestion is clicked", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();

    renderWithI18n(
      <GapSuggestionsRail waypoints={farWaypoints} onSelect={onSelect} />,
    );

    const button = screen.getByTestId("gap-suggestion");
    await user.click(button);

    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSelect.mock.calls[0][0]).toMatchObject({
      category: expect.any(String),
      name: expect.stringContaining("Stop between"),
      gapIndex: 0,
    });
  });

  it("shows the selected suggestion with the selected style", () => {
    renderWithI18n(
      <GapSuggestionsRail
        waypoints={farWaypoints}
        selectedSuggestionId="gap-a-b"
        onSelect={vi.fn()}
      />,
    );

    const button = screen.getByTestId("gap-suggestion");
    expect(button.className).toContain("bg-(--color-route-soft)");
  });
});
