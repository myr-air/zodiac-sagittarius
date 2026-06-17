import { buildEmptyTripFixture, buildDenseTripFixture, tripFixture } from "@/src/trip/trip-fixtures";
import type { ItineraryItem } from "@/src/trip/types";
import type { SmartItineraryTable } from "@/src/features/itinerary/components";
import type { ItineraryPathOption } from "@/src/trip/itinerary";
import { defaultSmartItineraryPathOptions } from "@/src/features/itinerary/testing";
import {
  mainPathOption,
  pathOptionStoryPlanA,
  pathOptionStoryPlanB,
  pathOptionStoryPlanC,
  pathIdStoryPlanA,
  pathIdStoryPlanB,
  pathIdStoryPlanC,
  pathIdStoryRain,
  storyRainPathOption,
} from "@/src/features/itinerary/testing";

export type SmartItineraryStoryArgs = Parameters<typeof SmartItineraryTable>[0];

const day = tripFixture.trip.startDate;

const noop = () => {};

export const defaultPathOptions = [
  ...defaultSmartItineraryPathOptions.map((option) =>
    option.scope === "day" ? { ...option, day } : option,
  ),
] satisfies ReadonlyArray<ItineraryPathOption>;

export const branchGraphPathOptions: ItineraryPathOption[] = [
  mainPathOption,
  storyRainPathOption,
  pathOptionStoryPlanA,
];

export const planAPathOptions: ItineraryPathOption[] = [
  mainPathOption,
  pathOptionStoryPlanA,
];

export const planABPathOptions: ItineraryPathOption[] = [
  mainPathOption,
  pathOptionStoryPlanA,
  pathOptionStoryPlanB,
];

export const stressPathOptions: ItineraryPathOption[] = [
  mainPathOption,
  pathOptionStoryPlanA,
  pathOptionStoryPlanB,
  pathOptionStoryPlanC,
];

export const ownerStoryArgs: SmartItineraryStoryArgs = {
  endDate: tripFixture.trip.endDate,
  items: tripFixture.planItems,
  tripPlans: tripFixture.trip.planVariants,
  selectedTripPlanId: tripFixture.trip.activePlanVariantId,
  mainTripPlanId: tripFixture.trip.mainTripPlanId ?? tripFixture.trip.activePlanVariantId,
  tripPlanError: null,
  isTripPlanBusy: false,
  pathOptions: defaultPathOptions,
  role: "owner",
  startDate: tripFixture.trip.startDate,
  selectedItemId: "item-dimdim",
  dayPathOverrides: { [tripFixture.trip.startDate]: pathIdStoryRain },
  showAllPaths: false,
  tripName: tripFixture.trip.name,
  onAddStop: noop,
  onOpenItemDetails: noop,
  onSelectItem: noop,
  onMoveItemToPath: noop,
  onChangeTripPlan: noop,
  onChangeTripPlanStatus: noop,
  onSetMainTripPlan: noop,
  onCreateTripPlan: noop,
  onRenameTripPlan: noop,
  onChangeDayPath: noop,
  onClearDayPath: noop,
  onToggleShowAllPaths: noop,
};

export const buildOwnerStoryArgs = (
  overrides: Partial<SmartItineraryStoryArgs> = {},
): SmartItineraryStoryArgs => ({
  ...ownerStoryArgs,
  ...overrides,
});

function toScoped<T extends { id: string; pathGroupId?: string }>(items: T[], namespace: string): T[] {
  return items.map((item) => ({
    ...item,
    id: `${namespace}-${item.id}`,
    pathGroupId: item.pathGroupId ? `${namespace}-${item.pathGroupId}` : item.pathGroupId,
  }));
}

const buildBaseItem = (
  sourceIndex: number,
  patch: Partial<ItineraryItem>,
): ItineraryItem => {
  return {
    ...tripFixture.planItems[sourceIndex],
    startTime: "08:00",
    durationMinutes: 60,
    sortOrder: 100,
    activity: "",
    day,
    ...patch,
  } as ItineraryItem;
};

export const branchGraphItemsBase: ItineraryItem[] = [
  buildBaseItem(0, {
    id: "graph-main",
    startTime: "08:00",
    durationMinutes: 45,
    sortOrder: 100,
    activity: "Dim Sum morning",
    pathGroupId: "path-group-morning",
    pathRole: "main",
  }),
  buildBaseItem(1, {
    id: "graph-rain",
    startTime: "08:20",
    durationMinutes: 80,
    sortOrder: 200,
    activity: "Rain museum",
    pathGroupId: "path-group-morning",
    pathId: pathIdStoryRain,
    pathName: "Rain plan",
    pathRole: "alternative",
  }),
  buildBaseItem(2, {
    id: "graph-late",
    startTime: "09:45",
    durationMinutes: 45,
    sortOrder: 300,
    activity: "Late coffee",
    pathGroupId: "path-group-morning",
    pathId: pathIdStoryPlanA,
    pathName: "Plan A",
    pathRole: "alternative",
  }),
  buildBaseItem(3, {
    id: "graph-lunch",
    startTime: "11:15",
    durationMinutes: 60,
    sortOrder: 400,
    activity: "Central lunch",
    pathRole: "main",
  }),
];

export const planAExampleItemsBase: ItineraryItem[] = [
  buildBaseItem(0, {
    id: "plan-a-main-breakfast",
    startTime: "08:00",
    durationMinutes: 75,
    sortOrder: 100,
    activity: "Harbour breakfast",
    place: "Main checkpoint",
    pathRole: "main",
  }),
  buildBaseItem(1, {
    id: "plan-a-museum",
    startTime: "08:15",
    durationMinutes: 60,
    sortOrder: 200,
    activity: "Plan A museum stop",
    place: "Plan A checkpoint",
    pathId: pathIdStoryPlanA,
    pathName: "Plan A",
    pathRole: "alternative",
  }),
  buildBaseItem(2, {
    id: "plan-a-cafe",
    startTime: "09:45",
    durationMinutes: 45,
    sortOrder: 300,
    activity: "Plan A cafe backup",
    place: "Plan A checkpoint",
    pathId: pathIdStoryPlanA,
    pathName: "Plan A",
    pathRole: "alternative",
  }),
  buildBaseItem(3, {
    id: "plan-a-main-lunch",
    startTime: "11:00",
    durationMinutes: 60,
    sortOrder: 400,
    activity: "Main lunch",
    place: "Main checkpoint",
    pathRole: "main",
  }),
];

export const planABAlternativeItemsBase: ItineraryItem[] = [
  [
    "plan-ab-main-breakfast",
    "08:00",
    60,
    100,
    "Harbour breakfast",
    "Main",
    undefined,
    "main",
  ],
  [
    "plan-ab-a-gallery",
    "10:00",
    75,
    200,
    "Plan A gallery route",
    "Plan A",
    pathIdStoryPlanA,
    "alternative",
  ],
  [
    "plan-ab-b-harbour",
    "14:00",
    90,
    300,
    "Plan B harbour route",
    "Plan B",
    pathIdStoryPlanB,
    "alternative",
  ],
  [
    "plan-ab-main-dinner",
    "18:00",
    75,
    400,
    "Main dinner meet-up",
    "Main",
    undefined,
    "main",
  ],
].map(([id, startTime, durationMinutes, sortOrder, activity, pathName, pathId, pathRole]) =>
  buildBaseItem(0, {
    id: id as string,
    startTime: startTime as string,
    durationMinutes: durationMinutes as number,
    sortOrder: sortOrder as number,
    activity: activity as string,
    activityType: "experience",
    place: `${pathName} checkpoint`,
    pathGroupId: "plan-ab-clean-branch",
    pathId: pathId as string | undefined,
    pathName: pathId ? (pathName as string) : undefined,
    pathRole: pathRole as ItineraryItem["pathRole"],
  }),
);

export const requestedPlanExampleItemsBase: ItineraryItem[] = [
  ["requested-main-0800", "08:00", 60, 100, "Main 08:00 block", undefined, undefined, "main"],
  ["requested-main-0900", "09:00", 120, 200, "Main 09:00 block", undefined, undefined, "main"],
  ["requested-plan-a-0900", "09:00", 30, 210, "Plan A 09:00 branch", pathIdStoryPlanA, "Plan A", "alternative"],
  ["requested-plan-a-1000", "10:00", 60, 300, "Plan A 10:00 follow up", pathIdStoryPlanA, "Plan A", "alternative"],
  ["requested-main-1100", "11:00", 60, 400, "Main 11:00 block", undefined, undefined, "main"],
  ["requested-main-1200", "12:00", 180, 500, "Main 12:00 block", undefined, undefined, "main"],
  ["requested-plan-a-1230", "12:30", 60, 510, "Plan A 12:30 branch", pathIdStoryPlanA, "Plan A", "alternative"],
  ["requested-main-1600", "16:00", 60, 600, "Main 16:00 block", undefined, undefined, "main"],
].map(([id, startTime, durationMinutes, sortOrder, activity, pathId, pathName, pathRole]) =>
  buildBaseItem(0, {
    id: id as string,
    startTime: startTime as string,
    durationMinutes: durationMinutes as number,
    sortOrder: sortOrder as number,
    activity: activity as string,
    activityType: "experience",
    place: pathName ? `${pathName} checkpoint` : "Main checkpoint",
    pathId: pathId as string | undefined,
    pathName: pathName as string | undefined,
    pathRole: pathRole as ItineraryItem["pathRole"],
  }),
);

export const stressPathItemsBase: ItineraryItem[] = [
  ["stress-0800-main", "08:00", 75, 100, "Harbour breakfast", "Main", undefined, "main"],
  ["stress-0805-a", "08:05", 90, 110, "Museum sprint", "Plan A", pathIdStoryPlanA, "alternative"],
  ["stress-0810-b", "08:10", 70, 120, "Market photo walk", "Plan B", pathIdStoryPlanB, "alternative"],
  ["stress-0815-c", "08:15", 85, 130, "Ferry slow route", "Plan C", pathIdStoryPlanC, "alternative"],
  ["stress-1000-main", "10:00", 60, 200, "Peak tram queue", "Main", undefined, "main"],
  ["stress-1005-a", "10:05", 65, 210, "Indoor tram backup", "Plan A", pathIdStoryPlanA, "alternative"],
  ["stress-1010-b", "10:10", 80, 220, "Bus scenic route", "Plan B", pathIdStoryPlanB, "alternative"],
  ["stress-1015-c", "10:15", 55, 230, "Taxi direct route", "Plan C", pathIdStoryPlanC, "alternative"],
  ["stress-1230-main", "12:30", 75, 300, "Central lunch", "Main", undefined, "main"],
  ["stress-1235-a", "12:35", 65, 310, "Dim sum backup", "Plan A", pathIdStoryPlanA, "alternative"],
  ["stress-1240-b", "12:40", 70, 320, "Noodle shop backup", "Plan B", pathIdStoryPlanB, "alternative"],
  ["stress-1245-c", "12:45", 80, 330, "Vegetarian backup", "Plan C", pathIdStoryPlanC, "alternative"],
  ["stress-1500-main", "15:00", 50, 400, "Hotel recharge", "Main", undefined, "main"],
  ["stress-1505-a", "15:05", 60, 410, "Cafe work block", "Plan A", pathIdStoryPlanA, "alternative"],
  ["stress-1510-b", "15:10", 45, 420, "Souvenir window", "Plan B", pathIdStoryPlanB, "alternative"],
  ["stress-1515-c", "15:15", 55, 430, "Quiet park break", "Plan C", pathIdStoryPlanC, "alternative"],
].map(([id, startTime, durationMinutes, sortOrder, activity, pathName, pathId, pathRole]) =>
  buildBaseItem(0, {
    id: id as string,
    startTime: startTime as string,
    durationMinutes: durationMinutes as number,
    sortOrder: sortOrder as number,
    activity: activity as string,
    activityType: "experience",
    place: `${pathName} checkpoint`,
    pathGroupId: `stress-group-${Math.floor((sortOrder as number) / 100)}`,
    pathId: pathId as string | undefined,
    pathName: pathId ? (pathName as string) : undefined,
    pathRole: pathRole as ItineraryItem["pathRole"],
  }),
);

export const windowOnlyDurationItemBase = [
  buildBaseItem(0, {
    id: "window-only-duration",
    day,
    startTime: "09:00",
    endTime: "10:45",
    endOffsetDays: 0,
    durationMinutes: null,
    sortOrder: 100,
    activity: "Window only duration",
    place: "Main checkpoint",
    pathRole: "main",
  }),
];

export function withStoryPrefix<T extends { id: string; pathGroupId?: string }>(items: T[], prefix: string): T[] {
  return toScoped(items, prefix);
}

export const denseTripFixture = buildDenseTripFixture();
export const emptyTripFixture = buildEmptyTripFixture();
