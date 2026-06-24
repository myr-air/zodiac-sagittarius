export const planStatusValues = ["main", "backup", "draft", "proposal"] as const;
export type PlanStatus = (typeof planStatusValues)[number];

export const planVariantKindValues = ["main", "backup", "draft", "split"] as const;
export type PlanVariantKind = (typeof planVariantKindValues)[number];

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
