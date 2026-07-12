import { screen } from "@testing-library/react";
import { act } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { tripFixture } from "@/src/trip/testing/fixtures/trip-fixtures";
import {
  getMaplibreMock,
  resetMaplibreMock,
  triggerLiveMapEvent,
} from "../testing/mocks/maplibre-gl.mock";
import { routeMapItems } from "../testing/fixtures/route-map-fixtures";
import { renderWithThaiI18n } from "../testing/support/route-map-render";
import { RouteMapView } from "../RouteMapView";

const maplibreMock = getMaplibreMock();

describe("RouteMapView tile-failure fallback", () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    resetMaplibreMock();
    vi.useRealTimers();
  });

  it("transitions to error fallback when tile sources fail to load within timeout", async () => {
    renderWithThaiI18n(
      <RouteMapView
        endDate={tripFixture.trip.endDate}
        items={routeMapItems}
        liveMapEnabled
        startDate={tripFixture.trip.startDate}
        tripName={tripFixture.trip.name}
      />,
    );

    await vi.waitFor(() => expect(maplibreMock.maps[0]).toBeTruthy());

    act(() => {
      vi.advanceTimersByTime(4000);
    });

    expect(screen.getByText("Hong Kong")).toBeInTheDocument();
    expect(screen.getByText("Shenzhen")).toBeInTheDocument();
    expect(screen.getByText("Victoria Harbour")).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent(
      "โหลดแผนที่สดไม่สำเร็จ แสดงแผนผังสำรองไว้ก่อน",
    );
    expect(
      screen.getByRole("button", { name: "ลองโหลดแผนที่สดอีกครั้ง" }),
    ).toBeInTheDocument();
    expect(
      screen.getByLabelText(/ตัวอย่างแผนที่เส้นทางฮ่องกงและเซินเจิ้น/i),
    ).toHaveAttribute("data-live-map-state", "error");
  });

  it("stays in ready state when tile sources load via sourcedata before timeout", async () => {
    const prevLoadDelay = maplibreMock.loadDelay;
    maplibreMock.loadDelay = 86_400_000;

    renderWithThaiI18n(
      <RouteMapView
        endDate={tripFixture.trip.endDate}
        items={routeMapItems}
        liveMapEnabled
        startDate={tripFixture.trip.startDate}
        tripName={tripFixture.trip.name}
      />,
    );

    await vi.waitFor(() => expect(maplibreMock.maps[0]).toBeTruthy());

    act(() => {
      triggerLiveMapEvent(maplibreMock.maps[0], "load");
    });

    act(() => {
      triggerLiveMapEvent(maplibreMock.maps[0], "sourcedata", {
        isSourceLoaded: true,
        sourceId: "openmaptiles",
        source: { type: "vector" },
      });
    });

    act(() => {
      vi.advanceTimersByTime(4000);
    });

    expect(
      screen.getByLabelText(/ตัวอย่างแผนที่เส้นทางฮ่องกงและเซินเจิ้น/i),
    ).toHaveAttribute("data-live-map-state", "ready");
    expect(
      screen.queryByRole("button", { name: "ลองโหลดแผนที่สดอีกครั้ง" }),
    ).not.toBeInTheDocument();

    maplibreMock.loadDelay = prevLoadDelay;
  });
});
