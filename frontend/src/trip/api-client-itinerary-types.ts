import type {
  EditableSuggestionPatch,
  ItineraryCoordinates,
  ItineraryItem,
  SuggestionType,
} from "./types";

export interface ImportItineraryApiRequest {
  fileName?: string;
  contentType?: string;
  mode?: "auto" | "json" | "ai";
  content: string;
}

export interface PatchItineraryItemApiRequest {
  clientMutationId: string;
  expectedVersion: number;
  patch: Partial<
    Pick<
      ItineraryItem,
      | "pathGroupId"
      | "pathId"
      | "pathName"
      | "pathRole"
      | "parentItemId"
      | "itemKind"
      | "timeMode"
      | "isPlanBlock"
      | "status"
      | "priority"
      | "day"
      | "sortOrder"
      | "durationMinutes"
      | "activity"
      | "activityType"
      | "activitySubtype"
      | "place"
      | "transportation"
      | "details"
      | "note"
    >
  > & {
    startTime?: string | null;
    endTime?: string | null;
    endOffsetDays?: number;
    address?: string | null;
    coordinates?: ItineraryCoordinates | null;
    mapLink?: string | null;
  };
}

export interface CreateItineraryItemApiRequest {
  clientMutationId: string;
  planVariantId: string;
  pathGroupId?: string;
  pathId?: string;
  pathName?: string;
  pathRole?: ItineraryItem["pathRole"];
  parentItemId?: string | null;
  itemKind?: ItineraryItem["itemKind"];
  timeMode?: ItineraryItem["timeMode"];
  isPlanBlock?: boolean;
  status?: ItineraryItem["status"];
  priority?: ItineraryItem["priority"];
  day: string;
  startTime?: string | null;
  endTime?: string | null;
  endOffsetDays?: number;
  activity: string;
  activityType: ItineraryItem["activityType"];
  activitySubtype?: ItineraryItem["activitySubtype"] | null;
  place: string;
  mapLink?: string | null;
  address?: string | null;
  coordinates?: ItineraryCoordinates | null;
  durationMinutes?: number | null;
  transportation?: string | null;
  details?: ItineraryItem["details"] | null;
  note?: string | null;
}

export interface ReorderItineraryItemsApiRequest {
  clientMutationId: string;
  planVariantId: string;
  day: string;
  itemIds: string[];
}

export interface CreateSuggestionApiRequest {
  clientMutationId: string;
  type: SuggestionType;
  targetItemId: string | null;
  planVariantId: string;
  sourceVersion: number | null;
  proposedPatch: EditableSuggestionPatch;
}

export interface CreateStopNoteApiRequest {
  clientMutationId: string;
  tripPlanId?: string | null;
  itineraryItemId: string;
  body: string;
}

export interface PatchStopNoteApiRequest {
  clientMutationId: string;
  expectedVersion: number;
  body: string;
}
