import type { Locale } from "@/src/i18n/types";
import type { TripDailyBriefing } from "@/src/trip/types";
import type {
  ItineraryItem,
  PlanVariant,
  PlanStatus,
} from "@/src/trip/types";
import type { ItineraryDayGroup, ItineraryPathOption } from "@/src/trip/itinerary";
import {
  formatSolarTime,
  formatWeatherTemp,
  weatherGraphicLabel,
  weatherIconForCondition,
} from "@/src/trip/weather-briefings";
import {
  mainItineraryPathId,
  mainItineraryPathName,
} from "@/src/trip/itinerary-path-identifiers";

function formatWeatherSummaryParts(
  weather: TripDailyBriefing["weather"],
): string[] {
  const condition = weatherGraphicLabel(weather?.conditionCode);
  const hasForecastTemps =
    typeof weather?.temperatureMaxCelsius === "number" &&
    typeof weather?.temperatureMinCelsius === "number";
  const hasCondition = Boolean(weather?.conditionCode && weather.conditionCode !== "unavailable");

  const weatherLabel =
    hasForecastTemps
      ? `${condition} ${formatWeatherTemp(weather.temperatureMaxCelsius)} ${formatWeatherTemp(weather.temperatureMinCelsius)}`
      : hasCondition
        ? condition
        : "";

  return [weatherLabel].filter(Boolean);
}

export function mergeTripDayGroups(
  groups: ItineraryDayGroup[],
  startDate: string,
  endDate: string,
  tripDates: string[],
): ItineraryDayGroup[] {
  const groupsByDay = new Map(groups.map((group) => [group.day, group]));
  const days = new Set<string>(tripDates);
  for (const group of groups) {
    if (group.items.length) days.add(group.day);
  }

  return Array.from(days)
    .sort()
    .map((day) => groupsByDay.get(day) ?? { day, items: [], warningCount: 0 });
}

export function groupTopLevelItems(items: ItineraryItem[]): ItineraryItem[] {
  const itemIds = new Set(items.map((item) => item.id));
  return items.filter(
    (item) => !item.parentItemId || !itemIds.has(item.parentItemId),
  );
}

export function groupChildItemsByParent(
  items: ItineraryItem[],
): Map<string, ItineraryItem[]> {
  const childrenByParent = new Map<string, ItineraryItem[]>();
  for (const item of items) {
    if (!item.parentItemId) continue;
    childrenByParent.set(item.parentItemId, [
      ...(childrenByParent.get(item.parentItemId) ?? []),
      item,
    ]);
  }
  for (const [parentId, children] of childrenByParent) {
    childrenByParent.set(parentId, [...children].sort(compareItineraryItems));
  }
  return childrenByParent;
}

export function compareItineraryItems(a: ItineraryItem, b: ItineraryItem): number {
  if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder;
  if (a.startTime !== b.startTime) return a.startTime.localeCompare(b.startTime);
  return a.activity.localeCompare(b.activity);
}

export function itemStatusLabel(
  status: NonNullable<ItineraryItem["status"]>,
  locale: Locale,
): string {
  const labels: Record<Locale, Record<NonNullable<ItineraryItem["status"]>, string>> = {
    en: {
      idea: "Idea",
      planned: "Planned",
      booked: "Booked",
      confirmed: "Confirmed",
      done: "Done",
      skipped: "Skipped",
    },
    th: {
      idea: "ไอเดีย",
      planned: "วางแผนแล้ว",
      booked: "จองแล้ว",
      confirmed: "ยืนยันแล้ว",
      done: "เสร็จแล้ว",
      skipped: "ข้าม",
    },
  };

  return labels[locale][status];
}

export function groupGraphItemsByDay(
  items: ItineraryItem[],
): Map<string, ItineraryItem[]> {
  const itemsByDay = new Map<string, ItineraryItem[]>();
  for (const item of items) {
    itemsByDay.set(item.day, [...(itemsByDay.get(item.day) ?? []), item]);
  }
  return itemsByDay;
}

export function buildGraphColumnWidth(
  items: ItineraryItem[],
  graphColumnMinWidth: number,
  graphColumnSidePadding: number,
  graphColumnLaneGap: number,
): number {
  const pathCountsByDay = new Map<string, Set<string>>();
  const itemsByDay = groupGraphItemsByDay(items);
  for (const [day, dayItems] of itemsByDay) {
    const dayPaths =
      pathCountsByDay.get(day) ?? new Set<string>([mainItineraryPathId]);
    dayItems.forEach((item) => {
      const pathId =
        item.pathRole === "alternative"
          ? (item.pathId ?? item.id)
          : mainItineraryPathId;
      dayPaths.add(pathId);
    });
    pathCountsByDay.set(day, dayPaths);
  }
  const laneCount = Math.max(
    1,
    ...Array.from(pathCountsByDay.values(), (paths) => paths.size),
  );
  return Math.max(
    graphColumnMinWidth,
    graphColumnSidePadding * 2 + (laneCount - 1) * graphColumnLaneGap + 12,
  );
}

export function dedupePathOptions(
  pathOptions: ItineraryPathOption[],
  items: ItineraryItem[],
): { id: string; name: string }[] {
  const optionsById = new Map<string, { id: string; name: string }>();
  pathOptions.forEach((option) => {
    optionsById.set(option.id, { id: option.id, name: option.name });
  });
  items.forEach((item) => {
    const pathId = item.pathRole === "main"
      ? item.pathId ?? mainItineraryPathId
      : item.pathId ?? item.id;
    if (!optionsById.has(pathId)) {
      optionsById.set(pathId, {
        id: pathId,
        name: item.pathName ?? (pathId === mainItineraryPathId ? mainItineraryPathName : pathId),
      });
    }
  });
  if (!optionsById.has(mainItineraryPathId)) {
    optionsById.set(mainItineraryPathId, { id: mainItineraryPathId, name: mainItineraryPathName });
  }
  return Array.from(optionsById.values());
}

export function formatSelectedPlanLabel(
  filterOptions: { id: string; name: string }[],
  selectedPathIds: string[],
  countLabel: ({ count }: { count: number }) => string,
  namesLabel: ({ names }: { names: string }) => string,
): string {
  const selectedNames = filterOptions
    .filter((option) => selectedPathIds.includes(option.id))
    .map((option) => option.name);
  if (selectedNames.length === 0) return countLabel({ count: 0 });
  if (selectedNames.length <= 2)
    return namesLabel({ names: selectedNames.join(", ") });
  return namesLabel({
    names: `${selectedNames.slice(0, 2).join(", ")} +${selectedNames.length - 2}`,
  });
}

export function formatTripPlanOptionLabel(
  plan: PlanVariant,
  statusLabels: Readonly<Record<PlanStatus, string>>,
): string {
  const status = tripPlanStatus(plan);
  return `${plan.name} - ${statusLabels[status]}`;
}

export function tripPlanStatus(plan: PlanVariant): PlanStatus {
  return plan.status ?? (plan.kind === "split" ? "proposal" : plan.kind);
}

export function formatFeelsLike(
  high: number | null | undefined,
  low: number | null | undefined,
): string | null {
  if (typeof high !== "number" && typeof low !== "number") return null;
  const temps = [
    typeof high === "number" ? formatWeatherTemp(high) : null,
    typeof low === "number" ? formatWeatherTemp(low) : null,
  ].filter(Boolean);
  return `Feels ${temps.join(" ")}`;
}

export function formatRainDetail(
  chance: number | null | undefined,
  amount: number | null | undefined,
  hours: number | null | undefined,
): string | null {
  const parts = [
    typeof chance === "number" ? `${chance}%` : null,
    typeof amount === "number" ? `${formatDecimal(amount)} mm` : null,
    typeof hours === "number" ? `${formatDecimal(hours)}h` : null,
  ].filter(Boolean);
  return parts.length ? `Rain ${parts.join(" · ")}` : null;
}

export function formatUvIndex(value: number | null | undefined): string | null {
  return typeof value === "number" ? `UV ${formatDecimal(value)}` : null;
}

export function formatWindDetail(
  speed: number | null | undefined,
  gusts: number | null | undefined,
): string | null {
  if (typeof speed !== "number" && typeof gusts !== "number") return null;
  const parts = [
    typeof speed === "number" ? `${Math.round(speed)} km/h` : null,
    typeof gusts === "number" ? `gust ${Math.round(gusts)} km/h` : null,
  ].filter(Boolean);
  return `Wind ${parts.join(" · ")}`;
}

export function formatVisibilityDetail(value: number | null | undefined): string | null {
  return typeof value === "number" ? `Visibility min ${formatDecimal(value / 1000)} km` : null;
}

export function formatPercentDetail(
  label: string,
  value: number | null | undefined,
): string | null {
  return typeof value === "number" ? `${label} ${value}%` : null;
}

export function formatDecimal(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

export function buildWeatherTooltip(
  weather: TripDailyBriefing["weather"],
  summary: string,
  sunrise: string | null,
  sunset: string | null,
): string {
  if (!weather) return summary;
  const details = [
    formatFeelsLike(weather.apparentTemperatureMaxCelsius, weather.apparentTemperatureMinCelsius),
    formatRainDetail(weather.rainChancePercent, weather.precipitationSumMm, weather.precipitationHours),
    formatUvIndex(weather.uvIndexMax),
    formatWindDetail(weather.windSpeedKph, weather.windGustsKph),
    formatVisibilityDetail(weather.visibilityMinMeters),
    formatPercentDetail("Humidity", weather.humidityPercent),
    sunrise && sunset ? `Sun ${sunrise}/${sunset}` : null,
  ].filter(Boolean);
  return [summary, ...details].filter(Boolean).join("\n");
}

export function buildWeatherSummary(
  briefing: TripDailyBriefing,
  dayLabel: string,
): { weatherLabel: string; tooltip: string } | null {
  const weather = briefing.weather;
  const hasForecastTemps =
    typeof weather?.temperatureMaxCelsius === "number" &&
    typeof weather?.temperatureMinCelsius === "number";
  const hasCondition = Boolean(
    weather?.conditionCode && weather.conditionCode !== "unavailable",
  );
  if (!weather || (!hasForecastTemps && !hasCondition)) return null;

  const sunrise = formatSolarTime(weather?.sunrise);
  const sunset = formatSolarTime(weather?.sunset);
  const weatherLabel = formatWeatherSummaryParts(weather).join(" ");
  const tooltipLabel = buildWeatherTooltip(weather, weatherLabel, sunrise, sunset);

  return {
    weatherLabel,
    tooltip: `${dayLabel}: ${tooltipLabel}`,
  };
}

export function weatherIcon(weatherConditionCode: string | undefined): ReturnType<typeof weatherIconForCondition> {
  return weatherIconForCondition(weatherConditionCode);
}

export function weatherConditionLabel(conditionCode: string | undefined): string {
  return weatherGraphicLabel(conditionCode);
}

export function formatSolarTimeRange(sunrise: string | null, sunset: string | null): string {
  return sunrise && sunset ? `${sunrise}/${sunset}` : "";
}
