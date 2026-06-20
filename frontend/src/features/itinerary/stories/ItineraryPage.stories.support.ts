import { fn } from "storybook/test";
import type { ItineraryItem } from "@/src/trip/types";
import {
  branchGraphItemsBase,
  planAExampleItemsBase,
  planABAlternativeItemsBase,
  requestedPlanExampleItemsBase,
  stressPathItemsBase,
  windowOnlyDurationItemBase,
  withStoryPrefix,
} from "./itinerary-story-fixtures";

export const onStoryChangeDayPath = fn();
export const onStoryMoveItemToPath = fn();
export const onStoryToggleShowAllPaths = fn();
export const onStoryUpdateItemInline = fn();
export const onStoryInlineQuickEdit = fn();

export const pageBranchGraphItems: ItineraryItem[] = withStoryPrefix(
  branchGraphItemsBase,
  "page",
);
export const pagePlanAExampleItems: ItineraryItem[] = withStoryPrefix(
  planAExampleItemsBase,
  "page",
);
export const pageWindowOnlyDurationItems: ItineraryItem[] = withStoryPrefix(
  windowOnlyDurationItemBase,
  "page",
);
export const pagePlanABAlternativeItems: ItineraryItem[] = withStoryPrefix(
  planABAlternativeItemsBase,
  "page",
);
export const pageRequestedPlanExampleItems: ItineraryItem[] = withStoryPrefix(
  requestedPlanExampleItemsBase,
  "page",
);
export const pageStressPathItems: ItineraryItem[] = withStoryPrefix(
  stressPathItemsBase,
  "page",
);

export function buildPageOverflowItems(): ItineraryItem[] {
  return pageStressPathItems.map((item, index) => ({
    ...item,
    id: `page-overflow-${item.id}`,
    activity: `${item.activity} with long operational copy for page-level overflow validation ${index + 1}`,
    place: `${item.place} - gate notes, booking reference, and meet-up details`,
    transport: "Airport Express transfer with luggage coordination",
  }));
}
