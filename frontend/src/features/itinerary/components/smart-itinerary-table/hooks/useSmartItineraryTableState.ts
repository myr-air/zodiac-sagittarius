import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import type {
  ItineraryItem,
  TripDailyBriefing,
  TripRole,
} from "@/src/trip/types";
import {
  getTripDates,
  groupItemsByDay,
  type ItineraryPathOption,
  type ItineraryView,
} from "@/src/trip/itinerary";
import { canTripRole } from "@/src/trip/auth";
import { itineraryItemPathId } from "@/src/trip/itinerary-path-identifiers";
import {
  buildGraphColumnWidth,
  dedupePathOptions,
  formatSelectedPlanLabel,
  groupGraphItemsByDay,
  mergeTripDayGroups,
} from "../smart-itinerary-table-utils";
import {
  graphColumnLaneGap,
  graphColumnMinWidth,
  graphColumnSidePadding,
} from "../smart-itinerary-table.styles";

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

interface SmartItineraryTableFilterState {
  filterOptions: { id: string; name: string }[];
  selectedPathIds: string[];
  selectedPathIdSet: Set<string>;
  displayItems: ItineraryItem[];
  selectedFilterLabel: string;
  groups: ReturnType<typeof mergeTripDayGroups>;
}

interface SmartItineraryTablePresentationState {
  canEdit: boolean;
  canManageTripPlans: boolean;
  canRestructureItems: boolean;
}

interface SmartItineraryTableDerivedState {
  dailyBriefingsByDate: Map<string, TripDailyBriefing>;
  graphItemsByDay: Map<string, ItineraryItem[]>;
  warningCount: number;
  totalMinutes: number;
  graphColumnWidth: number;
  smartTableStyle: CSSProperties;
}

export interface SmartItineraryTableState
  extends SmartItineraryTableFilterState,
    SmartItineraryTablePresentationState,
    SmartItineraryTableDerivedState {
  collapsedDays: string[];
  toggleDay: (day: string) => void;
  togglePlanFilter: (pathId: string) => void;
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
  const filterOptions = dedupePathOptions(pathOptions, allDisplayItems);
  const canEdit = role === "owner" || role === "organizer" || role === "traveler";
  const canManageTripPlans = canTripRole(role, "manageTripPlans");
  const canRestructureItems = canEdit && canRestructure;
  const [selectedPathIds, setSelectedPathIds] = useState<string[]>(() =>
    filterOptions.map((option) => option.id),
  );
  const [collapsedDays, setCollapsedDays] = useState<string[]>([]);
  const knownFilterIdsRef = useRef<string[]>(
    filterOptions.map((option) => option.id),
  );

  const selectedPathIdSet = useMemo(
    () => new Set(selectedPathIds),
    [selectedPathIds],
  );

  const displayItems = useMemo(
    () =>
      allDisplayItems.filter((item) => selectedPathIdSet.has(itineraryItemPathId(item))),
    [allDisplayItems, selectedPathIdSet],
  );

  const selectedFilterLabel = formatSelectedPlanLabel(
    filterOptions,
    selectedPathIds,
    selectedCountLabel,
    selectedNamesLabel,
  );
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

  useEffect(() => {
    setSelectedPathIds((current) => {
      const optionIds = filterOptions.map((option: { id: string; name: string }) => option.id);
      const previousOptionIds = knownFilterIdsRef.current;
      const nextIds = optionIds.filter(
        (id: string) => current.includes(id) || !previousOptionIds.includes(id),
      );
      knownFilterIdsRef.current = optionIds;
      return nextIds.length === current.length &&
        nextIds.every((id: string, index: number) => id === current[index])
        ? current
        : nextIds;
    });
  }, [filterOptions]);

  function toggleDay(day: string) {
    setCollapsedDays((current) =>
      current.includes(day)
        ? current.filter((item) => item !== day)
        : [...current, day],
    );
  }

  function togglePlanFilter(pathId: string) {
    setSelectedPathIds((current) =>
      current.includes(pathId)
        ? current.filter((item) => item !== pathId)
        : [...current, pathId],
    );
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
