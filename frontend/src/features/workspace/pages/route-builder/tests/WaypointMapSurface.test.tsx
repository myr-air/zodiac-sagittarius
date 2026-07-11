import { afterEach, describe, expect, it, vi } from "vitest";
import {
  getMaplibreMock,
  resetMaplibreMock,
  triggerMapEvent,
  triggerMarkerEvent,
} from "./mocks/maplibre-gl.mock";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithI18n } from "@/src/i18n/test-utils";
import { WaypointMapSurface } from "../WaypointMapSurface";
import type { Waypoint } from "@/src/trip/waypoints/waypoint-types";

const tripId = "trip-1";

const singleWaypoint: Waypoint[] = [
  { id: "a", tripId, name: "A", lat: 13, lng: 100, sortOrder: 1 },
];

const multipleWaypoints: Waypoint[] = [
  { id: "a", tripId, name: "A", lat: 0, lng: 0, sortOrder: 1 },
  { id: "b", tripId, name: "B", lat: 1, lng: 0, sortOrder: 2 },
  { id: "c", tripId, name: "C", lat: 2, lng: 0, sortOrder: 3 },
];

const mock = getMaplibreMock();

describe("WaypointMapSurface", () => {
  let lastUnmount: (() => void) | undefined;

  afterEach(() => {
    lastUnmount?.();
    lastUnmount = undefined;
    resetMaplibreMock();
  });

  function renderSurface(props: Partial<React.ComponentProps<typeof WaypointMapSurface>> = {}) {
    const result = renderWithI18n(
      <WaypointMapSurface
        waypoints={[]}
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

  it("renders loading state before the map is ready", () => {
    mock.loadDelay = 1000;
    renderSurface();

    expect(screen.getByText("Loading")).toBeInTheDocument();
  });

  it("renders error state when the map fails to load", async () => {
    mock.throwOnCreate = true;
    renderSurface();

    await waitFor(() =>
      expect(screen.getByRole("status")).toHaveTextContent(
        "No suggestions — add a stop manually",
      ),
    );
  });

  it("renders markers after the map loads", async () => {
    renderSurface({ waypoints: multipleWaypoints });

    const map = await waitFor(() => {
      const current = currentMap();
      expect(current).toBeTruthy();
      return current!;
    });
    triggerMapEvent(map, "load");
    await waitFor(() => expect(mock.markers.length).toBe(3));

    expect(mock.markers[0].element.textContent).toBe("1");
    expect(mock.markers[1].element.textContent).toBe("2");
    expect(mock.markers[2].element.textContent).toBe("3");
  });

  it("adds a route line when there are two or more waypoints", async () => {
    renderSurface({ waypoints: multipleWaypoints });

    const map = await waitFor(() => {
      const current = currentMap();
      expect(current).toBeTruthy();
      return current!;
    });
    triggerMapEvent(map, "load");
    await waitFor(() => expect(map.addLayer).toHaveBeenCalled());
  });

  it("does not add a route line when there is only one waypoint", async () => {
    renderSurface({ waypoints: singleWaypoint });

    const map = await waitFor(() => {
      const current = currentMap();
      expect(current).toBeTruthy();
      return current!;
    });
    triggerMapEvent(map, "load");
    await waitFor(() => expect(mock.markers.length).toBe(1));

    expect(map.addLayer).not.toHaveBeenCalled();
  });

  it("creates a waypoint when the map is clicked", async () => {
    const onChange = vi.fn();
    renderSurface({ waypoints: [], onWaypointsChange: onChange });

    const map = await waitFor(() => {
      const current = currentMap();
      expect(current).toBeTruthy();
      return current!;
    });
    triggerMapEvent(map, "load");
    triggerMapEvent(map, "click", {
      lngLat: { lng: 10.5, lat: 20.5 },
    });

    await waitFor(() => expect(onChange).toHaveBeenCalled());
    const last = onChange.mock.calls.at(-1)?.[0] as Waypoint[] | undefined;
    expect(last).toBeDefined();
    expect(last).toHaveLength(1);
    expect(last![0].lat).toBe(20.5);
    expect(last![0].lng).toBe(10.5);
  });

  it("updates a waypoint when a marker drag ends", async () => {
    const onChange = vi.fn();
    renderSurface({ waypoints: singleWaypoint, onWaypointsChange: onChange });

    const map = await waitFor(() => {
      const current = currentMap();
      expect(current).toBeTruthy();
      return current!;
    });
    triggerMapEvent(map, "load");
    await waitFor(() => expect(mock.markers.length).toBe(1));

    mock.markers[0].getLngLat.mockReturnValue({ lat: 21, lng: 101 });
    triggerMarkerEvent(mock.markers[0], "dragend");

    await waitFor(() => expect(onChange).toHaveBeenCalled());
    const last = onChange.mock.calls.at(-1)?.[0] as Waypoint[] | undefined;
    expect(last).toBeDefined();
    expect(last![0]).toMatchObject({ id: "a", lat: 21, lng: 101 });
  });

  it("opens and submits the keyboard-accessible add-stop form", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    renderSurface({ waypoints: [], onWaypointsChange: onChange });

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
