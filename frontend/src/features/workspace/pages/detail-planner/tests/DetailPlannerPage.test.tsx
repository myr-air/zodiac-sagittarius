import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { renderWithI18n } from "@/src/i18n/test-utils";
import type { SmartItineraryTableProps } from "@/src/features/itinerary/components/smart-itinerary-table/SmartItineraryTable.types";
import type { ItineraryItem } from "@/src/trip/types";
import type { Waypoint } from "@/src/trip/waypoints/waypoint-types";
import { DetailPlannerPage } from "../DetailPlannerPage";

vi.mock(
  "@/src/features/itinerary/components/smart-itinerary-table/SmartItineraryTable",
  () => ({
    SmartItineraryTable: (props: SmartItineraryTableProps) => (
      <div
        data-testid="smart-table"
        data-props={JSON.stringify(Object.keys(props))}
      >
        Smart Table
      </div>
    ),
  }),
);

function makeTableProps(
  overrides: Partial<SmartItineraryTableProps> = {},
): SmartItineraryTableProps {
  return {
    items: [] as ItineraryItem[],
    startDate: "2027-03-01",
    endDate: "2027-03-07",
    tripPlans: [],
    selectedTripPlanId: "plan-1",
    mainTripPlanId: "plan-1",
    tripPlanError: null,
    isTripPlanBusy: false,
    role: "owner",
    selectedItemId: "",
    tripName: "Test Trip",
    onAddStop: vi.fn(),
    onOpenItemDetails: vi.fn(),
    onSelectItem: vi.fn(),
    onChangeTripPlan: vi.fn(),
    onChangeTripPlanStatus: vi.fn(),
    onSetMainTripPlan: vi.fn(),
    onCreateTripPlan: vi.fn(),
    onRenameTripPlan: vi.fn(),
    ...overrides,
  } as SmartItineraryTableProps;
}

describe("DetailPlannerPage", () => {
  it("renders SmartItineraryTable", () => {
    renderWithI18n(<DetailPlannerPage tableProps={makeTableProps()} />);
    expect(screen.getByTestId("smart-table")).toBeInTheDocument();
  });

  it("renders import button in toolbar", () => {
    renderWithI18n(<DetailPlannerPage tableProps={makeTableProps()} />);
    expect(screen.getByText(/Import|นำเข้า/)).toBeInTheDocument();
  });

  it("shows WaypointConversionBanner when waypoints exist and no itinerary", () => {
    const wps: Waypoint[] = [
      {
        id: "1",
        tripId: "t1",
        name: "Tokyo",
        lat: 35.6,
        lng: 139.6,
        sortOrder: 1,
      },
    ];
    renderWithI18n(
      <DetailPlannerPage
        tableProps={makeTableProps({ items: [] })}
        waypoints={wps}
      />,
    );
    expect(screen.getByRole("status")).toBeInTheDocument();
  });

  it("hides WaypointConversionBanner when itinerary items exist", () => {
    const wps: Waypoint[] = [
      {
        id: "1",
        tripId: "t1",
        name: "Tokyo",
        lat: 35.6,
        lng: 139.6,
        sortOrder: 1,
      },
    ];
    renderWithI18n(
      <DetailPlannerPage
        tableProps={makeTableProps({
          items: [{ id: "i1", activity: "test" }] as ItineraryItem[],
        })}
        waypoints={wps}
      />,
    );
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("toggles import area on button click", () => {
    renderWithI18n(<DetailPlannerPage tableProps={makeTableProps()} />);
    const importBtn = screen.getByText(/Import|นำเข้า/);
    fireEvent.click(importBtn);
    expect(screen.getByRole("textbox")).toBeInTheDocument();
  });

  it("hides banner after dismiss", () => {
    const wps: Waypoint[] = [
      {
        id: "1",
        tripId: "t1",
        name: "Tokyo",
        lat: 35.6,
        lng: 139.6,
        sortOrder: 1,
      },
    ];
    renderWithI18n(
      <DetailPlannerPage
        tableProps={makeTableProps({ items: [] })}
        waypoints={wps}
      />,
    );
    fireEvent.click(screen.getByText(/Not now|ไม่ใช่ตอนนี้/));
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });
});
