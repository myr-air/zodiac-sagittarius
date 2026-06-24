import { cn } from "@/src/lib/cn";
import {
  activeMapDayFilterButtonClassName,
  mapDayFilterButtonClassName,
  mapDayFilterClassName,
  mapDaySwatchClassName,
} from "./route-map.config";
import {
  dayFilterStyle,
} from "./route-map.utils";
import { allDaysFilter, type DayFilter, type RouteDayGroup } from "./route-map.types";

export function RouteMapDayFilter({
  activeDay,
  allDaysLabel,
  filterLabel,
  onChange,
  routeDayGroups,
}: {
  activeDay: DayFilter;
  allDaysLabel: string;
  filterLabel: string;
  onChange: (day: DayFilter) => void;
  routeDayGroups: RouteDayGroup[];
}) {
  return (
    <div className={mapDayFilterClassName} aria-label={filterLabel}>
      <button
        type="button"
        className={cn(
          mapDayFilterButtonClassName,
          activeDay === allDaysFilter && activeMapDayFilterButtonClassName,
        )}
        aria-pressed={activeDay === allDaysFilter}
        onClick={() => onChange(allDaysFilter)}
      >
        {allDaysLabel}
      </button>
      {routeDayGroups.map((group) => (
        <button
          type="button"
          className={cn(
            mapDayFilterButtonClassName,
            activeDay === group.day && activeMapDayFilterButtonClassName,
          )}
          aria-pressed={activeDay === group.day}
          key={group.day}
          style={dayFilterStyle(group.color)}
          onClick={() => onChange(group.day)}
        >
          <span className={mapDaySwatchClassName} aria-hidden="true" />
          {group.label}
        </button>
      ))}
    </div>
  );
}
