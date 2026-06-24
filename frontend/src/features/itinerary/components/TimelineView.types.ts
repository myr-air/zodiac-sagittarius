import type { ItineraryItem } from "@/src/trip/types";
import type { ItineraryView } from "@/src/trip/itinerary-core";

export interface TimelineViewProps {
  contextRailOpen: boolean;
  endDate: string;
  items: ItineraryItem[];
  itineraryView?: ItineraryView;
  selectedItemId: string;
  startDate: string;
  tripName: string;
  onSelectItem: (itemId: string) => void;
  onToggleContextRail: () => void;
}
