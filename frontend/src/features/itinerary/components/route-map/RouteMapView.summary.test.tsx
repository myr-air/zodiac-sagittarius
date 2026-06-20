import { fireEvent, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { tripFixture } from "@/src/trip/trip-fixtures";
import { RouteMapView } from "./RouteMapView";
import {
  hongKongDay,
  renderWithThaiI18n,
  routeMapCoordinateItems,
  routeMapItems,
} from "./route-map-test-support";

describe("RouteMapView summary", () => {
  const render = renderWithThaiI18n;

  it("summarizes route visibility and filters stops by day", () => {
    const coordinateItems = routeMapCoordinateItems();
    render(
      <RouteMapView
        endDate={tripFixture.trip.endDate}
        items={routeMapItems}
        startDate={tripFixture.trip.startDate}
        tripName={tripFixture.trip.name}
      />,
    );

    expect(screen.getByRole("heading", { name: "แผนที่" })).toBeInTheDocument();
    expect(screen.getByText(/มีพิกัด/)).toHaveTextContent(
      `${coordinateItems.length}/${routeMapItems.length} มีพิกัด · 0 ยังไม่ระบุ`,
    );
    expect(screen.getByText("กำลังโหลดแผนที่จาก OpenFreeMap")).toBeInTheDocument();
    expect(screen.getByText("Hong Kong")).toBeInTheDocument();
    expect(screen.getByRole("list", { name: "จุดบนเส้นทางที่แสดงอยู่" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /วันที่ 2/ }));

    const dayTwoCount = coordinateItems.filter((item) => item.day === hongKongDay).length;
    expect(screen.getByText(/มีพิกัด/)).toHaveTextContent(
      `${dayTwoCount}/${routeMapItems.length} มีพิกัด · 0 ยังไม่ระบุ`,
    );
    expect(screen.getAllByText(/วันที่ 2/).length).toBeGreaterThan(0);

    fireEvent.click(screen.getByRole("button", { name: "ทุกวัน" }));
    expect(screen.getByText(/มีพิกัด/)).toHaveTextContent(
      `${coordinateItems.length}/${routeMapItems.length} มีพิกัด · 0 ยังไม่ระบุ`,
    );
  });

  it("handles empty route data without map day choices", () => {
    render(
      <RouteMapView
        endDate={tripFixture.trip.endDate}
        items={[]}
        startDate={tripFixture.trip.startDate}
        tripName={tripFixture.trip.name}
      />,
    );

    expect(screen.getByText("0/0 มีพิกัด · 0 ยังไม่ระบุ")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /วันที่ 1/ })).not.toBeInTheDocument();
  });
});
