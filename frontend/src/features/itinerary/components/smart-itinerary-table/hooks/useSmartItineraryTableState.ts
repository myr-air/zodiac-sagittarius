import { useState, type CSSProperties } from "react";
import type {
  ItineraryItem,
  TripDailyBriefing,
  TripRole,
} from "@/src/trip/types";
import {
  getTripDates,
  groupItemsByDay,
  type ItineraryView,
} from "@/src/trip/itinerary-core";
import type { ItineraryPathOption } from "@/src/trip/itinerary-paths";
import { canTripRole } from "@/src/trip/auth";
import {
  buildGraphColumnWidth,
  groupGraphItemsByDay,
} from "../smart-itinerary-table-graph";
import { mergeTripDayGroups } from "@/src/features/itinerary/domain/itinerary-table-grouping";
import {
  graphColumnLaneGap,
  graphColumnMinWidth,
  graphColumnSidePadding,
} from "../smart-itinerary-table.styles";
import {
  type SmartItineraryTableState,
  toggleCollapsedDay,
} from "../smart-itinerary-table-state";
import { useSmartItineraryPathFilters } from "./useSmartItineraryPathFilters";

export interface ItinerarySummaryCounts {
  subActivitiesCount: number;
  flexibleItemsCount: number;
}

export function computeItinerarySummaryCounts(
  items: ItineraryItem[],
): ItinerarySummaryCounts & { totalMinutes: number } {
  let subActivitiesCount = 0;
  let flexibleItemsCount = 0;
  let totalMinutes = 0;

  for (const item of items) {
    if (item.parentItemId) {
      subActivitiesCount += 1;
    }
    if (item.timeMode === "flexible") {
      flexibleItemsCount += 1;
    }
    if (!item.isPlanBlock && item.durationMinutes != null) {
      totalMinutes += item.durationMinutes;
    }
  }

  return { subActivitiesCount, flexibleItemsCount, totalMinutes };
}

interface UseSmartItineraryTableStateParams {
  pathOptions: ItineraryPathOption[];
  items: ItineraryItem[];
  graphItems?: ItineraryItem[];
  role: TripRole;
  startDate: string;
  endDate: string;
  dailyBriefings?: TripDailyBriefing[];
  itineraryView?: ItineraryView;
  canRestructure?: boolean;
  selectedItemId?: string;
  selectedCountLabel: ({ count }: { count: number }) => string;
  selectedNamesLabel: ({ names }: { names: string }) => string;
}

export function useSmartItineraryTableState({
  pathOptions,
  items,
  graphItems,
  role,
  startDate,
  endDate,
  dailyBriefings = [],
  selectedItemId,
  canRestructure = true,
  selectedCountLabel,
  selectedNamesLabel,
}: UseSmartItineraryTableStateParams): SmartItineraryTableState {
  const allDisplayItems = graphItems ?? items;
  const canEdit = role === "owner" || role === "organizer" || role === "traveler";
  const canManageTripPlans = canTripRole(role, "manageTripPlans");
  const canRestructureItems = canEdit && canRestructure;
  const [collapsedDays, setCollapsedDays] = useState<string[]>([]);
  const {
    displayItems,
    filterOptions,
    selectedFilterLabel,
    selectedPathIds,
    selectedPathIdSet,
    togglePlanFilter,
  } = useSmartItineraryPathFilters({
    items: allDisplayItems,
    pathOptions,
    selectedCountLabel,
    selectedNamesLabel,
  });
  const displayDayGroups = groupItemsByDay(displayItems);
  const groups = mergeTripDayGroups(
    displayDayGroups,
    startDate,
    endDate,
    getTripDates(startDate, endDate),
  );

  const dailyBriefingsByDate = new Map(
    dailyBriefings.map((briefing) => [briefing.date, briefing]),
  );

  const graphItemsByDay = groupGraphItemsByDay(displayItems);

  const selectedItem = selectedItemId
    ? allDisplayItems.find((item) => item.id === selectedItemId)
    : undefined;
  const selectedDay = selectedItem?.day;

  const warningCount = selectedDay
    ? displayDayGroups
        .filter((group) => group.day === selectedDay)
        .reduce((total, group) => total + group.warningCount, 0)
    : displayDayGroups.reduce(
        (total, group) => total + group.warningCount,
        0,
      );
  const {
    subActivitiesCount,
    flexibleItemsCount,
    totalMinutes,
  } = computeItinerarySummaryCounts(displayItems);

  const graphColumnWidth = buildGraphColumnWidth(
    displayItems,
    graphColumnMinWidth,
    graphColumnSidePadding,
    graphColumnLaneGap,
  );

  const smartTableStyle = {
    "--graph-column-width": `${graphColumnWidth}px`,
  } as CSSProperties;

  function toggleDay(day: string) {
    setCollapsedDays((current) => toggleCollapsedDay(current, day));
  }

  return {
    filterOptions,
    selectedPathIds,
    selectedPathIdSet,
    displayItems,
    selectedFilterLabel,
    groups,
    canEdit,
    canManageTripPlans,
    canRestructureItems,
    collapsedDays,
    dailyBriefingsByDate,
    graphItemsByDay,
    warningCount,
    totalMinutes,
    subActivitiesCount,
    flexibleItemsCount,
    graphColumnWidth,
    smartTableStyle,
    toggleDay,
    togglePlanFilter,
  };
}
