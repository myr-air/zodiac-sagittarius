export { parseTime } from "./itinerary-core";
export {
  buildItineraryCommitmentsByItemId,
  type ItineraryCommitmentSummary,
} from "./itinerary-commitments";
export {
  buildItineraryView,
  formatDayLabel,
  getNowNext,
  groupItemsByDay,
  type ItineraryDayGroup,
  type ItineraryRouteDayStat,
  type ItineraryView,
  sortItemsForDay,
  validateItineraryItem,
} from "./itinerary-core";
export {
  type ItineraryPathSelection,
  type ItineraryPathSelectionAction,
  itineraryItemPathFieldsForTarget,
  resolveItineraryPathItems,
  selectedItineraryPathIdForDay,
  updateItineraryPathSelection,
} from "./itinerary-paths";
export {
  type ItineraryPathOption,
  deriveItineraryPathOptions,
  itineraryPathOptionsForDay,
} from "./itinerary-paths";
export {
  humanizePathId,
  itineraryItemPathId,
  mainItineraryPathId,
  mainItineraryPathName,
} from "./itinerary-paths";
export {
  buildItineraryItemDraft,
  buildUpdatedItineraryItem,
  getNextChildSortOrder,
  getNextSortOrder,
  normalizeStopHierarchyValues,
} from "./itinerary-drafts";
export type {
  BuildItineraryItemDraftInput,
  BuildItineraryItemDraftOptions,
  BuildUpdatedItineraryItemOptions,
} from "./itinerary-drafts";
export {
  appendItineraryItemPlacement,
  appendItineraryItemToTrip,
  deleteItineraryItemFromTrip,
  hasDescendantItem,
  mergeCreatedItineraryItemIntoTrip,
  mergeUpdatedItineraryBranchIntoTrip,
  moveTripItem,
  moveTripItemIntoPlanBlock,
  moveTripItemToDay,
  replaceItineraryItem,
  replaceItineraryItems,
} from "./itinerary-items";
export type {
  ItineraryItemPlacement,
} from "./itinerary-items";

export function getTripDates(startDate: string, endDate: string): string[] {
  const start = new Date(`${startDate}T00:00:00Z`);
  const end = new Date(`${endDate}T00:00:00Z`);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || start > end) {
    return [startDate];
  }

  const dates: string[] = [];
  for (
    const cursor = new Date(start);
    cursor <= end;
    cursor.setUTCDate(cursor.getUTCDate() + 1)
  ) {
    dates.push(cursor.toISOString().slice(0, 10));
  }
  return dates;
}
