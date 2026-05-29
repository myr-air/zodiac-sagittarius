"use client";

import { FormEvent, useMemo, useState } from "react";
import { Icon } from "./icons";
import { Badge, Button } from "./ui";
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
  onTripChange: (trip: Trip) => void;
  onAuthenticated: (session: TripParticipantSession) => void;
  onCockpitLoaded?: (cockpit: TripCockpit) => void;
}

export function TripJoinGate({ trip, apiClient, embedded = false, onTripChange, onAuthenticated, onCockpitLoaded }: TripJoinGateProps) {
  const [step, setStep] = useState<"room" | "participant">("room");
  const [joinId, setJoinId] = useState("");
  const [tripPassword, setTripPassword] = useState("");
  const [joinedTrip, setJoinedTrip] = useState<Trip | null>(null);
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [participantPassword, setParticipantPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  /* v8 ignore next */
  const activeTrip = apiClient ? joinedTrip : trip ?? null;

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
      if (apiClient) {
        const response = await apiClient.joinTrip({ joinId, password: tripPassword });
        const nextTrip = tripFromJoinResponse(response);
        setJoinedTrip(nextTrip);
        setSelectedMemberId(null);
        setError(null);
        setStep("participant");
        return;
      }

      if (!activeTrip || !verifyTripCredentials(activeTrip, { joinId, password: tripPassword })) {
        setError("Trip ID หรือ password ไม่ถูกต้อง");
        return;
      }
      setError(null);
      setStep("participant");
    } catch (caught) {
      setError(errorMessage(caught, "Trip ID หรือ password ไม่ถูกต้อง"));
    } finally {
      setIsSubmitting(false);
    }
  }

  function selectMember(member: Member) {
    /* v8 ignore next */
    if (isTripParticipantDisabled(member)) return;
    setSelectedMemberId(member.id);
    setParticipantPassword("");
    setError(null);
  }

  async function submitParticipant(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    /* v8 ignore next */
    if (!selectedMember || !activeTrip) return;
    setIsSubmitting(true);

    try {
      if (apiClient) {
        let session: TripParticipantSession;
        try {
          session = await apiClient.claimMember(activeTrip.id, selectedMember.id, participantPassword);
        } catch (caught) {
          if (!(caught instanceof TripApiError) || caught.code !== "invalid_request") throw caught;
          session = await apiClient.loginMember(activeTrip.id, selectedMember.id, participantPassword);
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
          setError("รหัสไม่ถูกต้อง");
          return;
        }
        onAuthenticated(createTripParticipantSession(activeTrip, selectedMember.id));
        return;
      }

      const claimedTrip = claimTripParticipant(activeTrip, selectedMember.id, participantPassword);
      const claimedMember = claimedTrip.members.find((member) => member.id === selectedMember.id);
      if (!claimedMember?.claimPasswordHash) {
        setError("ตั้งรหัสอย่างน้อย 4 ตัวอักษร");
        return;
      }

      onTripChange(claimedTrip);
      onAuthenticated(createTripParticipantSession(claimedTrip, selectedMember.id));
    } catch (caught) {
      setError(errorMessage(caught, "รหัสไม่ถูกต้อง"));
    } finally {
      setIsSubmitting(false);
    }
  }

  const PageElement = embedded ? "section" : "main";

  return (
    <PageElement className="join-page" aria-label="Join trip">
      <section className="join-shell">
        <div className="join-hero">
          <div className="join-mark" aria-hidden="true">
            <Icon name="route" />
          </div>
          <div>
            <p className="join-eyebrow">Sagittarius trip access</p>
            <h1>{step === "room" ? "เข้าห้อง trip" : "เลือกตัวตน"}</h1>
            <p>
              {step === "room"
                ? "กรอก Trip ID และ password ของแผนนี้ก่อนเลือกสมาชิก"
                : "เลือกชื่อของคุณ แล้วตั้งหรือยืนยันรหัสเฉพาะตัวสำหรับ trip นี้"}
            </p>
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
              <span>Trip ID</span>
              <input value={joinId} onChange={(event) => setJoinId(event.target.value)} autoComplete="off" />
            </label>
            <label>
              <span>Trip password</span>
              <input
                value={tripPassword}
                onChange={(event) => setTripPassword(event.target.value)}
                type="password"
                autoComplete="current-password"
              />
            </label>
            <Button type="submit" className="join-submit" disabled={isSubmitting}>
              <Icon name="check" />
              เข้าห้อง trip
            </Button>
          </form>
        ) : (
          <div className="participant-step">
            <div className="participant-grid" aria-label="รายชื่อสมาชิกใน trip">
              {participantMembers.map((member) => (
                <button
                  className="participant-card"
                  disabled={isTripParticipantDisabled(member)}
                  data-selected={member.id === selectedMemberId ? "true" : "false"}
                  key={member.id}
                  type="button"
                  onClick={() => selectMember(member)}
                >
                  <span className="person-avatar" style={{ backgroundColor: member.color }} aria-hidden="true">
                    {member.displayName.slice(0, 1)}
                  </span>
                  <span>
                    <strong>{member.displayName}</strong>
                    <small>{roleLabel(member.role)}</small>
                  </span>
                  <Badge tone={isTripParticipantDisabled(member) ? "danger" : member.claimPasswordHash ? "success" : "warning"}>
                    {isTripParticipantDisabled(member) ? "Disabled" : member.claimPasswordHash ? "Claimed" : "First entry"}
                  </Badge>
                </button>
              ))}
            </div>

            {selectedMember ? (
              <form className="participant-auth" role="group" aria-label={selectedMember.displayName} onSubmit={submitParticipant}>
                <label>
                  <span>
                    {selectedMember.claimPasswordHash
                      ? `รหัสของ ${selectedMember.displayName}`
                      : `ตั้งรหัสสำหรับ ${selectedMember.displayName}`}
                  </span>
                  <input
                    value={participantPassword}
                    onChange={(event) => setParticipantPassword(event.target.value)}
                    type="password"
                    autoComplete="current-password"
                  />
                </label>
                <Button type="submit" className="join-submit" disabled={isSubmitting}>
                  <Icon name="check" />
                  {selectedMember.claimPasswordHash ? "ยืนยันตัวตน" : "เริ่มใช้งาน"}
                </Button>
              </form>
            ) : null}
          </div>
        )}
      </section>
    </PageElement>
  );
}

function roleLabel(role: Member["role"]): string {
  if (role === "owner") return "Owner";
  if (role === "organizer") return "Organizer";
  if (role === "traveler") return "Traveller";
  return "Viewer";
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
  if (caught instanceof TripApiError) return caught.message;
  if (caught instanceof Error) return caught.message;
  return fallback;
}
