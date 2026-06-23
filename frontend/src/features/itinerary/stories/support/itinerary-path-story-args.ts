import type { ItineraryPathOption } from "@/src/trip/itinerary-paths";
import type { ItineraryItem } from "@/src/trip/types";
import type { SmartItineraryStoryArgs } from "./itinerary-story-fixtures";

type VisiblePathStoryArgOverrides = Partial<
  Pick<SmartItineraryStoryArgs, "graphItems" | "showAllPaths">
>;

export function buildVisiblePathStoryArgs(
  items: ItineraryItem[],
  selectedItemId: string,
  pathOptions: ReadonlyArray<ItineraryPathOption>,
  { graphItems, showAllPaths = true }: VisiblePathStoryArgOverrides = {},
): Pick<
  SmartItineraryStoryArgs,
  "graphItems" | "items" | "pathOptions" | "selectedItemId" | "showAllPaths"
> {
  return {
    graphItems: graphItems ?? items,
    items,
    pathOptions: [...pathOptions],
    selectedItemId,
    showAllPaths,
  };
}
