"use client";

import { useI18n } from "@/src/i18n/I18nProvider";
import {
  type TripApiClient,
  type TripCockpit,
} from "@/src/trip/api-client";
import type { Trip, TripParticipantSession } from "@/src/trip/types";
import { TripJoinGateChrome } from "./TripJoinGateChrome";
import { TripJoinParticipantStep } from "./TripJoinParticipantStep";
import { TripJoinRoomForm } from "./TripJoinRoomForm";
import { useTripJoinGateState } from "./state/use-trip-join-gate-state";

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
  const {
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
  } = useTripJoinGateState({
    apiClient,
    errors: t.join.errors,
    initialJoinCode,
    initialJoinToken,
    onAuthenticated,
    onCockpitLoaded,
    onTripChange,
    trip,
  });

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
