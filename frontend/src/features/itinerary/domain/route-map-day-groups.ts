import { formatDayLabel, groupItemsByDay } from "@/src/trip/itinerary-core";
import {
  allDaysFilter,
  type DayFilter,
  routeDayColors,
  type RouteDayGroup,
  type RoutePoint,
} from "./route-map-types";

export function activeDayLabel(
  activeDay: DayFilter,
  groups: RouteDayGroup[],
  allDays = "All days",
  chooseDay = "Choose day",
): string {
  if (activeDay === allDaysFilter) return allDays;
  return groups.find((group) => group.day === activeDay)?.label ?? chooseDay;
}

export function dayColorFor(day: string, groups: RouteDayGroup[]): string {
  return groups.find((group) => group.day === day)?.color ?? routeDayColors[0];
}

export function buildRouteDayGroups(
  groups: ReturnType<typeof groupItemsByDay>,
  routePoints: RoutePoint[],
  startDate: string,
  locale: "en" | "th",
): RouteDayGroup[] {
  return groups.map((group, index) => ({
    color: routeDayColors[index % routeDayColors.length],
    day: group.day,
    label: formatDayLabel(group.day, startDate, locale),
    points: routePoints.filter((point) => point.item.day === group.day),
  }));
}
