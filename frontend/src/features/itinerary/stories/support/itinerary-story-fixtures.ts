import { buildEmptyTripFixture, buildDenseTripFixture, tripFixture } from "@/src/trip/testing/fixtures/trip-fixtures";
import type { SmartItineraryTableProps } from "@/src/features/itinerary/components";
import type { ItineraryPathOption } from "@/src/trip/itinerary-paths";
import {
  buildOverflowStoryItems,
  defaultSmartItineraryPathOptions,
  itineraryFixtureDay,
  pathIdStoryRain,
  withStoryPrefix,
} from "@/src/features/itinerary/testing";

export type SmartItineraryStoryArgs = SmartItineraryTableProps;

const day = itineraryFixtureDay;
export const itineraryStoryDay = day;
export { buildOverflowStoryItems, withStoryPrefix };
export {
  branchGraphItemsBase,
  branchGraphPathOptions,
  buildPrefixedPathScenarioItems,
  pathNameMain,
  pathNamePlanA,
  pathNamePlanB,
  pathNamePlanC,
  planAExampleItemsBase,
  planAPathOptions,
  planABAlternativeItemsBase,
  planABPathOptions,
  requestedPlanExampleItemsBase,
  stressPathItemsBase,
  stressPathOptions,
  windowOnlyDurationItemBase,
} from "./itinerary-story-path-scenarios";

const noop = () => {};

export const defaultPathOptions = [
  ...defaultSmartItineraryPathOptions.map((option) =>
    option.scope === "day" ? { ...option, day } : option,
  ),
] satisfies ReadonlyArray<ItineraryPathOption>;

export const ownerStoryArgs: SmartItineraryStoryArgs = {
  endDate: tripFixture.trip.endDate,
  items: tripFixture.planItems,
  tripPlans: tripFixture.trip.planVariants,
  selectedTripPlanId: tripFixture.trip.activePlanVariantId,
  mainTripPlanId: tripFixture.trip.mainTripPlanId ?? tripFixture.trip.activePlanVariantId,
  tripPlanError: null,
  isTripPlanBusy: false,
  pathOptions: defaultPathOptions,
  role: "owner",
  startDate: tripFixture.trip.startDate,
  selectedItemId: "item-dimdim",
  dayPathOverrides: { [tripFixture.trip.startDate]: pathIdStoryRain },
  showAllPaths: false,
  tripName: tripFixture.trip.name,
  onAddStop: noop,
  onOpenItemDetails: noop,
  onSelectItem: noop,
  onMoveItemToPath: noop,
  onChangeTripPlan: noop,
  onChangeTripPlanStatus: noop,
  onSetMainTripPlan: noop,
  onCreateTripPlan: noop,
  onRenameTripPlan: noop,
  onChangeDayPath: noop,
  onClearDayPath: noop,
  onToggleShowAllPaths: noop,
};

export const buildOwnerStoryArgs = (
  overrides: Partial<SmartItineraryStoryArgs> = {},
): SmartItineraryStoryArgs => ({
  ...ownerStoryArgs,
  ...overrides,
});

export const denseTripFixture = buildDenseTripFixture();
export const emptyTripFixture = buildEmptyTripFixture();
