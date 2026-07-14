import { afterEach, describe, expect, it, vi } from "vitest";
import {
  getMaplibreMock,
  resetMaplibreMock,
  triggerMapEvent,
} from "./mocks/maplibre-gl.mock";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithI18n } from "@/src/i18n/test-utils";
import { RouteBuilderPage } from "../RouteBuilderPage";
import type { Waypoint } from "@/src/trip/waypoints/waypoint-types";

const tripId = "trip-1";
const destination = { lat: 13.7563, lng: 100.5018, label: "Bangkok" };

const waypoint = (id: string, lat: number, lng: number, sortOrder: number): Waypoint => ({
  id,
  tripId,
  name: `Stop ${id}`,
  lat,
  lng,
  sortOrder,
});

const mock = getMaplibreMock();

describe("RouteBuilderPage", () => {
  let lastUnmount: (() => void) | undefined;

  afterEach(() => {
    lastUnmount?.();
    lastUnmount = undefined;
    resetMaplibreMock();
  });

  function renderPage(props: Partial<React.ComponentProps<typeof RouteBuilderPage>> = {}) {
    const result = renderWithI18n(
      <RouteBuilderPage
        waypoints={[]}
        tripDestination={destination}
        onWaypointsChange={vi.fn()}
        liveMapEnabled
        {...props}
      />,
    );
    lastUnmount = result.unmount;
    return result;
  }

  function currentMap() {
    return mock.maps.at(-1);
  }

  it("renders with 0 waypoints — shows empty prompt", () => {
    renderPage();
    expect(screen.getByText(/Click on the map to add a waypoint/)).toBeInTheDocument();
  });

  it("renders with 1 waypoint — shows pin, no route line", async () => {
    renderPage({ waypoints: [waypoint("a", 13, 100, 1)] });

    const map = await waitFor(() => {
      const current = currentMap();
      expect(current).toBeTruthy();
      return current!;
    });
    triggerMapEvent(map, "load");
    await waitFor(() => expect(mock.markers.length).toBe(1));

    expect(mock.markers[0].element.textContent).toBe("1");
    expect(map.addLayer).not.toHaveBeenCalled();
  });

  it("renders with 3 waypoints — shows 3 pins, route line", async () => {
    renderPage({
      waypoints: [
        waypoint("a", 0, 0, 1),
        waypoint("b", 1, 0, 2),
        waypoint("c", 2, 0, 3),
      ],
    });

    const map = await waitFor(() => {
      const current = currentMap();
      expect(current).toBeTruthy();
      return current!;
    });
    triggerMapEvent(map, "load");
    await waitFor(() => expect(mock.markers.length).toBe(3));

    expect(mock.markers.map((m) => m.element.textContent)).toEqual(["1", "2", "3"]);
    expect(map.addLayer).toHaveBeenCalled();
  });

  it("renders with 6 waypoints — shows 6 pins", async () => {
    renderPage({
      waypoints: Array.from({ length: 6 }, (_, i) =>
        waypoint(String(i), i, 0, i + 1),
      ),
    });

    const map = await waitFor(() => {
      const current = currentMap();
      expect(current).toBeTruthy();
      return current!;
    });
    triggerMapEvent(map, "load");
    await waitFor(() => expect(mock.markers.length).toBe(6));
  });

  it("click on empty map area triggers onWaypointsChange with new waypoint", async () => {
    const onChange = vi.fn();
    renderPage({ waypoints: [], onWaypointsChange: onChange });

    const map = await waitFor(() => {
      const current = currentMap();
      expect(current).toBeTruthy();
      return current!;
    });
    triggerMapEvent(map, "load");
    triggerMapEvent(map, "click", {
      lngLat: { lng: 10, lat: 20 },
    });

    await waitFor(() => expect(onChange).toHaveBeenCalled());
    const last = onChange.mock.calls.at(-1)?.[0] as Waypoint[] | undefined;
    expect(last).toBeDefined();
    expect(last).toHaveLength(1);
    expect(last![0].lat).toBe(20);
    expect(last![0].lng).toBe(10);
  });

  it("distance badge shows correct format for waypoint pair", () => {
    renderPage({
      waypoints: [
        waypoint("a", 0, 0, 1),
        waypoint("b", 1, 0, 2),
      ],
    });

    const badge = screen.getByTestId("distance-badge");
    expect(badge.textContent).toMatch(/\d+h\d+m · \d+km/);
  });

  it("keyboard 'Add stop' form renders and submits correctly", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    renderPage({ waypoints: [], onWaypointsChange: onChange });

    await user.click(screen.getByTestId("add-stop-button"));
    await user.type(screen.getByTestId("add-stop-name"), "Tokyo");
    await user.type(screen.getByTestId("add-stop-lat"), "35.6");
    await user.type(screen.getByTestId("add-stop-lng"), "139.7");
    await user.click(screen.getByTestId("add-stop-submit"));

    await waitFor(() => expect(onChange).toHaveBeenCalled());
    const last = onChange.mock.calls.at(-1)?.[0] as Waypoint[] | undefined;
    expect(last).toBeDefined();
    expect(last![0]).toMatchObject({
      name: "Tokyo",
      lat: 35.6,
      lng: 139.7,
    });
  });

});
