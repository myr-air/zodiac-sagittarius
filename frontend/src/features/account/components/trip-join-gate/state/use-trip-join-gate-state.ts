import { useMemo, useState } from "react";
import {
  isTripParticipantDisabled,
} from "@/src/trip/auth";
import type { TripApiClient, TripCockpit } from "@/src/trip/api-client";
import type { Member, Trip, TripParticipantSession } from "@/src/trip/types";
import { tripFromJoinResponse } from "../trip-join-response-mapper";
import { useTripJoinGateFormState } from "./use-trip-join-gate-form-state";
import { useTripJoinInviteTokenResolution } from "./use-trip-join-invite-token-resolution";
import { useTripJoinGateSubmitActions } from "../submit/use-trip-join-gate-submit-actions";

interface TripJoinGateErrorCopy {
  participantPassword: string;
  shortPassword: string;
  tripCredentials: string;
  tripLoad: string;
}

interface UseTripJoinGateStateArgs {
  apiClient?: TripApiClient;
  errors: TripJoinGateErrorCopy;
  initialJoinCode?: string;
  initialJoinToken?: string | null;
  onAuthenticated: (session: TripParticipantSession) => void;
  onCockpitLoaded?: (cockpit: TripCockpit) => void;
  onTripChange: (trip: Trip) => void;
  trip?: Trip;
}

export function useTripJoinGateState({
  apiClient,
  errors,
  initialJoinCode,
  initialJoinToken,
  onAuthenticated,
  onCockpitLoaded,
  onTripChange,
  trip,
}: UseTripJoinGateStateArgs) {
  const [step, setStep] = useState<"room" | "participant">("room");
  const [joinedTrip, setJoinedTrip] = useState<Trip | null>(null);
  const [joinSessionToken, setJoinSessionToken] = useState<string | null>(null);
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const {
    joinId,
    participantPassword,
    resetParticipantPassword,
    setJoinId,
    setParticipantPassword,
    setShowParticipantPassword,
    setShowTripPassword,
    setTripPassword,
    showParticipantPassword,
    showTripPassword,
    tripPassword,
  } = useTripJoinGateFormState(initialJoinCode);

  /* v8 ignore next */
  const activeTrip = joinedTrip ?? trip ?? null;
  const selectedMember = useMemo(
    () => activeTrip?.members.find((member) => member.id === selectedMemberId) ?? null,
    [activeTrip, selectedMemberId],
  );
  /* v8 ignore next */
  const participantMembers = activeTrip?.members ?? [];

  useTripJoinInviteTokenResolution({
    apiClient,
    fallbackError: errors.tripCredentials,
    initialJoinToken,
    onError: (message) => {
      setError(message);
      setStep("room");
    },
    onResolved: (response) => {
      const nextTrip = tripFromJoinResponse(response);
      setJoinedTrip(nextTrip);
      setJoinSessionToken(response.joinSessionToken);
      setSelectedMemberId(null);
      setError(null);
      setStep("participant");
    },
    onSettled: () => setIsSubmitting(false),
  });

  function selectMember(member: Member) {
    /* v8 ignore next */
    if (isTripParticipantDisabled(member)) return;
    setSelectedMemberId(member.id);
    resetParticipantPassword();
    setError(null);
  }

  const { submitParticipant, submitTripRoom } = useTripJoinGateSubmitActions({
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
  });

  return {
    error,
    isSubmitting,
    joinId,
    participantMembers,
    participantPassword,
    selectMember,
    selectedMember,
    selectedMemberId,
    setJoinId,
    setParticipantPassword,
    setShowParticipantPassword,
    setShowTripPassword,
    setStep,
    setTripPassword,
    showParticipantPassword,
    showTripPassword,
    step,
    submitParticipant,
    submitTripRoom,
    tripPassword,
  };
}
