"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { useI18n } from "@/src/i18n/I18nProvider";
import {
  claimTripParticipant,
  createTripParticipantSession,
  isTripParticipantDisabled,
  verifyTripCredentials,
  verifyTripParticipantPassword,
} from "@/src/trip/auth";
import {
  type TripApiClient,
  type TripCockpit,
} from "@/src/trip/api-client";
import type { Member, Trip, TripParticipantSession } from "@/src/trip/types";
import {
  errorMessage,
  tripFromJoinResponse,
} from "./trip-join-gate.support";
import { TripJoinGateChrome } from "./TripJoinGateChrome";
import { TripJoinParticipantStep } from "./TripJoinParticipantStep";
import { TripJoinRoomForm } from "./TripJoinRoomForm";

export { tripFromJoinResponse } from "./trip-join-gate.support";

interface TripJoinGateProps {
  trip?: Trip;
  apiClient?: TripApiClient;
  embedded?: boolean;
  variant?: "default" | "trip-access";
  initialJoinCode?: string;
  initialJoinToken?: string | null;
  onTripChange: (trip: Trip) => void;
  onAuthenticated: (session: TripParticipantSession) => void;
  onCockpitLoaded?: (cockpit: TripCockpit) => void;
}

export function TripJoinGate({ trip, apiClient, embedded = false, variant = "default", initialJoinCode, initialJoinToken, onTripChange, onAuthenticated, onCockpitLoaded }: TripJoinGateProps) {
  const { t } = useI18n();
  const [step, setStep] = useState<"room" | "participant">("room");
  const [joinId, setJoinId] = useState(initialJoinCode ?? "");
  const [tripPassword, setTripPassword] = useState("");
  const [joinedTrip, setJoinedTrip] = useState<Trip | null>(null);
  const [joinSessionToken, setJoinSessionToken] = useState<string | null>(null);
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [participantPassword, setParticipantPassword] = useState("");
  const [showTripPassword, setShowTripPassword] = useState(false);
  const [showParticipantPassword, setShowParticipantPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const resolvedInitialJoinTokenRef = useRef(false);

  /* v8 ignore next */
  const activeTrip = joinedTrip ?? trip ?? null;

  const selectedMember = useMemo(
    () => activeTrip?.members.find((member) => member.id === selectedMemberId) ?? null,
    [activeTrip, selectedMemberId],
  );
  /* v8 ignore next */
  const participantMembers = activeTrip?.members ?? [];

  useEffect(() => {
    if (resolvedInitialJoinTokenRef.current || !initialJoinToken || !apiClient?.resolveJoinInviteToken) return;
    let cancelled = false;
    resolvedInitialJoinTokenRef.current = true;
    apiClient.resolveJoinInviteToken(initialJoinToken)
      .then((response) => {
        if (cancelled) return;
        const nextTrip = tripFromJoinResponse(response);
        setJoinedTrip(nextTrip);
        setJoinSessionToken(response.joinSessionToken);
        setSelectedMemberId(null);
        setError(null);
        setStep("participant");
      })
      .catch((caught) => {
        if (cancelled) return;
        setError(errorMessage(caught, t.join.errors.tripCredentials));
        setStep("room");
      })
      .finally(() => {
        if (!cancelled) setIsSubmitting(false);
      });
    return () => {
      cancelled = true;
    };
  }, [apiClient, initialJoinToken, t.join.errors.tripCredentials]);

  async function submitTripRoom(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    try {
      if (!apiClient && trip && verifyTripCredentials(trip, { joinId, password: tripPassword })) {
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

      if (!activeTrip || !verifyTripCredentials(activeTrip, { joinId, password: tripPassword })) {
        setError(t.join.errors.tripCredentials);
        return;
      }
      setError(null);
      setStep("participant");
    } catch (caught) {
      setError(errorMessage(caught, t.join.errors.tripCredentials));
    } finally {
      setIsSubmitting(false);
    }
  }

  function selectMember(member: Member) {
    /* v8 ignore next */
    if (isTripParticipantDisabled(member)) return;
    setSelectedMemberId(member.id);
    setParticipantPassword("");
    setShowParticipantPassword(false);
    setError(null);
  }

  async function submitParticipant(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    /* v8 ignore next */
    if (!selectedMember || !activeTrip) return;
    setIsSubmitting(true);

    try {
      const normalizedParticipantPassword = participantPassword.trim();
      if (normalizedParticipantPassword.length < 4) {
        setError(t.join.errors.shortPassword);
        return;
      }

      if (apiClient && joinSessionToken) {
        const isClaimed = Boolean(selectedMember.claimPasswordHash || selectedMember.claimedAt);
        const session = isClaimed
          ? await apiClient.loginMember(activeTrip.id, selectedMember.id, normalizedParticipantPassword, joinSessionToken)
          : await apiClient.claimMember(activeTrip.id, selectedMember.id, normalizedParticipantPassword, joinSessionToken);
        const cockpit = await apiClient.loadTrip(activeTrip.id, session.sessionToken).catch(() => null);
        if (!cockpit) {
          setError(t.join.errors.tripLoad);
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
          setError(t.join.errors.participantPassword);
          return;
        }
        onAuthenticated(createTripParticipantSession(activeTrip, selectedMember.id));
        return;
      }

      const claimedTrip = claimTripParticipant(activeTrip, selectedMember.id, normalizedParticipantPassword);
      const claimedMember = claimedTrip.members.find((member) => member.id === selectedMember.id);
      if (!claimedMember?.claimPasswordHash) {
        setError(t.join.errors.shortPassword);
        return;
      }

      onTripChange(claimedTrip);
      onAuthenticated(createTripParticipantSession(claimedTrip, selectedMember.id));
    } catch (caught) {
      setError(errorMessage(caught, t.join.errors.participantPassword));
    } finally {
      setIsSubmitting(false);
    }
  }

  const isTripAccessVariant = variant === "trip-access";
  const visualNotes = [
    { icon: "key" as const, title: t.join.visual.secureTitle, detail: t.join.visual.secureDetail },
    { icon: "users" as const, title: t.join.visual.membersTitle, detail: t.join.visual.membersDetail },
    { icon: "map" as const, title: t.join.visual.planTitle, detail: t.join.visual.planDetail },
  ];

  return (
    <TripJoinGateChrome
      embedded={embedded}
      error={error}
      eyebrow={t.join.eyebrow}
      isTripAccessVariant={isTripAccessVariant}
      pageLabel={t.join.pageLabel}
      showLanguageSwitch={!embedded}
      step={step}
      text={{
        participantDetail: t.join.participantDetail,
        participantTitle: t.join.participantTitle,
        roomDetail: t.join.roomDetail,
        roomTitle: t.join.roomTitle,
      }}
      visual={{
        label: t.join.visual.label,
        notes: visualNotes,
      }}
    >
      {step === "room" ? (
        <TripJoinRoomForm
          copy={{
            hideTripPassword: t.join.hideTripPassword,
            showTripPassword: t.join.showTripPassword,
            submitRoom: t.join.submitRoom,
            tripId: t.join.tripId,
            tripPassword: t.join.tripPassword,
          }}
          isSubmitting={isSubmitting}
          isTripAccessVariant={isTripAccessVariant}
          joinId={joinId}
          onJoinIdChange={setJoinId}
          onPasswordChange={setTripPassword}
          onSubmit={submitTripRoom}
          onToggleTripPassword={() => setShowTripPassword((current) => !current)}
          showTripPassword={showTripPassword}
          tripPassword={tripPassword}
        />
      ) : (
        <TripJoinParticipantStep
          copy={{
            backToRoom: t.join.backToRoom,
            confirm: t.common.actions.confirm,
            hideParticipantPassword: t.join.hideParticipantPassword,
            memberStatus: t.join.memberStatus,
            participantHelp: t.join.participantHelp,
            participantListLabel: t.join.participantListLabel,
            participantPassword: t.join.participantPassword,
            roles: t.appShell.roles,
            setParticipantPassword: t.join.setParticipantPassword,
            showParticipantPassword: t.join.showParticipantPassword,
            start: t.join.start,
          }}
          isSubmitting={isSubmitting}
          isTripAccessVariant={isTripAccessVariant}
          participantMembers={participantMembers}
          participantPassword={participantPassword}
          selectedMember={selectedMember}
          selectedMemberId={selectedMemberId}
          showParticipantPassword={showParticipantPassword}
          onBackToRoom={() => setStep("room")}
          onParticipantPasswordChange={setParticipantPassword}
          onSelectMember={selectMember}
          onSubmitParticipant={submitParticipant}
          onToggleParticipantPassword={() => setShowParticipantPassword((current) => !current)}
        />
      )}
    </TripJoinGateChrome>
  );
}
