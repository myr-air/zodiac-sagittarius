import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { tripFixture } from "@/src/trip/testing/fixtures/trip-fixtures";
import { RouteMapView } from "../RouteMapView";
import {
  hongKongDay,
  routeMapUnresolvedItems,
} from "../testing/fixtures/route-map-fixtures";
import { renderWithThaiI18n } from "../testing/support/route-map-render";

describe("RouteMapView unresolved coordinates", () => {
  const render = renderWithThaiI18n;

  it("lists stops without coordinates instead of placing unresolved map markers", () => {
    render(
      <RouteMapView
        endDate={tripFixture.trip.endDate}
        items={routeMapUnresolvedItems(3)}
        startDate={tripFixture.trip.startDate}
        tripName={tripFixture.trip.name}
      />,
    );

    expect(screen.getByText("0/3 มีพิกัด · 3 ยังไม่ระบุ")).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "กิจกรรมที่ยังไม่มีพิกัด" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "หาพิกัด 3 จุด" })).toBeDisabled();
    expect(screen.getByRole("button", { name: /วันที่ 1/ })).toBeInTheDocument();
    expect(screen.getByText("กำลังโหลดแผนที่จาก OpenFreeMap")).toBeInTheDocument();
  });

  it("requests coordinate resolution for visible unresolved stops", async () => {
    const user = userEvent.setup();
    const onResolveMissingCoordinates = vi.fn(() => ({
      attempted: 1,
      failed: 0,
      resolved: 1,
      skipped: 0,
    }));
    const unresolvedItems = routeMapUnresolvedItems(8);

    render(
      <RouteMapView
        endDate={tripFixture.trip.endDate}
        items={unresolvedItems}
        onResolveMissingCoordinates={onResolveMissingCoordinates}
        startDate={tripFixture.trip.startDate}
        tripName={tripFixture.trip.name}
      />,
    );

    await user.click(screen.getByRole("button", { name: /วันที่ 2/ }));
    await user.click(screen.getByRole("button", { name: "หาพิกัด 1 จุด" }));

    expect(onResolveMissingCoordinates).toHaveBeenCalledWith(
      unresolvedItems.filter((item) => item.day === hongKongDay),
    );
    expect(screen.getByText("พบ 1/1 จุด · 0 จุดต้องตรวจต่อ")).toBeInTheDocument();
  });

  it("caps all-days coordinate lookup batches and explains the limit", async () => {
    const user = userEvent.setup();
    const onResolveMissingCoordinates = vi.fn(() => ({
      attempted: 8,
      failed: 1,
      resolved: 3,
      skipped: 4,
    }));
    const unresolvedItems = routeMapUnresolvedItems(10);

    render(
      <RouteMapView
        endDate={tripFixture.trip.endDate}
        items={unresolvedItems}
        onResolveMissingCoordinates={onResolveMissingCoordinates}
        startDate={tripFixture.trip.startDate}
        tripName={tripFixture.trip.name}
      />,
    );

    expect(screen.getByRole("button", { name: "หาพิกัด 8 จุด" })).toBeInTheDocument();
    expect(screen.getByText("หาครั้งละ 8 จุดเพื่อไม่ให้ช้าเกินไป ยังเหลือ 10 จุด")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "หาพิกัด 8 จุด" }));

    expect(onResolveMissingCoordinates).toHaveBeenCalledWith(unresolvedItems.slice(0, 8));
    expect(screen.getByText("พบ 3/8 จุด · 5 จุดต้องตรวจต่อ")).toBeInTheDocument();
  });
});
