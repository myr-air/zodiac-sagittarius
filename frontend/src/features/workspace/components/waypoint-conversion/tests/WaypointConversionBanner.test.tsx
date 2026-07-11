import { describe, it, expect, vi } from "vitest";
import { screen, fireEvent } from "@testing-library/react";
import { renderWithI18n } from "@/src/i18n/test-utils";
import { WaypointConversionBanner } from "../WaypointConversionBanner";
import type { Waypoint } from "@/src/trip/waypoints/waypoint-types";

function makeWp(id: string, sortOrder: number, lat = 35.6762, lng = 139.6503): Waypoint {
  return { id, tripId: "t1", name: `WP-${id}`, lat, lng, sortOrder };
}

const render = (ui: React.ReactElement) => renderWithI18n(ui, { locale: "en" });

describe("WaypointConversionBanner", () => {
  it("renders banner with correct waypoint count", () => {
    const wps = [makeWp("1", 1), makeWp("2", 2)];
    render(
      <WaypointConversionBanner
        waypoints={wps}
        startDate="2027-03-01"
        hasExistingItinerary={false}
        onConvert={vi.fn()}
        onDismiss={vi.fn()}
      />,
    );

    expect(screen.getByRole("status")).toBeInTheDocument();
    expect(screen.getByText(/Convert 2 waypoints into day structure/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Convert" })).toBeInTheDocument();
  });

  it("does not render when waypoints is empty", () => {
    const { container } = render(
      <WaypointConversionBanner
        waypoints={[]}
        startDate="2027-03-01"
        hasExistingItinerary={false}
        onConvert={vi.fn()}
        onDismiss={vi.fn()}
      />,
    );
    expect(container.firstChild).toBeNull();
  });

  it("does not render when hasExistingItinerary is true", () => {
    const { container } = render(
      <WaypointConversionBanner
        waypoints={[makeWp("1", 1)]}
        startDate="2027-03-01"
        hasExistingItinerary={true}
        onConvert={vi.fn()}
        onDismiss={vi.fn()}
      />,
    );
    expect(container.firstChild).toBeNull();
  });

  it("fires onConvert with day groups when convert clicked", () => {
    const onConvert = vi.fn();
    const wps = [
      makeWp("1", 1, 35.6762, 139.6503),
      makeWp("2", 2, 34.6937, 135.5023), // Far apart -> 2 days
    ];
    render(
      <WaypointConversionBanner
        waypoints={wps}
        startDate="2027-03-01"
        hasExistingItinerary={false}
        onConvert={onConvert}
        onDismiss={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Convert" }));
    expect(onConvert).toHaveBeenCalledTimes(1);
    const groups = onConvert.mock.calls[0][0];
    expect(groups).toHaveLength(2);
  });

  it("fires onDismiss when Not now clicked", () => {
    const onDismiss = vi.fn();
    render(
      <WaypointConversionBanner
        waypoints={[makeWp("1", 1)]}
        startDate="2027-03-01"
        hasExistingItinerary={false}
        onConvert={vi.fn()}
        onDismiss={onDismiss}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Not now" }));
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it("shows correct count in banner text for 1 waypoint", () => {
    render(
      <WaypointConversionBanner
        waypoints={[makeWp("1", 1)]}
        startDate="2027-03-01"
        hasExistingItinerary={false}
        onConvert={vi.fn()}
        onDismiss={vi.fn()}
      />,
    );

    expect(screen.getByText(/Convert 1 waypoints? into day structure/)).toBeInTheDocument();
  });

  it("shows correct count for 6 waypoints", () => {
    const wps = Array.from({ length: 6 }, (_, i) => makeWp(String(i + 1), i + 1));
    render(
      <WaypointConversionBanner
        waypoints={wps}
        startDate="2027-03-01"
        hasExistingItinerary={false}
        onConvert={vi.fn()}
        onDismiss={vi.fn()}
      />,
    );

    expect(screen.getByText(/Convert 6 waypoints into day structure/)).toBeInTheDocument();
  });
});
