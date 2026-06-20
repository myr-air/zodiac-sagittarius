import {
  pathIdStoryPlanA,
  pathIdStoryPlanB,
  pathIdStoryPlanC,
  pathIdStoryRain,
} from "@/src/features/itinerary/testing";
import type { ItineraryItem } from "@/src/trip/types";
import {
  buildItineraryStoryItem,
  buildItineraryStoryPathItems,
} from "./itinerary-story-item-builders";
import {
  pathNameMain,
  pathNamePlanA,
  pathNamePlanB,
  pathNamePlanC,
} from "./itinerary-story-path-options";

export const branchGraphItemsBase: ItineraryItem[] = [
  buildItineraryStoryItem(0, {
    id: "graph-main",
    startTime: "08:00",
    durationMinutes: 45,
    sortOrder: 100,
    activity: "Dim Sum morning",
    pathGroupId: "path-group-morning",
    pathRole: "main",
  }),
  buildItineraryStoryItem(1, {
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
  buildItineraryStoryItem(2, {
    id: "graph-late",
    startTime: "09:45",
    durationMinutes: 45,
    sortOrder: 300,
    activity: "Late coffee",
    pathGroupId: "path-group-morning",
    pathId: pathIdStoryPlanA,
    pathName: pathNamePlanA,
    pathRole: "alternative",
  }),
  buildItineraryStoryItem(3, {
    id: "graph-lunch",
    startTime: "11:15",
    durationMinutes: 60,
    sortOrder: 400,
    activity: "Central lunch",
    pathRole: "main",
  }),
];

export const planAExampleItemsBase: ItineraryItem[] = [
  buildItineraryStoryItem(0, {
    id: "plan-a-main-breakfast",
    startTime: "08:00",
    durationMinutes: 75,
    sortOrder: 100,
    activity: "Harbour breakfast",
    place: `${pathNameMain} checkpoint`,
    pathRole: "main",
  }),
  buildItineraryStoryItem(1, {
    id: "plan-a-museum",
    startTime: "08:15",
    durationMinutes: 60,
    sortOrder: 200,
    activity: `${pathNamePlanA} museum stop`,
    place: "Plan A checkpoint",
    pathId: pathIdStoryPlanA,
    pathName: pathNamePlanA,
    pathRole: "alternative",
  }),
  buildItineraryStoryItem(2, {
    id: "plan-a-cafe",
    startTime: "09:45",
    durationMinutes: 45,
    sortOrder: 300,
    activity: `${pathNamePlanA} cafe backup`,
    place: `${pathNamePlanA} checkpoint`,
    pathId: pathIdStoryPlanA,
    pathName: pathNamePlanA,
    pathRole: "alternative",
  }),
  buildItineraryStoryItem(3, {
    id: "plan-a-main-lunch",
    startTime: "11:00",
    durationMinutes: 60,
    sortOrder: 400,
    activity: "Main lunch",
    place: `${pathNameMain} checkpoint`,
    pathRole: "main",
  }),
];

export const planABAlternativeItemsBase: ItineraryItem[] = buildItineraryStoryPathItems(
  [
    [
      "plan-ab-main-breakfast",
      "08:00",
      60,
      100,
      "Harbour breakfast",
      pathNameMain,
      undefined,
      "main",
    ],
    [
      "plan-ab-a-gallery",
      "10:00",
      75,
      200,
      `${pathNamePlanA} gallery route`,
      pathNamePlanA,
      pathIdStoryPlanA,
      "alternative",
    ],
    [
      "plan-ab-b-harbour",
      "14:00",
      90,
      300,
      `${pathNamePlanB} harbour route`,
      pathNamePlanB,
      pathIdStoryPlanB,
      "alternative",
    ],
    [
      "plan-ab-main-dinner",
      "18:00",
      75,
      400,
      `${pathNameMain} dinner meet-up`,
      pathNameMain,
      undefined,
      "main",
    ],
  ],
  {
    pathGroupId: () => "plan-ab-clean-branch",
  },
);

export const requestedPlanExampleItemsBase: ItineraryItem[] = buildItineraryStoryPathItems([
  ["requested-main-0800", "08:00", 60, 100, `${pathNameMain} 08:00 block`, pathNameMain, undefined, "main"],
  ["requested-main-0900", "09:00", 120, 200, `${pathNameMain} 09:00 block`, pathNameMain, undefined, "main"],
  ["requested-plan-a-0900", "09:00", 30, 210, `${pathNamePlanA} 09:00 branch`, pathNamePlanA, pathIdStoryPlanA, "alternative"],
  ["requested-plan-a-1000", "10:00", 60, 300, `${pathNamePlanA} 10:00 follow up`, pathNamePlanA, pathIdStoryPlanA, "alternative"],
  ["requested-main-1100", "11:00", 60, 400, `${pathNameMain} 11:00 block`, pathNameMain, undefined, "main"],
  ["requested-main-1200", "12:00", 180, 500, `${pathNameMain} 12:00 block`, pathNameMain, undefined, "main"],
  ["requested-plan-a-1230", "12:30", 60, 510, `${pathNamePlanA} 12:30 branch`, pathNamePlanA, pathIdStoryPlanA, "alternative"],
  ["requested-main-1600", "16:00", 60, 600, `${pathNameMain} 16:00 block`, pathNameMain, undefined, "main"],
]);

export const stressPathItemsBase: ItineraryItem[] = buildItineraryStoryPathItems(
  [
    ["stress-0800-main", "08:00", 75, 100, "Harbour breakfast", pathNameMain, undefined, "main"],
    ["stress-0805-a", "08:05", 90, 110, "Museum sprint", pathNamePlanA, pathIdStoryPlanA, "alternative"],
    ["stress-0810-b", "08:10", 70, 120, "Market photo walk", pathNamePlanB, pathIdStoryPlanB, "alternative"],
    ["stress-0815-c", "08:15", 85, 130, "Ferry slow route", pathNamePlanC, pathIdStoryPlanC, "alternative"],
    ["stress-1000-main", "10:00", 60, 200, "Peak tram queue", pathNameMain, undefined, "main"],
    ["stress-1005-a", "10:05", 65, 210, "Indoor tram backup", pathNamePlanA, pathIdStoryPlanA, "alternative"],
    ["stress-1010-b", "10:10", 80, 220, "Bus scenic route", pathNamePlanB, pathIdStoryPlanB, "alternative"],
    ["stress-1015-c", "10:15", 55, 230, "Taxi direct route", pathNamePlanC, pathIdStoryPlanC, "alternative"],
    ["stress-1230-main", "12:30", 75, 300, "Central lunch", pathNameMain, undefined, "main"],
    ["stress-1235-a", "12:35", 65, 310, "Dim sum backup", pathNamePlanA, pathIdStoryPlanA, "alternative"],
    ["stress-1240-b", "12:40", 70, 320, "Noodle shop backup", pathNamePlanB, pathIdStoryPlanB, "alternative"],
    ["stress-1245-c", "12:45", 80, 330, "Vegetarian backup", pathNamePlanC, pathIdStoryPlanC, "alternative"],
    ["stress-1500-main", "15:00", 50, 400, "Hotel recharge", pathNameMain, undefined, "main"],
    ["stress-1505-a", "15:05", 60, 410, "Cafe work block", pathNamePlanA, pathIdStoryPlanA, "alternative"],
    ["stress-1510-b", "15:10", 45, 420, "Souvenir window", pathNamePlanB, pathIdStoryPlanB, "alternative"],
    ["stress-1515-c", "15:15", 55, 430, "Quiet park break", pathNamePlanC, pathIdStoryPlanC, "alternative"],
  ],
  {
    pathGroupId: (row) => `stress-group-${Math.floor(row[3] / 100)}`,
  },
);

export const windowOnlyDurationItemBase = [
  buildItineraryStoryItem(0, {
    id: "window-only-duration",
    startTime: "09:00",
    endTime: "10:45",
    endOffsetDays: 0,
    durationMinutes: null,
    sortOrder: 100,
    activity: "Window only duration",
    place: `${pathNameMain} checkpoint`,
    pathRole: "main",
  }),
];
