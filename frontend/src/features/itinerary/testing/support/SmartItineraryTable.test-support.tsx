import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import { renderWithI18n } from "@/src/i18n/test-utils";
import { tripFixture } from "@/src/trip/trip-fixtures";
import { SmartItineraryTable } from "@/src/features/itinerary/components";
import {
  buildBookingDoc,
  defaultSmartItineraryPathOptions,
  defaultDayPathOptions,
  defaultPathOptionsForPanel,
} from "../fixtures/itinerary-items";

export function renderSmartItineraryTable(
  overrides: Partial<Parameters<typeof SmartItineraryTable>[0]> = {},
) {
  const props: Parameters<typeof SmartItineraryTable>[0] = {
    canRestructure: true,
    endDate: tripFixture.trip.endDate,
    items: tripFixture.planItems,
    tripPlans: tripFixture.trip.planVariants,
    selectedTripPlanId: tripFixture.trip.activePlanVariantId,
    mainTripPlanId: tripFixture.trip.mainTripPlanId ?? tripFixture.trip.activePlanVariantId,
    tripPlanError: null,
    isTripPlanBusy: false,
    role: "owner",
    startDate: tripFixture.trip.startDate,
    selectedItemId: tripFixture.planItems[0].id,
    pathOptions: [...defaultSmartItineraryPathOptions],
    dayPathOverrides: {},
    showAllPaths: false,
    tripName: tripFixture.trip.name,
    onAddBookingForItem: vi.fn(),
    onAddStop: vi.fn(),
    onOpenItemDetails: vi.fn(),
    onSelectItem: vi.fn(),
    onMoveItemToPath: vi.fn(),
    onAddSubActivity: vi.fn(),
    onAddNoteForItem: vi.fn(),
    onUpdateItemInline: vi.fn(),
    onEditItem: vi.fn(),
    onDeleteItem: vi.fn(),
    onChangeTripPlan: vi.fn(),
    onChangeTripPlanStatus: vi.fn(),
    onSetMainTripPlan: vi.fn(),
    onCreateTripPlan: vi.fn(),
    onRenameTripPlan: vi.fn(),
    onChangeDayPath: vi.fn(),
    onClearDayPath: vi.fn(),
    onToggleShowAllPaths: vi.fn(),
    ...overrides,
  };
  renderWithI18n(<SmartItineraryTable {...props} />, { locale: "th" });
  return props;
}

export function findGraphLine(from: HTMLElement, to: HTMLElement): Element | undefined {
  const fromCenter = {
    x: Number.parseFloat(from.style.left),
    y: Number.parseFloat(from.style.top) + 18,
  };
  const toCenter = {
    x: Number.parseFloat(to.style.left),
    y: Number.parseFloat(to.style.top) + 18,
  };

  return Array.from(document.querySelectorAll(".activity-path-graph-line")).find(
    (line) =>
      line.getAttribute("data-from-x") === `${fromCenter.x}` &&
      line.getAttribute("data-from-y") === `${fromCenter.y}` &&
      line.getAttribute("data-to-x") === `${toCenter.x}` &&
      line.getAttribute("data-to-y") === `${toCenter.y}`,
  );
}

export function layoutRect(top: number, height: number, width = 120): DOMRect {
  return {
    bottom: top + height,
    height,
    left: 0,
    right: width,
    top,
    width,
    x: 0,
    y: top,
    toJSON: () => ({}),
  } as DOMRect;
}

export function createDragDataTransfer() {
  const store = new Map<string, string>();
  return {
    dropEffect: "move",
    effectAllowed: "move",
    getData: vi.fn((type: string) => store.get(type) ?? ""),
    setData: vi.fn((type: string, value: string) => {
      store.set(type, value);
    }),
  };
}

export async function openHeaderControls(user: ReturnType<typeof userEvent.setup>) {
  const controlsButton = screen.getByRole("button", { name: "Trip Plan controls" });
  await user.click(controlsButton);
  return controlsButton;
}

export { buildBookingDoc, defaultDayPathOptions, defaultPathOptionsForPanel, waitFor };
