import type { Member, Trip } from "@/src/trip/types";
import type { TripSettingsFormValues } from "./model/trip-settings-form-model";

export type { TripSettingsFormValues };

export interface TripSettingsPageProps {
  canEdit: boolean;
  currentMember: Member;
  trip: Trip;
  onSave: (values: TripSettingsFormValues) => Promise<void>;
}
