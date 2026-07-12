import type { Dispatch, SetStateAction } from "react";
import type { TripApiClient, TripCockpit } from "@/src/trip/api-client";
import type { Member, Trip, TripParticipantSession } from "@/src/trip/types";

export interface TripJoinGateErrorCopy {
  participantPassword: string;
  shortPassword: string;
  tripCredentials: string;
  tripLoad: string;
  inviteNotFound: string;
}

export interface UseTripJoinGateSubmitActionsArgs {
  activeTrip: Trip | null;
  apiClient?: TripApiClient;
  errors: TripJoinGateErrorCopy;
  joinId: string;
  joinSessionToken: string | null;
  onAuthenticated: (session: TripParticipantSession) => void;
  onCockpitLoaded?: (cockpit: TripCockpit) => void;
  onTripChange: (trip: Trip) => void;
  participantPassword: string;
  selectedMember: Member | null;
  setError: Dispatch<SetStateAction<string | null>>;
  setIsSubmitting: Dispatch<SetStateAction<boolean>>;
  setJoinedTrip: Dispatch<SetStateAction<Trip | null>>;
  setJoinSessionToken: Dispatch<SetStateAction<string | null>>;
  setSelectedMemberId: Dispatch<SetStateAction<string | null>>;
  setStep: Dispatch<SetStateAction<"room" | "participant">>;
  trip?: Trip;
  tripPassword: string;
}
