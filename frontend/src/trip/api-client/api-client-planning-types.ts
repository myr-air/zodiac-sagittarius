import type {
  PlanStatus,
  PlanSuggestion,
  PlanVariant,
  TripTask,
} from "../types";

export interface CreateTaskApiRequest {
  clientMutationId: string;
  tripPlanId?: string | null;
  title: string;
  visibility: TripTask["visibility"];
  kind?: TripTask["kind"];
  assigneeId?: string | null;
  relatedItemId?: string | null;
}

export interface CreatePlanVariantApiRequest {
  clientMutationId: string;
  name: string;
  kind?: PlanVariant["kind"];
  status?: PlanStatus;
  description?: string;
  sourceTripPlanId?: string;
  creationMode?: "blank" | "duplicate-current" | "import";
}

export interface PatchPlanVariantApiRequest {
  clientMutationId: string;
  expectedVersion: number;
  patch: Partial<Pick<PlanVariant, "name" | "kind" | "status" | "description">>;
}

export interface PublishPlanVariantApiRequest {
  clientMutationId: string;
  previousMainNextStatus?: Exclude<PlanStatus, "main">;
}

export interface PatchTaskApiRequest {
  clientMutationId: string;
  expectedVersion: number;
  patch: Partial<Pick<TripTask, "title" | "status" | "assigneeId" | "relatedItemId">>;
}

export interface PatchPlanSuggestionApiRequest {
  expectedVersion: number;
  status: PlanSuggestion["status"];
  snoozedUntil?: string | null;
}
