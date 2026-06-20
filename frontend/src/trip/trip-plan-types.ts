export type PlanStatus = "main" | "backup" | "draft" | "proposal";
export type PlanVariantKind = "main" | "backup" | "draft" | "split";

export interface PlanVariant {
  id: string;
  tripId: string;
  name: string;
  kind: PlanVariantKind;
  status?: PlanStatus;
  description: string;
  version?: number;
}

export type TripPlan = PlanVariant;
