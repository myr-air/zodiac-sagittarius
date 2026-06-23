import {
  pathIdStoryPlanA,
  pathIdStoryRain,
  buildItineraryStoryItem,
} from "@/src/features/itinerary/testing";
import type { ItineraryItem } from "@/src/trip/types";
import {
  pathNameMain,
  pathNamePlanA,
} from "../support/itinerary-story-path-options";

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

export const windowOnlyDurationItemBase: ItineraryItem[] = [
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
