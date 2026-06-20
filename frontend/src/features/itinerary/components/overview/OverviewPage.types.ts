import type {
  DailyBriefingOverrides,
  ExpenseSummary,
  ItineraryItem,
  Suggestion,
  Trip,
  TripDailyBriefing,
  TripTask,
} from "@/src/trip/types";
import type { ItineraryView } from "@/src/trip/itinerary";

export interface OverviewPageProps {
  trip: Trip;
  currentMemberId: string;
  expenseSummary: ExpenseSummary;
  items: ItineraryItem[];
  itineraryView?: ItineraryView;
  suggestions: Suggestion[];
  tasks: TripTask[];
  dailyBriefings?: TripDailyBriefing[];
  onCreateTask: (input: {
    title: string;
    visibility: TripTask["visibility"];
    assigneeId?: string | null;
  }) => void;
  onOpenExpenses?: () => void;
  onSaveDailyBriefingOverrides?: (
    date: string,
    version: number,
    overrides: DailyBriefingOverrides,
  ) => void;
  onToggleTaskStatus: (taskId: string) => void;
}
