import type { Messages } from "@/src/i18n/messages";
import {
  headerControlsSectionClassName,
  headerControlsSectionHeaderClassName,
  pathFilterOptionClassName,
  pathFilterPanelClassName,
  pathFilterSummaryClassName,
  showAllPathsToggleClassName,
} from "../smart-itinerary-table.styles";

type FilterOption = { id: string; name: string };

interface SmartItineraryTablePathFiltersProps {
  filterOptions: FilterOption[];
  itineraryLabels: Messages["itinerary"];
  onChangeShowAllPaths?: (showAll: boolean) => void;
  onTogglePathFilter: (pathId: string) => void;
  selectedFilterLabel: string;
  selectedPathIds: Set<string>;
  showAllPaths: boolean;
}

export function SmartItineraryTablePathFilters({
  filterOptions,
  itineraryLabels,
  onChangeShowAllPaths,
  onTogglePathFilter,
  selectedFilterLabel,
  selectedPathIds,
  showAllPaths,
}: SmartItineraryTablePathFiltersProps) {
  return (
    <div className={headerControlsSectionClassName}>
      <div className={headerControlsSectionHeaderClassName}>
        <strong>{itineraryLabels.filters.panelLabel}</strong>
        <span className={pathFilterSummaryClassName}>{selectedFilterLabel}</span>
      </div>
      <label className={showAllPathsToggleClassName}>
        <input
          type="checkbox"
          checked={showAllPaths}
          disabled={!onChangeShowAllPaths}
          onChange={(event) => onChangeShowAllPaths?.(event.target.checked)}
        />
        <span>{itineraryLabels.filters.showAllPaths}</span>
      </label>
      <div
        className={pathFilterPanelClassName}
        id="itinerary-plan-filters"
        role="region"
        aria-label={itineraryLabels.filters.panelLabel}
      >
        {filterOptions.map((option) => (
          <label className={pathFilterOptionClassName} key={option.id}>
            <input
              type="checkbox"
              checked={selectedPathIds.has(option.id)}
              onChange={() => onTogglePathFilter(option.id)}
            />
            <span>{option.name}</span>
          </label>
        ))}
      </div>
    </div>
  );
}
