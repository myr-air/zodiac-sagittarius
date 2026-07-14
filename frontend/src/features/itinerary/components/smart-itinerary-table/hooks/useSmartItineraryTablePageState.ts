import { useI18n } from "@/src/i18n/I18nProvider";
import type { ItineraryPathOption } from "@/src/trip/itinerary-paths";
import type { SmartItineraryTableProps } from "../SmartItineraryTable.types";
import { useSmartItineraryTableState } from "./useSmartItineraryTableState";

type UseSmartItineraryTablePageStateInput = Omit<Pick<
  SmartItineraryTableProps,
  | "canRestructure"
  | "dailyBriefings"
  | "endDate"
  | "graphItems"
  | "itineraryView"
  | "items"
  | "pathOptions"
  | "role"
  | "selectedItemId"
  | "startDate"
>, "pathOptions"> & {
  pathOptions: ItineraryPathOption[];
};

export function useSmartItineraryTablePageState({
  canRestructure = true,
  dailyBriefings = [],
  endDate,
  graphItems,
  itineraryView,
  items,
  pathOptions,
  role,
  selectedItemId,
  startDate,
}: UseSmartItineraryTablePageStateInput) {
  const { locale, t } = useI18n();
  const tableState = useSmartItineraryTableState({
    canRestructure,
    dailyBriefings,
    endDate,
    graphItems,
    itineraryView,
    items,
    pathOptions,
    role,
    selectedItemId,
    selectedCountLabel: t.itinerary.filters.selectedCount,
    selectedNamesLabel: t.itinerary.filters.selectedNames,
    startDate,
  });

  return {
    locale,
    t,
    tableState,
  };
}
