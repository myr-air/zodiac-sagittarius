import { vi } from "vitest";
import { renderWithI18n } from "@/src/i18n/test-utils";
import { tripFixture } from "@/src/trip/testing/fixtures/trip-fixtures";
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

export { buildBookingDoc, defaultDayPathOptions, defaultPathOptionsForPanel };
