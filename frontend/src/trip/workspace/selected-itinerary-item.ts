import type { ItineraryView } from "@/src/trip/itinerary-core";
import type { ItineraryItem } from "@/src/trip/types";

interface ResolveSelectedWorkspaceItemInput {
  activePlanItems: ItineraryItem[];
  itineraryView: ItineraryView;
  planItems: ItineraryItem[];
  selectedItemId: string;
  tripStartDate: string;
}

export interface SelectedWorkspaceItem {
  selectedDay: string;
  selectedItem: ItineraryItem | undefined;
  selectedItemIdForView: string;
}

export function resolveSelectedWorkspaceItem({
  activePlanItems,
  itineraryView,
  planItems,
  selectedItemId,
  tripStartDate,
}: ResolveSelectedWorkspaceItemInput): SelectedWorkspaceItem {
  const selectedItem =
    activePlanItems.find((item) => item.id === selectedItemId) ??
    planItems[0] ??
    activePlanItems[0];

  return {
    selectedDay:
      selectedItem?.day ?? itineraryView.dayGroups[0]?.day ?? tripStartDate,
    selectedItem,
    selectedItemIdForView: selectedItem?.id ?? "",
  };
}
