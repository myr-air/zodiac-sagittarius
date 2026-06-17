import type { ItineraryPathOption } from "@/src/trip/itinerary";

export const itineraryFixtureDay = "2026-06-19" as const;

export const pathIdMain = "main" as const;
export const pathIdPlanA = "plan-a" as const;
export const pathIdPlanB = "plan-b" as const;
export const pathIdPlanC = "plan-c" as const;
export const pathIdStoryPlanA = "path-2026-06-19-sub-a" as const;
export const pathIdStoryPlanB = "path-2026-06-19-sub-b" as const;
export const pathIdStoryPlanC = "path-2026-06-19-sub-c" as const;
export const pathIdRain = "rain" as const;
export const pathIdStoryRain = "path-rain" as const;
export const pathIdPlanOne = "path-plan-1" as const;

export const mainPathOption: ItineraryPathOption = {
  id: pathIdMain,
  name: "Main",
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
  name: "Rain plan",
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
  name: "Plan A",
  scope: "trip",
};

export const pathOptionPlanB: ItineraryPathOption = {
  id: pathIdPlanB,
  name: "Plan B",
  scope: "trip",
};

export const pathOptionStoryPlanA: ItineraryPathOption = {
  id: pathIdStoryPlanA,
  name: "Plan A",
  scope: "day",
  day: itineraryFixtureDay,
};

export const pathOptionStoryPlanB: ItineraryPathOption = {
  id: pathIdStoryPlanB,
  name: "Plan B",
  scope: "day",
  day: itineraryFixtureDay,
};

export const pathOptionStoryPlanC: ItineraryPathOption = {
  id: pathIdStoryPlanC,
  name: "Plan C",
  scope: "day",
  day: itineraryFixtureDay,
};
