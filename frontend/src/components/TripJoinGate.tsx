"use client";

import { Fragment, FormEvent, useMemo, useState } from "react";
import { Icon } from "./icons";
import { Badge, Button } from "./ui";
import { LanguageSwitch } from "@/src/i18n/LanguageSwitch";
import { useI18n } from "@/src/i18n/I18nProvider";
import type { Messages } from "@/src/i18n/messages";
import {
  claimTripParticipant,
  createTripParticipantSession,
  isTripParticipantDisabled,
  verifyTripCredentials,
  verifyTripParticipantPassword,
} from "@/src/trip/auth";
import { TripApiError, type JoinTripResponse, type TripApiClient, type TripCockpit } from "@/src/trip/api-client";
import type { Member, Trip, TripParticipantSession } from "@/src/trip/types";

interface TripJoinGateProps {
  trip?: Trip;
  apiClient?: TripApiClient;
  embedded?: boolean;
  initialJoinCode?: string;
  onTripChange: (trip: Trip) => void;
  onAuthenticated: (session: TripParticipantSession) => void;
  onCockpitLoaded?: (cockpit: TripCockpit) => void;
}

export function TripJoinGate({ trip, apiClient, embedded = false, initialJoinCode, onTripChange, onAuthenticated, onCockpitLoaded }: TripJoinGateProps) {
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

  /* v8 ignore next */
  const activeTrip = joinedTrip ?? trip ?? null;

  const selectedMember = useMemo(
    () => activeTrip?.members.find((member) => member.id === selectedMemberId) ?? null,
    [activeTrip, selectedMemberId],
  );
  /* v8 ignore next */
  const participantMembers = activeTrip?.members ?? [];

  async function submitTripRoom(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    try {
      if (trip && verifyTripCredentials(trip, { joinId, password: tripPassword })) {
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
      if (apiClient && joinSessionToken) {
        let session: TripParticipantSession;
        try {
          session = await apiClient.claimMember(activeTrip.id, selectedMember.id, participantPassword, joinSessionToken);
        } catch (caught) {
          if (!(caught instanceof TripApiError) || caught.code !== "invalid_request") throw caught;
          session = await apiClient.loginMember(activeTrip.id, selectedMember.id, participantPassword, joinSessionToken);
        }
        const cockpit = await apiClient.loadTrip(activeTrip.id, session.sessionToken);
        setJoinedTrip(cockpit.trip);
        onTripChange(cockpit.trip);
        onAuthenticated(session);
        onCockpitLoaded?.(cockpit);
        return;
      }

      if (selectedMember.claimPasswordHash) {
        if (!verifyTripParticipantPassword(selectedMember, participantPassword)) {
          setError(t.join.errors.participantPassword);
          return;
        }
        onAuthenticated(createTripParticipantSession(activeTrip, selectedMember.id));
        return;
      }

      const claimedTrip = claimTripParticipant(activeTrip, selectedMember.id, participantPassword);
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

  const PageElement = embedded ? "section" : "main";
  const visualNotes = [
    { icon: "key" as const, title: t.join.visual.secureTitle, detail: t.join.visual.secureDetail },
    { icon: "users" as const, title: t.join.visual.membersTitle, detail: t.join.visual.membersDetail },
    { icon: "map" as const, title: t.join.visual.planTitle, detail: t.join.visual.planDetail },
  ];

  return (
    <PageElement className="join-page" aria-label={t.join.pageLabel}>
      <section className="join-shell">
        <div className="trip-access-visual" aria-label={t.join.visual.label}>
          <div className="trip-access-photo-stack" aria-hidden="true">
            <span className="trip-access-photo trip-access-photo--krabi" />
            <span className="trip-access-photo trip-access-photo--kyoto" />
            <span className="trip-access-photo trip-access-photo--santorini" />
          </div>
          <div className="trip-access-route-card" aria-hidden="true">
            <span className="trip-access-route-stop">Joii</span>
            <span className="trip-access-route-line" />
            <span className="trip-access-route-stop">Trip</span>
          </div>
          <ul className="trip-access-notes">
            {visualNotes.map((note) => (
              <li key={note.title}>
                <Icon name={note.icon} />
                <span>
                  <strong>{note.title}</strong>
                  <small>{note.detail}</small>
                </span>
              </li>
            ))}
          </ul>
        </div>
        <div className="join-hero">
          <div className="join-mark" aria-hidden="true">
            <Icon name="route" />
          </div>
          <div>
            <p className="join-eyebrow">{t.join.eyebrow}</p>
            <h1>{step === "room" ? t.join.roomTitle : t.join.participantTitle}</h1>
            <p>{step === "room" ? t.join.roomDetail : t.join.participantDetail}</p>
            {!embedded ? <LanguageSwitch className="access-language-switch" /> : null}
          </div>
        </div>

        {error ? (
          <p className="join-alert" role="alert">
            <Icon name="alertCircle" />
            {error}
          </p>
        ) : null}

        {step === "room" ? (
          <form className="join-form" onSubmit={submitTripRoom}>
            <label>
              <span>{t.join.tripId}</span>
              <input value={joinId} onChange={(event) => setJoinId(event.target.value)} autoComplete="username" required />
            </label>
            <label>
              <span>{t.join.tripPassword}</span>
              <span className="password-input-row">
                <input
                  value={tripPassword}
                  onChange={(event) => setTripPassword(event.target.value)}
                  type={showTripPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  className="password-visibility-button"
                  aria-label={showTripPassword ? t.join.hideTripPassword : t.join.showTripPassword}
                  onClick={() => setShowTripPassword((current) => !current)}
                >
                  <Icon name={showTripPassword ? "eyeOff" : "eye"} />
                </button>
              </span>
            </label>
            <Button type="submit" className="join-submit" disabled={isSubmitting}>
              <Icon name="check" />
              {t.join.submitRoom}
            </Button>
          </form>
        ) : (
          <div className="participant-step">
            <button type="button" className="join-back" onClick={() => setStep('room')}>
              <Icon name="chevronLeft" />
              {t.join.backToRoom}
            </button>
            <div className="participant-grid" aria-label={t.join.participantListLabel}>
              {participantMembers.map((member) => (
                <Fragment key={member.id}>
                  <button
                    className="participant-card"
                    disabled={isTripParticipantDisabled(member)}
                    data-selected={member.id === selectedMemberId ? "true" : "false"}
                    type="button"
                    onClick={() => selectMember(member)}
                  >
                    <span className="person-avatar" style={{ backgroundColor: member.color }} aria-hidden="true">
                      {member.displayName.slice(0, 1)}
                    </span>
                    <span>
                      <strong>{member.displayName}</strong>
                      <small>{roleLabel(member.role, t.appShell.roles)}</small>
                    </span>
                    <Badge tone={isTripParticipantDisabled(member) ? "danger" : member.claimPasswordHash ? "success" : "warning"}>
                      {participantStatusLabel(member, t.join.memberStatus)}
                    </Badge>
                  </button>
                  {selectedMember?.id === member.id ? (
                    <form className="participant-auth" role="group" aria-label={selectedMember.displayName} onSubmit={submitParticipant}>
                      <label>
                        <span>
                          {selectedMember.claimPasswordHash
                            ? t.join.participantPassword({ name: selectedMember.displayName })
                            : t.join.setParticipantPassword({ name: selectedMember.displayName })}
                        </span>
                        <input
                          value={participantPassword}
                          onChange={(event) => setParticipantPassword(event.target.value)}
                          type={showParticipantPassword ? "text" : "password"}
                          autoComplete="current-password"
                        />
                        <button
                          type="button"
                          className="password-visibility-button"
                          aria-label={showParticipantPassword ? t.join.hideParticipantPassword : t.join.showParticipantPassword}
                          onClick={() => setShowParticipantPassword((current) => !current)}
                        >
                          <Icon name={showParticipantPassword ? "eyeOff" : "eye"} />
                        </button>
                      </label>
                      {!selectedMember.claimPasswordHash ? (
                        <p className="participant-auth-help">
                          {t.join.participantHelp}
                        </p>
                      ) : null}
                      <Button type="submit" className="join-submit" disabled={isSubmitting}>
                        <Icon name="check" />
                        {selectedMember.claimPasswordHash ? t.common.actions.confirm : t.join.start}
                      </Button>
                    </form>
                  ) : null}
                </Fragment>
              ))}
            </div>
          </div>
        )}
      </section>
    </PageElement>
  );
}

function roleLabel(role: Member["role"], labels: Messages["appShell"]["roles"]): string {
  return labels[role];
}

function participantStatusLabel(member: Member, labels: Messages["join"]["memberStatus"]): string {
  if (isTripParticipantDisabled(member)) return labels.disabled;
  if (member.claimPasswordHash) return labels.claimed;
  return labels.ready;
}

function tripFromJoinResponse(response: JoinTripResponse): Trip {
  return {
    id: response.trip.id,
    joinId: response.trip.joinId,
    joinPasswordHash: "",
    name: response.trip.name,
    destinationLabel: response.trip.destinationLabel,
    startDate: response.trip.startDate,
    endDate: response.trip.endDate,
    /* v8 ignore next */
    activePlanVariantId: response.trip.activePlanVariantId ?? "",
    planVariants: [],
    members: response.claimableMembers.map((member) => ({
      id: member.id,
      displayName: member.displayName,
      role: member.role,
      presence: member.presence,
      color: member.color,
      userId: member.userId,
      claimedAt: member.claimedAt,
      lastSeenAt: member.lastSeenAt,
      accessStatus: member.accessStatus,
    })),
    itineraryItems: [],
    expenses: [],
  };
}

function errorMessage(caught: unknown, fallback: string): string {
  if (caught instanceof TripApiError) {
    if (caught.status === 404) return fallback;
    if (caught.status === 401 || caught.status === 403) return fallback;
    return friendlyErrorText(caught.message, fallback);
  }
  if (caught instanceof Error) {
    if (caught.message.includes('fetch') || caught.message.includes('Failed')) return fallback;
    return friendlyErrorText(caught.message, fallback);
  }
  return fallback;
}

function friendlyErrorText(message: string, fallback: string): string {
  const normalized = message.trim();
  if (normalized === "404") return fallback;
  if (normalized === "401" || normalized === "403") return fallback;
  if (!normalized || /^\d{3}$/.test(normalized)) return fallback;
  return normalized;
}
