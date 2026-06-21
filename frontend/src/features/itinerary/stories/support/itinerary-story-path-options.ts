import type { ItineraryPathOption } from "@/src/trip/itinerary";
import {
  mainPathOption,
  pathNameMain,
  pathOptionStoryPlanA,
  pathOptionStoryPlanB,
  pathOptionStoryPlanC,
  storyRainPathOption,
} from "@/src/features/itinerary/testing";
import {
  pathNamePlanA,
  pathNamePlanB,
  pathNamePlanC,
} from "@/src/trip/testing/itinerary-path-fixtures";

export { pathNameMain, pathNamePlanA, pathNamePlanB, pathNamePlanC };

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
