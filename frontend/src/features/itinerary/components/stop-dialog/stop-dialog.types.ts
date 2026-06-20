import type {
  ActivityType,
  ItineraryItem,
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

export interface StopDialogProps {
  mode: "create" | "edit";
  endDate?: string;
  initialDay?: string;
  initialItem?: ItineraryItem;
  initialParentItemId?: string | null;
  manualPathOptions?: StopManualPathOption[];
  onClose: () => void;
  onDelete?: () => void;
  onPromoteFoodRecommendation?: () => void;
  onSubmit: (values: StopFormValues) => void | Promise<void>;
  placeResolution?: {
    state: "idle" | "resolving" | "ambiguous" | "unresolved";
    candidates: PlaceResolutionCandidate[];
  };
  startDate?: string;
}
