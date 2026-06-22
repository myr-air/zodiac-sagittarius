import type { Member, Trip } from "@/src/trip/types";

export interface TripSettingsFormValues {
  name: string;
  destinationLabel: string;
  startDate: string;
  endDate: string;
  partySize: number;
  defaultTimezone: string;
}

export interface TripSettingsPageProps {
  canEdit: boolean;
  currentMember: Member;
  trip: Trip;
  onSave: (values: TripSettingsFormValues) => Promise<void>;
}
