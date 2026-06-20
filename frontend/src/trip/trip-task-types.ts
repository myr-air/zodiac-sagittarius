export type TripTaskStatus = "open" | "done";
export type TripTaskVisibility = "private" | "shared";
export type TripTaskKind = "prep" | "booking";

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
