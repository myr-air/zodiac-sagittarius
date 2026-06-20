import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { tripFixture } from "@/src/trip/trip-fixtures";
import {
  getMaplibreMock,
  resetMaplibreMock,
  triggerLiveMapEvent,
} from "./route-map-live-map-test-support";
import { renderWithThaiI18n, routeMapItems } from "./route-map-test-support";
import { RouteMapView } from "./RouteMapView";

const maplibreMock = getMaplibreMock();

describe("RouteMapView live map states", () => {
  const render = renderWithThaiI18n;

  afterEach(() => {
    resetMaplibreMock();
    vi.useRealTimers();
    vi.unstubAllEnvs();
  });

  it("renders the fallback route diagram when the live map fails", async () => {
    maplibreMock.throwOnCreate = true;

    render(
      <RouteMapView
        endDate={tripFixture.trip.endDate}
        items={routeMapItems}
        liveMapEnabled
        startDate={tripFixture.trip.startDate}
        tripName={tripFixture.trip.name}
      />,
    );

    await waitFor(() => expect(screen.getByText("Hong Kong")).toBeInTheDocument());
    expect(screen.getByRole("status")).toHaveTextContent("โหลดแผนที่สดไม่สำเร็จ แสดงแผนผังสำรองไว้ก่อน");
    expect(screen.getByRole("button", { name: "ลองโหลดแผนที่สดอีกครั้ง" })).toBeInTheDocument();
    expect(screen.getByText("Shenzhen")).toBeInTheDocument();
    expect(screen.getByText("Victoria Harbour")).toBeInTheDocument();
  });

  it("can preview live map loading and failure states without mounting MapLibre", () => {
    const { rerender } = render(
      <RouteMapView
        endDate={tripFixture.trip.endDate}
        items={routeMapItems}
        liveMapAvailability="loading"
        liveMapEnabled
        startDate={tripFixture.trip.startDate}
        tripName={tripFixture.trip.name}
      />,
    );

    expect(screen.getByLabelText(/ตัวอย่างแผนที่เส้นทางฮ่องกงและเซินเจิ้น/i)).toHaveAttribute("data-live-map-state", "loading");
    expect(screen.getByText("กำลังโหลดแผนที่จาก OpenFreeMap")).toHaveClass("route-map-status");
    expect(maplibreMock.maps).toHaveLength(0);

    rerender(
      <RouteMapView
        endDate={tripFixture.trip.endDate}
        items={routeMapItems}
        liveMapAvailability="error"
        liveMapEnabled
        startDate={tripFixture.trip.startDate}
        tripName={tripFixture.trip.name}
      />,
    );

    expect(screen.getByRole("status")).toHaveTextContent("โหลดแผนที่สดไม่สำเร็จ แสดงแผนผังสำรองไว้ก่อน");
    expect(screen.queryByRole("button", { name: "ลองโหลดแผนที่สดอีกครั้ง" })).not.toBeInTheDocument();
    expect(screen.getByText("Hong Kong")).toBeInTheDocument();
    expect(maplibreMock.maps).toHaveLength(0);
  });

  it("retries the live map after a tile failure remounts MapLibre", async () => {
    const user = userEvent.setup();

    render(
      <RouteMapView
        endDate={tripFixture.trip.endDate}
        items={routeMapItems}
        liveMapEnabled
        startDate={tripFixture.trip.startDate}
        tripName={tripFixture.trip.name}
      />,
    );

    await waitFor(() => expect(maplibreMock.maps[0]).toBeTruthy());
    triggerLiveMapEvent(maplibreMock.maps[0], "error");
    await waitFor(() => expect(screen.getByRole("button", { name: "ลองโหลดแผนที่สดอีกครั้ง" })).toBeInTheDocument());

    await user.click(screen.getByRole("button", { name: "ลองโหลดแผนที่สดอีกครั้ง" }));

    await waitFor(() => expect(maplibreMock.maps).toHaveLength(2));
    await waitFor(() => expect(maplibreMock.maps[1]?.addLayer).toHaveBeenCalled());
    expect(screen.queryByRole("button", { name: "ลองโหลดแผนที่สดอีกครั้ง" })).not.toBeInTheDocument();
  });

  it("exposes hybrid Tailwind bridge classes for the map shell and fallback surface", async () => {
    maplibreMock.throwOnCreate = true;

    render(
      <RouteMapView
        endDate={tripFixture.trip.endDate}
        items={routeMapItems}
        liveMapEnabled
        startDate={tripFixture.trip.startDate}
        tripName={tripFixture.trip.name}
      />,
    );

    await waitFor(() => expect(screen.getByText("Hong Kong")).toBeInTheDocument());

    const panel = screen.getByRole("region", { name: /แผนที่เส้นทาง/i });
    expect(panel).toHaveClass("route-map-panel", "grid", "min-h-0");

    expect(document.querySelector(".route-map-layout")).toHaveClass(
      "route-map-layout",
      "h-full",
      "min-h-0",
      "bg-[linear-gradient(135deg,var(--color-surface)_0%,var(--color-route-soft)_100%)]",
    );
    const canvas = screen.getByLabelText(/ตัวอย่างแผนที่เส้นทางฮ่องกงและเซินเจิ้น/i);
    expect(canvas).toHaveClass(
      "route-map-canvas",
      "relative",
      "min-h-[560px]",
      "overflow-hidden",
      "bg-[linear-gradient(135deg,var(--color-surface)_0%,var(--color-route-soft)_100%)]",
    );
    expect(canvas.className).not.toContain("radial-gradient");
    expect(canvas).toHaveAttribute("data-live-map-state", "error");

    const dayTwoButton = screen.getByRole("button", { name: /วันที่ 2/i });
    expect(dayTwoButton).toHaveClass("map-day-filter-button", "inline-flex", "bg-[rgb(255_255_255_/_0.78)]");
    expect(screen.getByText("Hong Kong")).toHaveClass("map-zone", "absolute", "bg-[rgb(255_255_255_/_0.82)]");
    expect(document.querySelector(".route-map-svg")).toHaveClass("route-map-svg", "absolute", "inset-0");
    expect(document.querySelector(".route-marker")).toHaveClass("route-marker", "absolute", "grid");
    expect(screen.getByText(/OpenFreeMap/i)).toHaveClass("map-source-note", "absolute", "bg-[rgb(255_255_255_/_0.86)]");
  });
});
