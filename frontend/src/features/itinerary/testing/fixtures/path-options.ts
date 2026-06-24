import type { ItineraryPathOption } from "@/src/trip/itinerary-paths";
import { mainItineraryPathId, mainItineraryPathName } from "@/src/trip/itinerary-paths";
import {
  pathIdPlanA as pathIdFixtureStoryA,
  pathIdPlanB as pathIdFixtureStoryB,
  pathIdPlanC as pathIdFixtureStoryC,
  pathIdRain as pathIdFixtureRain,
  pathNamePlanA,
  pathNamePlanB,
  pathNamePlanC,
  pathNameRain,
} from "@/src/trip/testing/fixtures/itinerary-path-fixtures";

export const itineraryFixtureDay = "2026-06-19" as const;

export const pathIdMain = mainItineraryPathId;
export const pathIdPlanA = "plan-a" as const;
export const pathIdPlanB = "plan-b" as const;
export const pathIdPlanC = "plan-c" as const;
export const pathIdStoryPlanA = pathIdFixtureStoryA;
export const pathIdStoryPlanB = pathIdFixtureStoryB;
export const pathIdStoryPlanC = pathIdFixtureStoryC;
export const pathIdRain = "rain" as const;
export const pathIdStoryRain = pathIdFixtureRain;
export const pathIdPlanOne = "path-plan-1" as const;
export const pathNameMain = mainItineraryPathName;

export const mainPathOption: ItineraryPathOption = {
  id: pathIdMain,
  name: pathNameMain,
  scope: "trip",
};

export const pathPlanOneOption: ItineraryPathOption = {
  id: pathIdPlanOne,
  name: "Plan 1",
  scope: "trip",
};

export const pathRainOption: ItineraryPathOption = {
  id: pathIdRain,
  name: "Rain",
  scope: "day",
  day: itineraryFixtureDay,
};

export const pathRainPlanOption: ItineraryPathOption = {
  id: pathIdRain,
  name: "Rain Plan",
  scope: "day",
  day: itineraryFixtureDay,
};

export const storyRainPathOption: ItineraryPathOption = {
  id: pathIdStoryRain,
  name: pathNameRain,
  scope: "day",
  day: itineraryFixtureDay,
};

export const storyRainDisplayPathOption: ItineraryPathOption = {
  id: pathIdStoryRain,
  name: "Rain",
  scope: "day",
  day: itineraryFixtureDay,
};

export const pathOptionPlanA: ItineraryPathOption = {
  id: pathIdPlanA,
  name: pathNamePlanA,
  scope: "trip",
};

export const pathOptionPlanB: ItineraryPathOption = {
  id: pathIdPlanB,
  name: pathNamePlanB,
  scope: "trip",
};

export const pathOptionStoryPlanA: ItineraryPathOption = {
  id: pathIdStoryPlanA,
  name: pathNamePlanA,
  scope: "day",
  day: itineraryFixtureDay,
};

export const pathOptionStoryPlanB: ItineraryPathOption = {
  id: pathIdStoryPlanB,
  name: pathNamePlanB,
  scope: "day",
  day: itineraryFixtureDay,
};

export const pathOptionStoryPlanC: ItineraryPathOption = {
  id: pathIdStoryPlanC,
  name: pathNamePlanC,
  scope: "day",
  day: itineraryFixtureDay,
};

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
