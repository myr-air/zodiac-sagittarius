import type { ItineraryItem } from "@/src/trip/types";

export interface ItineraryDialogStateCreate {
  mode: "create";
  day?: string;
  parentItemId?: string | null;
  createSequence?: number;
}

export interface ItineraryDialogStateEdit {
  mode: "edit";
  item: ItineraryItem;
}

export type ItineraryDialogState =
  | ItineraryDialogStateCreate
  | ItineraryDialogStateEdit
  | null;
