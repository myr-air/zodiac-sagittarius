export const tripTaskStatusValues = ["open", "done"] as const;
export type TripTaskStatus = (typeof tripTaskStatusValues)[number];

export const tripTaskVisibilityValues = ["private", "shared"] as const;
export type TripTaskVisibility = (typeof tripTaskVisibilityValues)[number];

export const tripTaskKindValues = ["prep", "booking"] as const;
export type TripTaskKind = (typeof tripTaskKindValues)[number];

export interface TripTask {
  id: string;
  tripPlanId?: string | null;
  title: string;
  status: TripTaskStatus;
  visibility: TripTaskVisibility;
  kind?: TripTaskKind;
  createdBy: string;
  assigneeId?: string | null;
  relatedItemId?: string | null;
  version?: number;
}
