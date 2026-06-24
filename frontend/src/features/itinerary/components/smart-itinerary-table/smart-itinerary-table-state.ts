import type { CSSProperties } from "react";
import type {
  ItineraryItem,
  TripDailyBriefing,
} from "@/src/trip/types";
import type { mergeTripDayGroups } from "@/src/features/itinerary/domain/itinerary-table-grouping";

export interface SmartItineraryTableFilterState {
  displayItems: ItineraryItem[];
  filterOptions: { id: string; name: string }[];
  groups: ReturnType<typeof mergeTripDayGroups>;
  selectedFilterLabel: string;
  selectedPathIds: string[];
  selectedPathIdSet: Set<string>;
}

export interface SmartItineraryTablePresentationState {
  canEdit: boolean;
  canManageTripPlans: boolean;
  canRestructureItems: boolean;
}

export interface SmartItineraryTableDerivedState {
  dailyBriefingsByDate: Map<string, TripDailyBriefing>;
  graphColumnWidth: number;
  graphItemsByDay: Map<string, ItineraryItem[]>;
  smartTableStyle: CSSProperties;
  totalMinutes: number;
  warningCount: number;
}

export interface SmartItineraryTableState
  extends SmartItineraryTableFilterState,
    SmartItineraryTablePresentationState,
    SmartItineraryTableDerivedState {
  collapsedDays: string[];
  toggleDay: (day: string) => void;
  togglePlanFilter: (pathId: string) => void;
}

export function toggleCollapsedDay(
  collapsedDays: string[],
  day: string,
): string[] {
  return collapsedDays.includes(day)
    ? collapsedDays.filter((item) => item !== day)
    : [...collapsedDays, day];
}
