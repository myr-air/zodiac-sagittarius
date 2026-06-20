import {
  pathIdStoryPlanA,
  pathIdStoryPlanB,
  pathIdStoryPlanC,
} from "@/src/features/itinerary/testing";
import type { ItineraryItem } from "@/src/trip/types";
import { buildItineraryStoryPathItems } from "../itinerary-story-item-builders";
import {
  pathNameMain,
  pathNamePlanA,
  pathNamePlanB,
  pathNamePlanC,
} from "../itinerary-story-path-options";

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
