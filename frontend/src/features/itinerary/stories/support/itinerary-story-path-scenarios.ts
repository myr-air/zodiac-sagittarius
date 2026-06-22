import type { ItineraryItem } from "@/src/trip/types";
import { withStoryPrefix } from "./itinerary-story-item-builders";
import {
  branchGraphItemsBase,
  planABAlternativeItemsBase,
  planAExampleItemsBase,
  requestedPlanExampleItemsBase,
  stressPathItemsBase,
  windowOnlyDurationItemBase,
} from "../fixtures/itinerary-story-path-items";

export {
  branchGraphPathOptions,
  pathNameMain,
  pathNamePlanA,
  pathNamePlanB,
  pathNamePlanC,
  planABPathOptions,
  planAPathOptions,
  stressPathOptions,
} from "./itinerary-story-path-options";

export {
  branchGraphItemsBase,
  planABAlternativeItemsBase,
  planAExampleItemsBase,
  requestedPlanExampleItemsBase,
  stressPathItemsBase,
  windowOnlyDurationItemBase,
} from "../fixtures/itinerary-story-path-items";

export interface PrefixedItineraryStoryPathScenarioItems {
  branchGraphItems: ItineraryItem[];
  planABAlternativeItems: ItineraryItem[];
  planAExampleItems: ItineraryItem[];
  requestedPlanExampleItems: ItineraryItem[];
  stressPathItems: ItineraryItem[];
  windowOnlyDurationItems: ItineraryItem[];
}

export function buildPrefixedPathScenarioItems(
  prefix: string,
): PrefixedItineraryStoryPathScenarioItems {
  return {
    branchGraphItems: withStoryPrefix(branchGraphItemsBase, prefix),
    planABAlternativeItems: withStoryPrefix(planABAlternativeItemsBase, prefix),
    planAExampleItems: withStoryPrefix(planAExampleItemsBase, prefix),
    requestedPlanExampleItems: withStoryPrefix(requestedPlanExampleItemsBase, prefix),
    stressPathItems: withStoryPrefix(stressPathItemsBase, prefix),
    windowOnlyDurationItems: withStoryPrefix(windowOnlyDurationItemBase, prefix),
  };
}
