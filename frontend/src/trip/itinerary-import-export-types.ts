import type {
  BookingDoc,
  Expense,
  ItineraryAdvisory,
  ItineraryCoordinates,
  ItineraryItem,
  StopNote,
  Trip,
  TripTask,
} from "./types";
import type {
  itineraryExportSchema,
  itineraryExportVersion,
} from "./itinerary-import-export-schema";

export interface ItineraryExportItem {
  id: string;
  pathGroupId?: string;
  pathId?: string;
  pathName?: string;
  pathRole?: ItineraryItem["pathRole"];
  itemKind?: ItineraryItem["itemKind"];
  timeMode?: ItineraryItem["timeMode"];
  parentItemId?: string | null;
  isPlanBlock?: boolean;
  status?: ItineraryItem["status"];
  priority?: ItineraryItem["priority"];
  day: string;
  sortOrder: number;
  startTime: string;
  endTime?: string | null;
  endOffsetDays?: number;
  activity: string;
  activityType: ItineraryItem["activityType"];
  activitySubtype?: ItineraryItem["activitySubtype"];
  place: string;
  linkLabel: string;
  mapLink: string;
  coordinates?: ItineraryCoordinates;
  address?: string;
  durationMinutes: number | null;
  transportation: string;
  details: ItineraryItem["details"];
  advisories?: ItineraryAdvisory[];
  note: string;
}

export interface ItineraryExportDocument {
  schema: typeof itineraryExportSchema;
  version: typeof itineraryExportVersion;
  source?: "json" | "ai" | "csv" | "pasted-table";
  exportedAt: string;
  trip: Pick<
    Trip,
    | "id"
    | "name"
    | "destinationLabel"
    | "startDate"
    | "endDate"
    | "activePlanVariantId"
    | "mainTripPlanId"
    | "planVariants"
    | "tripPlans"
    | "partySize"
    | "defaultTimezone"
  >;
  items: ItineraryExportItem[];
  records?: ItineraryExportRecords;
}

export interface ItineraryExportRecords {
  expenses: Expense[];
  bookingDocs: BookingDoc[];
  stopNotes: StopNote[];
  tasks: TripTask[];
}
