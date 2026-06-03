"use client";

import { Fragment, FormEvent, useMemo, useState } from "react";
import { Icon } from "./icons";
import { Badge, Button } from "./ui";
import { LanguageSwitch } from "@/src/i18n/LanguageSwitch";
import { useI18n } from "@/src/i18n/I18nProvider";
import type { Messages } from "@/src/i18n/messages";
import { cn } from "@/src/lib/cn";
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
  variant?: "default" | "trip-access";
  initialJoinCode?: string;
  onTripChange: (trip: Trip) => void;
  onAuthenticated: (session: TripParticipantSession) => void;
  onCockpitLoaded?: (cockpit: TripCockpit) => void;
}

const joinPageClassName = "join-page grid min-h-screen place-items-center bg-[linear-gradient(135deg,rgb(15_118_110_/_0.08),transparent_36%),linear-gradient(315deg,rgb(37_99_235_/_0.08),transparent_34%),var(--color-page)] p-8 max-[767px]:p-3.5";
const joinShellClassName = "join-shell grid w-[min(100%,860px)] gap-[18px] rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white/90 p-[22px] shadow-[var(--shadow-panel)] max-[767px]:p-4";
const joinHeroClassName = "join-hero grid grid-cols-[48px_minmax(0,1fr)] items-start gap-3.5 max-[767px]:grid-cols-[40px_minmax(0,1fr)] [&_h1]:m-0 [&_h1]:text-[28px] [&_h1]:leading-9 [&_h1]:text-[var(--color-text)] max-[767px]:[&_h1]:text-[23px] max-[767px]:[&_h1]:leading-[30px] [&_p:not(.join-eyebrow)]:m-0 [&_p:not(.join-eyebrow)]:mt-1 [&_p:not(.join-eyebrow)]:text-sm [&_p:not(.join-eyebrow)]:leading-[22px] [&_p:not(.join-eyebrow)]:text-[var(--color-text-muted)]";
const joinMarkClassName = "join-mark grid size-12 place-items-center rounded-[var(--radius-md)] bg-[var(--color-primary)] text-white max-[767px]:size-10 [&_.icon]:size-6";
const joinEyebrowClassName = "join-eyebrow mb-0.5 mt-0 text-xs font-extrabold uppercase tracking-normal text-[var(--color-primary-strong)]";
const joinAlertClassName = "join-alert m-0 inline-flex items-center gap-2 rounded-[var(--radius-md)] border border-[var(--color-danger-border)] bg-[var(--color-danger-soft)] px-3 py-2.5 text-[13px] font-bold text-[var(--color-danger)]";
const joinFormClassName = "join-form grid gap-3 [&_input]:min-h-[42px] [&_input]:w-full [&_input]:rounded-[var(--radius-md)] [&_input]:border [&_input]:border-[var(--color-border-strong)] [&_input]:bg-[var(--color-surface)] [&_input]:px-3 [&_input]:text-[var(--color-text)] [&_label]:grid [&_label]:gap-1.5 [&_label]:text-[13px] [&_label]:font-bold [&_label]:text-[var(--color-text-muted)]";
const participantAuthClassName = "participant-auth col-span-full grid gap-3 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-subtle)] p-3.5 [&_input]:min-h-[42px] [&_input]:w-full [&_input]:rounded-[var(--radius-md)] [&_input]:border [&_input]:border-[var(--color-border-strong)] [&_input]:bg-[var(--color-surface)] [&_input]:px-3 [&_input]:text-[var(--color-text)] [&_label]:grid [&_label]:gap-1.5 [&_label]:text-[13px] [&_label]:font-bold [&_label]:text-[var(--color-text-muted)]";
const joinSubmitClassName = "join-submit min-h-[42px] justify-center";
const participantStepClassName = "participant-step grid gap-4";
const participantGridClassName = "participant-grid grid grid-cols-2 gap-2.5 max-[767px]:grid-cols-1";
const participantCardClassName = "participant-card grid min-h-[72px] grid-cols-[38px_minmax(0,1fr)_auto] items-center gap-2.5 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-3 text-left text-[var(--color-text)] transition-[border-color,box-shadow,background] duration-150 hover:border-[var(--color-primary-border)] hover:bg-[var(--color-primary-soft)] hover:shadow-[0_10px_22px_rgb(15_23_42_/_0.06)] data-[selected=true]:border-[var(--color-primary-border)] data-[selected=true]:bg-[var(--color-primary-soft)] data-[selected=true]:shadow-[0_10px_22px_rgb(15_23_42_/_0.06)] max-[767px]:grid-cols-[38px_minmax(0,1fr)] max-[767px]:[&_.badge]:col-start-2 max-[767px]:[&_.badge]:justify-self-start [&_small]:block [&_small]:text-xs [&_small]:leading-[18px] [&_small]:text-[var(--color-text-muted)] [&_strong]:block [&_strong]:overflow-hidden [&_strong]:text-ellipsis [&_strong]:whitespace-nowrap [&_strong]:text-sm [&_strong]:leading-5 [&_strong]:text-[var(--color-text)]";
const participantAvatarClassName = "person-avatar grid size-[30px] place-items-center rounded-full text-xs font-extrabold text-white";
const passwordInputRowClassName = "password-input-row grid grid-cols-[minmax(0,1fr)_42px] items-center gap-2";
const passwordVisibilityButtonClassName = "password-visibility-button inline-grid size-[42px] cursor-pointer place-items-center rounded-[var(--radius-md)] border border-[var(--color-border-strong)] bg-[var(--color-surface)] text-[var(--color-text-muted)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary-strong)] focus-visible:border-[var(--color-primary)] focus-visible:text-[var(--color-primary-strong)]";
const participantAuthHelpClassName = "participant-auth-help m-0 text-xs leading-[18px] text-[var(--color-text-muted)]";
const embeddedJoinPageClassName = "!block !min-h-auto !bg-transparent !p-0";
const embeddedJoinShellClassName = "!w-[min(100%,640px)] justify-self-center shadow-[var(--shadow-panel)]";
const tripAccessJoinShellClassName =
  "!w-full justify-self-stretch !grid-cols-[minmax(330px,0.86fr)_minmax(360px,1fr)] !gap-0 overflow-hidden !rounded-[24px] !border-[rgb(203_213_225_/_0.72)] !bg-[rgb(255_255_255_/_0.96)] !p-0 !shadow-[0_28px_70px_rgb(15_23_42_/_0.16)] max-[767px]:!grid-cols-1 max-[767px]:!rounded-[18px]";
const tripAccessContentClassName =
  "col-start-2 mx-[clamp(20px,4vw,44px)] max-[767px]:col-start-1 max-[767px]:mx-4";
const tripAccessHeroClassName =
  "mt-[clamp(28px,5vw,54px)] !grid-cols-[52px_minmax(0,1fr)] max-[767px]:mt-[18px] max-[767px]:!grid-cols-[42px_minmax(0,1fr)] [&_h1]:!text-4xl [&_h1]:!leading-[42px] max-[767px]:[&_h1]:!text-[27px] max-[767px]:[&_h1]:!leading-[34px] [&_p:not(.join-eyebrow)]:max-w-[520px] [&_p:not(.join-eyebrow)]:!text-[15px] [&_p:not(.join-eyebrow)]:!leading-6 max-[767px]:[&_p:not(.join-eyebrow)]:!text-[13.5px] max-[767px]:[&_p:not(.join-eyebrow)]:!leading-[21px]";
const tripAccessJoinMarkClassName =
  "!size-[52px] bg-[linear-gradient(135deg,#0f766e,#0ea5e9)] text-white shadow-[0_16px_28px_rgb(15_118_110_/_0.22)] max-[767px]:!size-[42px]";
const tripAccessFormClassName =
  "my-[clamp(28px,5vw,54px)] mt-[18px] !gap-3.5 max-[767px]:mt-4 max-[767px]:mb-[18px] [&_input]:!min-h-[50px] [&_input]:!rounded-xl [&_input]:!border-[rgb(148_163_184_/_0.7)] [&_input]:shadow-[inset_0_1px_0_rgb(255_255_255_/_0.9)] [&_label]:!gap-2";
const tripAccessParticipantStepClassName =
  "my-[clamp(28px,5vw,54px)] mt-[18px] max-[767px]:mt-4 max-[767px]:mb-[18px] [&_.participant-auth_label]:!gap-2 [&_.participant-auth_input]:!min-h-[50px] [&_.participant-auth_input]:!rounded-xl [&_.participant-auth_input]:!border-[rgb(148_163_184_/_0.7)] [&_.participant-auth_input]:shadow-[inset_0_1px_0_rgb(255_255_255_/_0.9)]";
const tripAccessSubmitClassName = "!min-h-[52px] !rounded-xl shadow-[0_16px_30px_rgb(15_118_110_/_0.18)]";
const tripAccessVisualClassName =
  "trip-access-visual relative col-start-1 row-start-1 row-span-4 min-h-[620px] overflow-hidden bg-[linear-gradient(180deg,rgb(15_23_42_/_0.02),rgb(15_118_110_/_0.08)),url('/landing/auth/bg-map-watercolor.png'),#f8fbff] bg-[position:0_0,center,0_0] bg-[size:auto,cover,auto] bg-no-repeat p-7 max-[767px]:col-start-1 max-[767px]:row-auto max-[767px]:min-h-0 max-[767px]:p-4";
const tripAccessVisualWashClassName =
  "absolute inset-0 pointer-events-none bg-[linear-gradient(90deg,rgb(255_255_255_/_0.7),transparent_44%),radial-gradient(ellipse_at_20%_18%,rgb(6_182_212_/_0.18),transparent_38%),radial-gradient(ellipse_at_86%_74%,rgb(249_115_22_/_0.16),transparent_36%)]";
const tripAccessPhotoStackClassName = "trip-access-photo-stack relative z-[1] min-h-[380px] max-[767px]:min-h-[172px]";
const tripAccessPhotoClassName =
  "trip-access-photo absolute overflow-hidden rounded-[18px] border-8 border-[rgb(255_255_255_/_0.92)] bg-cover bg-center shadow-[0_24px_46px_rgb(15_23_42_/_0.2)] max-[767px]:rounded-[14px] max-[767px]:border-[5px]";
const tripAccessPhotoKrabiClassName =
  "trip-access-photo--krabi left-0 top-6 aspect-[4/5] w-[72%] bg-[url('/landing/auth/photo-krabi.png')] max-[767px]:top-2 max-[767px]:w-1/2 max-[767px]:aspect-[4/3]";
const tripAccessPhotoKyotoClassName =
  "trip-access-photo--kyoto right-0 top-0 aspect-[3/4] w-[46%] bg-[url('/landing/auth/photo-kyoto.png')] max-[767px]:left-[37%] max-[767px]:right-auto max-[767px]:w-[34%] max-[767px]:aspect-square";
const tripAccessPhotoSantoriniClassName =
  "trip-access-photo--santorini right-[6%] bottom-0 aspect-[4/3] w-[54%] bg-[url('/landing/auth/photo-santorini.png')] max-[767px]:right-0 max-[767px]:bottom-2.5 max-[767px]:w-[38%]";
const tripAccessRouteCardClassName =
  "trip-access-route-card relative z-[1] mt-[18px] grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2.5 rounded-2xl border border-[rgb(203_213_225_/_0.76)] bg-[rgb(255_255_255_/_0.9)] px-3.5 py-[13px] shadow-[0_18px_34px_rgb(15_23_42_/_0.12)] max-[767px]:hidden";
const tripAccessRouteStopClassName = "trip-access-route-stop text-xs font-[850] text-[var(--color-text)]";
const tripAccessRouteLineClassName =
  "trip-access-route-line h-0.5 rounded-full bg-[linear-gradient(90deg,var(--color-primary),var(--color-route),var(--color-warning))]";
const tripAccessNotesClassName =
  "trip-access-notes relative z-[1] m-0 mt-[18px] grid list-none gap-2.5 p-0 max-[767px]:hidden [&_.icon]:size-[34px] [&_.icon]:rounded-[10px] [&_.icon]:bg-[var(--color-primary-soft)] [&_.icon]:p-2 [&_.icon]:text-[var(--color-primary-strong)] [&_li]:grid [&_li]:grid-cols-[34px_minmax(0,1fr)] [&_li]:items-center [&_li]:gap-2.5 [&_li]:rounded-[14px] [&_li]:border [&_li]:border-[rgb(226_232_240_/_0.82)] [&_li]:bg-[rgb(255_255_255_/_0.82)] [&_li]:p-3 [&_small]:block [&_small]:text-xs [&_small]:font-[650] [&_small]:leading-[17px] [&_small]:text-[var(--color-text-muted)] [&_strong]:block [&_strong]:text-[13px] [&_strong]:leading-[18px] [&_strong]:text-[var(--color-text)]";

export function TripJoinGate({ trip, apiClient, embedded = false, variant = "default", initialJoinCode, onTripChange, onAuthenticated, onCockpitLoaded }: TripJoinGateProps) {
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
      const normalizedParticipantPassword = participantPassword.trim();
      if (normalizedParticipantPassword.length < 4) {
        setError(t.join.errors.shortPassword);
        return;
      }

      if (apiClient && joinSessionToken) {
        const session = selectedMember.claimPasswordHash
          ? await apiClient.loginMember(activeTrip.id, selectedMember.id, normalizedParticipantPassword, joinSessionToken)
          : await apiClient.claimMember(activeTrip.id, selectedMember.id, normalizedParticipantPassword, joinSessionToken);
        const cockpit = await apiClient.loadTrip(activeTrip.id, session.sessionToken);
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

  const PageElement = embedded ? "section" : "main";
  const isTripAccessVariant = variant === "trip-access";
  const visualNotes = [
    { icon: "key" as const, title: t.join.visual.secureTitle, detail: t.join.visual.secureDetail },
    { icon: "users" as const, title: t.join.visual.membersTitle, detail: t.join.visual.membersDetail },
    { icon: "map" as const, title: t.join.visual.planTitle, detail: t.join.visual.planDetail },
  ];

  return (
    <PageElement className={cn(joinPageClassName, embedded ? embeddedJoinPageClassName : "")} aria-label={t.join.pageLabel}>
      <section className={cn(joinShellClassName, embedded ? embeddedJoinShellClassName : "", isTripAccessVariant ? tripAccessJoinShellClassName : "")}>
        <div className={tripAccessVisualClassName} aria-label={t.join.visual.label}>
          <span className={tripAccessVisualWashClassName} />
          <div className={tripAccessPhotoStackClassName} aria-hidden="true">
            <span className={cn(tripAccessPhotoClassName, tripAccessPhotoKrabiClassName)} />
            <span className={cn(tripAccessPhotoClassName, tripAccessPhotoKyotoClassName)} />
            <span className={cn(tripAccessPhotoClassName, tripAccessPhotoSantoriniClassName)} />
          </div>
          <div className={tripAccessRouteCardClassName} aria-hidden="true">
            <span className={tripAccessRouteStopClassName}>Joii</span>
            <span className={tripAccessRouteLineClassName} />
            <span className={tripAccessRouteStopClassName}>Trip</span>
          </div>
          <ul className={tripAccessNotesClassName}>
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
        <div className={cn(joinHeroClassName, isTripAccessVariant ? tripAccessContentClassName : "", isTripAccessVariant ? tripAccessHeroClassName : "")}>
          <div className={cn(joinMarkClassName, isTripAccessVariant ? tripAccessJoinMarkClassName : "")} aria-hidden="true">
            <Icon name="route" />
          </div>
          <div>
            <p className={joinEyebrowClassName}>{t.join.eyebrow}</p>
            <h1>{step === "room" ? t.join.roomTitle : t.join.participantTitle}</h1>
            <p>{step === "room" ? t.join.roomDetail : t.join.participantDetail}</p>
            {!embedded ? <LanguageSwitch className="access-language-switch mt-3.5" /> : null}
          </div>
        </div>

        {error ? (
          <p className={cn(joinAlertClassName, isTripAccessVariant ? tripAccessContentClassName : "")} role="alert">
            <Icon name="alertCircle" />
            {error}
          </p>
        ) : null}

        {step === "room" ? (
          <form className={cn(joinFormClassName, isTripAccessVariant ? tripAccessContentClassName : "", isTripAccessVariant ? tripAccessFormClassName : "")} onSubmit={submitTripRoom}>
            <label>
              <span>{t.join.tripId}</span>
              <input value={joinId} onChange={(event) => setJoinId(event.target.value)} autoComplete="username" required />
            </label>
            <label>
              <span>{t.join.tripPassword}</span>
              <span className={passwordInputRowClassName}>
                <input
                  value={tripPassword}
                  onChange={(event) => setTripPassword(event.target.value)}
                  type={showTripPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  className={passwordVisibilityButtonClassName}
                  aria-label={showTripPassword ? t.join.hideTripPassword : t.join.showTripPassword}
                  onClick={() => setShowTripPassword((current) => !current)}
                >
                  <Icon name={showTripPassword ? "eyeOff" : "eye"} />
                </button>
              </span>
            </label>
            <Button type="submit" className={cn(joinSubmitClassName, isTripAccessVariant ? tripAccessSubmitClassName : "")} disabled={isSubmitting}>
              <Icon name="check" />
              {t.join.submitRoom}
            </Button>
          </form>
        ) : (
          <div className={cn(participantStepClassName, isTripAccessVariant ? tripAccessContentClassName : "", isTripAccessVariant ? tripAccessParticipantStepClassName : "")}>
            <button type="button" className="join-back" onClick={() => setStep('room')}>
              <Icon name="chevronLeft" />
              {t.join.backToRoom}
            </button>
            <div className={participantGridClassName} aria-label={t.join.participantListLabel}>
              {participantMembers.map((member) => (
                <Fragment key={member.id}>
                  <button
                    className={participantCardClassName}
                    disabled={isTripParticipantDisabled(member)}
                    data-selected={member.id === selectedMemberId ? "true" : "false"}
                    type="button"
                    onClick={() => selectMember(member)}
                  >
                    <span className={participantAvatarClassName} style={{ backgroundColor: member.color }} aria-hidden="true">
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
                    <form className={participantAuthClassName} role="group" aria-label={selectedMember.displayName} onSubmit={submitParticipant}>
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
                          className={passwordVisibilityButtonClassName}
                          aria-label={showParticipantPassword ? t.join.hideParticipantPassword : t.join.showParticipantPassword}
                          onClick={() => setShowParticipantPassword((current) => !current)}
                        >
                          <Icon name={showParticipantPassword ? "eyeOff" : "eye"} />
                        </button>
                      </label>
                      {!selectedMember.claimPasswordHash ? (
                        <p className={participantAuthHelpClassName}>
                          {t.join.participantHelp}
                        </p>
                      ) : null}
                      <Button type="submit" className={cn(joinSubmitClassName, isTripAccessVariant ? tripAccessSubmitClassName : "")} disabled={isSubmitting}>
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
    if (caught.status === 400 || caught.code === "invalid_request") return fallback;
    if (caught.status >= 500) return fallback;
    return friendlyErrorText(caught.code, fallback);
  }
  if (caught instanceof Error) {
    if (caught.message.includes('fetch') || caught.message.includes('Failed')) return fallback;
    return fallback;
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
