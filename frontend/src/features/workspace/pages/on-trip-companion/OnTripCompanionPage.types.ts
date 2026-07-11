import type { ItineraryItem, NowNextState } from "@/src/trip/itinerary-core/itinerary-types";

export interface OnTripCompanionPageProps {
  itineraryItems: ItineraryItem[];
  nowNextState: NowNextState;
  /** Current selected day as YYYY-MM-DD string */
  currentDay: string;
  tripStartDate: string;
  tripEndDate: string;
  /** All days of the trip as YYYY-MM-DD strings */
  tripDays: string[];
  onDayChange: (day: string) => void;
  onCheckOff: (activityId: string) => void;
  onUndoCheckOff: (activityId: string) => void;
  onNavigate: () => void;
  /** Active bottom nav tab id */
  activeNavTab?: "now" | "map" | "checklist" | "expenses";
  onNavChange: (tab: "now" | "map" | "checklist" | "expenses") => void;
  isDesktop?: boolean; // if true, render fallback instead (handled by parent in T25)
}
