import type {
  ActivityType,
  ItineraryItemKind,
  ItineraryItemPriority,
  ItineraryItemStatus,
  ItineraryTimeMode,
  PlaceResolutionCandidate,
} from "@/src/trip/types";

export interface StopFormValues {
  day: string;
  pathId?: string;
  parentItemId?: string | null;
  itemKind: ItineraryItemKind;
  timeMode: ItineraryTimeMode;
  isPlanBlock: boolean;
  status: ItineraryItemStatus;
  priority: ItineraryItemPriority;
  startTime: string;
  endTime: string | null;
  endOffsetDays: number;
  activity: string;
  activityType: ActivityType;
  place: string;
  mapLink?: string;
  durationMinutes: number | null;
  transportation: string;
  details: Record<string, unknown>;
  note: string;
  resolvedPlace?: PlaceResolutionCandidate;
  saveUnresolved?: boolean;
}

export interface StopManualPathOption {
  id: string;
  name: string;
}
