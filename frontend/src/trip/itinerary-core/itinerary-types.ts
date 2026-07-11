import type { ActivityPoll } from "../polls/poll-types";
import type { ActivityRsvp } from "../rsvp/rsvp-types";

export const activityTypeValues = [
  "travel",
  "food",
  "shopping",
  "attraction",
  "experience",
  "stay",
  "default",
] as const;
export type ActivityType = (typeof activityTypeValues)[number];

export const activitySubtypeValues = [
  "flight",
  "train",
  "bus",
  "taxi",
  "ferry",
  "walk",
  "car",
  "shuttle",
] as const;
export type ActivitySubtype = (typeof activitySubtypeValues)[number];

export const itineraryItemKindValues = [
  "travel",
  "activity",
  "lodging",
  "meal",
  "note",
  "preparation",
  "foodRecommendation",
] as const;
export type ItineraryItemKind = (typeof itineraryItemKindValues)[number];

export const itineraryTimeModeValues = ["scheduled", "flexible"] as const;
export type ItineraryTimeMode = (typeof itineraryTimeModeValues)[number];

export const itineraryItemStatusValues = [
  "idea",
  "planned",
  "booked",
  "confirmed",
  "done",
  "skipped",
] as const;
export type ItineraryItemStatus = (typeof itineraryItemStatusValues)[number];

export const itineraryItemPriorityValues = [
  "low",
  "normal",
  "high",
  "must",
] as const;
export type ItineraryItemPriority = (typeof itineraryItemPriorityValues)[number];
export type ItineraryItemDetails = Record<string, unknown>;

export const advisorySeverityValues = ["info", "warning", "critical"] as const;
export type AdvisorySeverity = (typeof advisorySeverityValues)[number];

export interface ItineraryAdvisory {
  code: string;
  label: string;
  severity: AdvisorySeverity;
}

export const itineraryPathScopeValues = ["day", "trip"] as const;
export type ItineraryPathScope = (typeof itineraryPathScopeValues)[number];
export const itineraryPathRoleValues = ["main", "alternative"] as const;
export type ItineraryPathRole = (typeof itineraryPathRoleValues)[number];

export interface ItineraryPath {
  id: string;
  tripId: string;
  name: string;
  scope: ItineraryPathScope;
  day?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface ItineraryCoordinates {
  lat: number;
  lng: number;
}

export interface ItineraryItem {
  id: string;
  tripId: string;
  planVariantId: string;
  pathGroupId?: string;
  pathId?: string;
  pathName?: string;
  pathRole?: ItineraryPathRole;
  parentItemId?: string | null;
  itemKind?: ItineraryItemKind;
  timeMode?: ItineraryTimeMode;
  isPlanBlock?: boolean;
  status?: ItineraryItemStatus;
  priority?: ItineraryItemPriority;
  day: string;
  sortOrder: number;
  startTime: string;
  endTime?: string | null;
  endOffsetDays?: number;
  activity: string;
  activityType: ActivityType;
  activitySubtype?: ActivitySubtype | null;
  place: string;
  linkLabel: string;
  mapLink: string;
  coordinates?: ItineraryCoordinates;
  address?: string;
  durationMinutes: number | null;
  transportation: string;
  details: ItineraryItemDetails;
  advisories?: ItineraryAdvisory[];
  note: string;
  createdBy: string;
  updatedAt: string;
  version: number;
  poll?: ActivityPoll;
  rsvp?: ActivityRsvp[];
}

export interface StopNote {
  id: string;
  tripId: string;
  tripPlanId?: string | null;
  itemId: string;
  authorId: string;
  body: string;
  createdAt: string;
  updatedAt?: string;
  version?: number;
}

export type ValidationWarningCode =
  | "missing-start-time"
  | "invalid-start-time"
  | "missing-duration"
  | "missing-map-link"
  | "missing-transportation"
  | "time-order-conflict"
  | "overlap"
  | "missing-parent-item"
  | "invalid-parent-plan-block"
  | "nested-sub-activity"
  | "parent-scope-mismatch"
  | "child-outside-plan-block"
  | "unresolved-location"
  | "stale-location";

export interface ValidationWarning {
  code: ValidationWarningCode;
  message: string;
  itemId: string;
}

export interface NowNextState {
  current: ItineraryItem | null;
  next: ItineraryItem | null;
  fallbackReason: string | null;
}
