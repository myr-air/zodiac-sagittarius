export type TripRole = "owner" | "organizer" | "traveler" | "viewer";
export type TripMemberAccessStatus = "active" | "disabled";

export type TripCapability =
  | "viewPlan"
  | "editItinerary"
  | "reviewSuggestions"
  | "createSuggestion"
  | "viewExpenses"
  | "editExpenses"
  | "managePeople";

export type PlanVariantKind = "main" | "backup" | "draft" | "split";

export type ActivityType = "travel" | "food" | "shopping" | "attraction" | "experience" | "stay";

export type AdvisorySeverity = "info" | "warning" | "critical";

export interface ItineraryAdvisory {
  code: string;
  label: string;
  severity: AdvisorySeverity;
}

export interface Member {
  id: string;
  displayName: string;
  role: TripRole;
  presence: "online" | "away" | "offline";
  color: string;
  userId?: string | null;
  claimPasswordHash?: string | null;
  claimedAt?: string | null;
  lastSeenAt?: string | null;
  accessStatus?: TripMemberAccessStatus;
}

export interface PlanVariant {
  id: string;
  tripId: string;
  name: string;
  kind: PlanVariantKind;
  description: string;
}

export interface ItineraryCoordinates {
  lat: number;
  lng: number;
}

export interface ItineraryItem {
  id: string;
  tripId: string;
  planVariantId: string;
  day: string;
  sortOrder: number;
  startTime: string;
  activity: string;
  activityType: ActivityType;
  place: string;
  linkLabel: string;
  mapLink: string;
  coordinates?: ItineraryCoordinates;
  address?: string;
  durationMinutes: number | null;
  transportation: string;
  advisories?: ItineraryAdvisory[];
  note: string;
  createdBy: string;
  updatedAt: string;
  version: number;
}

export interface Expense {
  id: string;
  title: string;
  amount: number;
  paidBy: string;
  splits: Record<string, number>;
  category: "food" | "transport" | "tickets" | "stay" | "shopping" | "settlement";
}

export type TripTaskStatus = "open" | "done";
export type TripTaskVisibility = "private" | "shared";
export type TripTaskKind = "prep" | "booking";

export interface TripTask {
  id: string;
  title: string;
  status: TripTaskStatus;
  visibility: TripTaskVisibility;
  kind?: TripTaskKind;
  createdBy: string;
  assigneeId?: string | null;
  relatedItemId?: string | null;
  version?: number;
}

export interface StopNote {
  id: string;
  tripId: string;
  itemId: string;
  authorId: string;
  body: string;
  createdAt: string;
  updatedAt?: string;
  version?: number;
}

export interface Trip {
  id: string;
  joinId: string;
  joinPasswordHash: string;
  name: string;
  destinationLabel: string;
  countries?: string[];
  startDate: string;
  endDate: string;
  activePlanVariantId: string;
  planVariants: PlanVariant[];
  members: Member[];
  itineraryItems: ItineraryItem[];
  expenses: Expense[];
}

export interface TripJoinCredential {
  joinId: string;
  password: string;
}

export interface TripParticipantSession {
  tripId: string;
  memberId: string;
  sessionToken: string;
  createdAt: string;
  expiresAt: string;
}

export type ValidationWarningCode =
  | "missing-start-time"
  | "invalid-start-time"
  | "missing-duration"
  | "missing-map-link"
  | "missing-transportation"
  | "time-order-conflict"
  | "overlap";

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

export type SuggestionType = "add" | "edit" | "delete" | "reorder";
export type SuggestionStatus = "pending" | "approved" | "rejected" | "conflicted";

export type EditableSuggestionPatch = Partial<
  Pick<
    ItineraryItem,
    "day" | "startTime" | "activity" | "activityType" | "place" | "mapLink" | "durationMinutes" | "transportation" | "note"
  >
>;

export interface Suggestion {
  id: string;
  tripId: string;
  proposerId: string;
  type: SuggestionType;
  targetItemId: string | null;
  planVariantId: string;
  proposedPatch: EditableSuggestionPatch;
  sourceVersion: number | null;
  status: SuggestionStatus;
  createdAt: string;
}

export interface ExpenseSummary {
  groupSpend: number;
  netByMember: Record<string, number>;
  currentUserNetLabel: string;
  settlementSuggestions: Array<{ from: string; to: string; amount: number }>;
}
