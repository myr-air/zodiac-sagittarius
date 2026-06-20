import {
  pathIdStoryPlanA,
  pathIdStoryPlanB,
} from "@/src/features/itinerary/testing";
import type { ItineraryItem } from "@/src/trip/types";
import { buildItineraryStoryPathItems } from "../itinerary-story-item-builders";
import {
  pathNameMain,
  pathNamePlanA,
  pathNamePlanB,
} from "../itinerary-story-path-options";

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
