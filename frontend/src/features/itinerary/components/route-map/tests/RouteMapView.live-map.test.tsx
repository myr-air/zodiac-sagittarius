import { fireEvent, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  getMaplibreMock,
  resetMaplibreMock,
  triggerLiveMapEvent,
} from "../testing/route-map-live-map-test-support";
import { renderLiveRouteMap } from "../testing/route-map-live-map-view-test-support";
import {
  routeMapCoordinateItemEastOf,
  routeMapUnresolvedItems,
} from "../testing/route-map-test-support";

const maplibreMock = getMaplibreMock();

describe("RouteMapView live map", () => {
  afterEach(() => {
    resetMaplibreMock();
    vi.useRealTimers();
    vi.unstubAllEnvs();
  });

  it("centers the live map on the destination country when no stop has coordinates", async () => {
    const unresolvedItems = routeMapUnresolvedItems(2);
    renderLiveRouteMap({
      countries: ["Thailand"],
      destinationLabel: "Chiang Mai, Thailand",
      items: unresolvedItems,
    });

    await waitFor(() => expect(maplibreMock.maps[0]?.flyTo).toHaveBeenCalledWith({
      center: [100.9925, 15.87],
      essential: false,
      zoom: 5,
    }));
  });

  it("centers a live map around one coordinate with a fly-to transition", async () => {
    renderLiveRouteMap({
      items: [routeMapCoordinateItemEastOf(110)],
    });

    await waitFor(() => expect(maplibreMock.maps[0]?.flyTo).toHaveBeenCalled());
  });

  it("mounts, filters, and cleans up a live MapLibre route", async () => {
    const { unmount } = renderLiveRouteMap();

    await waitFor(() => expect(maplibreMock.maps[0]?.addLayer).toHaveBeenCalled());
    expect(maplibreMock.maps[0]?.setPaintProperty).toHaveBeenCalledWith("water", "fill-color", "#c9dfe7");
    expect(maplibreMock.maps[0]?.setPaintProperty).toHaveBeenCalledWith("background", "background-color", "#f6fbfd");
    expect(maplibreMock.maps[0]?.setPaintProperty).toHaveBeenCalledWith("label_country_1", "text-color", "#0f3f46");
    expect(document.querySelector(".route-live-map")).not.toHaveProperty("inert", true);
    expect(document.querySelector(".route-live-map")).not.toHaveAttribute("tabindex");
    expect(document.querySelector(".route-live-map button")).toHaveAttribute("tabindex", "-1");
    expect(maplibreMock.markers.length).toBeGreaterThan(1);

    await userEvent.click(screen.getByRole("button", { name: /วันที่ 2/ }));

    expect(maplibreMock.maps[0]?.removeLayer).toHaveBeenCalled();
    expect(maplibreMock.maps[0]?.addLayer).toHaveBeenCalled();
    expect(maplibreMock.maps[0]?.fitBounds).toHaveBeenCalled();
    expect(maplibreMock.markers.some((marker) => marker.element.style.display === "none")).toBe(true);

    unmount();

    expect(maplibreMock.maps[0]?.remove).toHaveBeenCalled();
    expect(maplibreMock.markers.every((marker) => marker.remove.mock.calls.length > 0)).toBe(true);
  });

  it("fits a filtered live route when the active day changes before map load", async () => {
    maplibreMock.loadDelay = 10;
    renderLiveRouteMap();

    await vi.dynamicImportSettled();
    fireEvent.click(screen.getByRole("button", { name: /วันที่ 2/ }));

    await waitFor(() => expect(maplibreMock.maps[0]?.fitBounds).toHaveBeenCalled());
  });

  it("handles live map error events and ignores late load callbacks after cleanup", async () => {
    const { unmount } = renderLiveRouteMap();
    await waitFor(() => expect(maplibreMock.maps[0]).toBeTruthy());

    triggerLiveMapEvent(maplibreMock.maps[0], "error");
    await waitFor(() => expect(screen.getByText("Hong Kong")).toBeInTheDocument());
    expect(screen.getByRole("status")).toHaveTextContent("โหลดแผนที่สดไม่สำเร็จ แสดงแผนผังสำรองไว้ก่อน");

    unmount();
    expect(maplibreMock.maps[0]?.remove).toHaveBeenCalled();
  });

  it("ignores live map events after unmount and tolerates missing route layers", async () => {
    const user = userEvent.setup();
    const { unmount } = renderLiveRouteMap();
    await waitFor(() => expect(maplibreMock.maps[0]).toBeTruthy());
    maplibreMock.maps[0]!.getLayer.mockReturnValue(false);

    await user.click(screen.getByRole("button", { name: /วันที่ 2/ }));

    expect(maplibreMock.maps[0]!.removeLayer).not.toHaveBeenCalled();

    unmount();
    triggerLiveMapEvent(maplibreMock.maps[0], "error");
    expect(screen.queryByText("Hong Kong")).not.toBeInTheDocument();
  });
});
