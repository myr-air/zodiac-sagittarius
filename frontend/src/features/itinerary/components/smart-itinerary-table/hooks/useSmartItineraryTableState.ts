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
  itineraryView,
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
  const warningCount =
    itineraryView?.warningCount ??
    displayDayGroups.reduce((total, group) => total + group.warningCount, 0);
  const totalMinutes = displayItems.reduce(
    (total, item) => total + (item.durationMinutes ?? 0),
    0,
  );

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
    graphColumnWidth,
    smartTableStyle,
    toggleDay,
    togglePlanFilter,
  };
}
