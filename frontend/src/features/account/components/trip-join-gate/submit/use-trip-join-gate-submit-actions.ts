import type { Dispatch, FormEvent, SetStateAction } from "react";
import {
  claimTripParticipant,
  createTripParticipantSession,
  verifyTripCredentials,
  verifyTripParticipantPassword,
} from "@/src/trip/auth";
import type { TripApiClient, TripCockpit } from "@/src/trip/api-client";
import type { Member, Trip, TripParticipantSession } from "@/src/trip/types";
import { errorMessage, tripFromJoinResponse } from "../trip-join-gate.support";

interface TripJoinGateErrorCopy {
  participantPassword: string;
  shortPassword: string;
  tripCredentials: string;
  tripLoad: string;
}

interface UseTripJoinGateSubmitActionsArgs {
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

export function useTripJoinGateSubmitActions({
  activeTrip,
  apiClient,
  errors,
  joinId,
  joinSessionToken,
  onAuthenticated,
  onCockpitLoaded,
  onTripChange,
  participantPassword,
  selectedMember,
  setError,
  setIsSubmitting,
  setJoinedTrip,
  setJoinSessionToken,
  setSelectedMemberId,
  setStep,
  trip,
  tripPassword,
}: UseTripJoinGateSubmitActionsArgs) {
  async function submitTripRoom(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    try {
      if (
        !apiClient &&
        trip &&
        verifyTripCredentials(trip, { joinId, password: tripPassword })
      ) {
        setJoinedTrip(trip);
        setJoinSessionToken(null);
        setSelectedMemberId(null);
        setError(null);
        setStep("participant");
        return;
      }

      if (apiClient) {
        setJoinSessionToken(null);
        const response = await apiClient.joinTrip({ joinId, password: tripPassword });
        const nextTrip = tripFromJoinResponse(response);
        setJoinedTrip(nextTrip);
        setJoinSessionToken(response.joinSessionToken);
        setSelectedMemberId(null);
        setError(null);
        setStep("participant");
        return;
      }

      if (
        !activeTrip ||
        !verifyTripCredentials(activeTrip, { joinId, password: tripPassword })
      ) {
        setError(errors.tripCredentials);
        return;
      }
      setError(null);
      setStep("participant");
    } catch (caught) {
      setError(errorMessage(caught, errors.tripCredentials));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function submitParticipant(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    /* v8 ignore next */
    if (!selectedMember || !activeTrip) return;
    setIsSubmitting(true);

    try {
      const normalizedParticipantPassword = participantPassword.trim();
      if (normalizedParticipantPassword.length < 4) {
        setError(errors.shortPassword);
        return;
      }

      if (apiClient && joinSessionToken) {
        const isClaimed = Boolean(
          selectedMember.claimPasswordHash || selectedMember.claimedAt,
        );
        const session = isClaimed
          ? await apiClient.loginMember(
              activeTrip.id,
              selectedMember.id,
              normalizedParticipantPassword,
              joinSessionToken,
            )
          : await apiClient.claimMember(
              activeTrip.id,
              selectedMember.id,
              normalizedParticipantPassword,
              joinSessionToken,
            );
        const cockpit = await apiClient.loadTrip(activeTrip.id, session.sessionToken).catch(() => null);
        if (!cockpit) {
          setError(errors.tripLoad);
          return;
        }
        setJoinedTrip(cockpit.trip);
        onTripChange(cockpit.trip);
        onAuthenticated(session);
        onCockpitLoaded?.(cockpit);
        return;
      }

      if (selectedMember.claimPasswordHash) {
        if (!verifyTripParticipantPassword(selectedMember, normalizedParticipantPassword)) {
          setError(errors.participantPassword);
          return;
        }
        onAuthenticated(createTripParticipantSession(activeTrip, selectedMember.id));
        return;
      }

      const claimedTrip = claimTripParticipant(
        activeTrip,
        selectedMember.id,
        normalizedParticipantPassword,
      );
      const claimedMember = claimedTrip.members.find(
        (member) => member.id === selectedMember.id,
      );
      if (!claimedMember?.claimPasswordHash) {
        setError(errors.shortPassword);
        return;
      }

      onTripChange(claimedTrip);
      onAuthenticated(createTripParticipantSession(claimedTrip, selectedMember.id));
    } catch (caught) {
      setError(errorMessage(caught, errors.participantPassword));
    } finally {
      setIsSubmitting(false);
    }
  }

  return {
    submitParticipant,
    submitTripRoom,
  };
}
