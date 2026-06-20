import { useEffect, useMemo, useRef, useState } from "react";
import type { ItineraryPathOption } from "@/src/trip/itinerary";
import { itineraryItemPathId } from "@/src/trip/itinerary-path-identifiers";
import type { ItineraryItem } from "@/src/trip/types";
import {
  dedupePathOptions,
  formatSelectedPlanLabel,
} from "../smart-itinerary-table-utils";

interface UseSmartItineraryPathFiltersParams {
  items: ItineraryItem[];
  pathOptions: ItineraryPathOption[];
  selectedCountLabel: ({ count }: { count: number }) => string;
  selectedNamesLabel: ({ names }: { names: string }) => string;
}

export function useSmartItineraryPathFilters({
  items,
  pathOptions,
  selectedCountLabel,
  selectedNamesLabel,
}: UseSmartItineraryPathFiltersParams) {
  const filterOptions = dedupePathOptions(pathOptions, items);
  const [selectedPathIds, setSelectedPathIds] = useState<string[]>(() =>
    filterOptions.map((option) => option.id),
  );
  const knownFilterIdsRef = useRef<string[]>(
    filterOptions.map((option) => option.id),
  );

  const selectedPathIdSet = useMemo(
    () => new Set(selectedPathIds),
    [selectedPathIds],
  );

  const displayItems = useMemo(
    () => items.filter((item) => selectedPathIdSet.has(itineraryItemPathId(item))),
    [items, selectedPathIdSet],
  );

  const selectedFilterLabel = formatSelectedPlanLabel(
    filterOptions,
    selectedPathIds,
    selectedCountLabel,
    selectedNamesLabel,
  );

  useEffect(() => {
    setSelectedPathIds((current) => {
      const optionIds = filterOptions.map((option) => option.id);
      const previousOptionIds = knownFilterIdsRef.current;
      const nextIds = optionIds.filter(
        (id) => current.includes(id) || !previousOptionIds.includes(id),
      );
      knownFilterIdsRef.current = optionIds;
      return nextIds.length === current.length &&
        nextIds.every((id, index) => id === current[index])
        ? current
        : nextIds;
    });
  }, [filterOptions]);

  function togglePlanFilter(pathId: string) {
    setSelectedPathIds((current) =>
      current.includes(pathId)
        ? current.filter((item) => item !== pathId)
        : [...current, pathId],
    );
  }

  return {
    displayItems,
    filterOptions,
    selectedFilterLabel,
    selectedPathIds,
    selectedPathIdSet,
    togglePlanFilter,
  };
}
