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
import type { Member, Trip, TripParticipantSession } from "@/src/trip/types";

interface TripJoinGateProps {
  trip: Trip;
  onTripChange: (trip: Trip) => void;
  onAuthenticated: (session: TripParticipantSession) => void;
}

export function TripJoinGate({ trip, onTripChange, onAuthenticated }: TripJoinGateProps) {
  const [step, setStep] = useState<"room" | "participant">("room");
  const [joinId, setJoinId] = useState("");
  const [tripPassword, setTripPassword] = useState("");
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [participantPassword, setParticipantPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const selectedMember = useMemo(
    () => trip.members.find((member) => member.id === selectedMemberId) ?? null,
    [selectedMemberId, trip.members],
  );

  function submitTripRoom(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!verifyTripCredentials(trip, { joinId, password: tripPassword })) {
      setError("Trip ID หรือ password ไม่ถูกต้อง");
      return;
    }
    setError(null);
    setStep("participant");
  }

  function selectMember(member: Member) {
    if (isTripParticipantDisabled(member)) return;
    setSelectedMemberId(member.id);
    setParticipantPassword("");
    setError(null);
  }

  function submitParticipant(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedMember) return;

    if (selectedMember.claimPasswordHash) {
      if (!verifyTripParticipantPassword(selectedMember, participantPassword)) {
        setError("รหัสไม่ถูกต้อง");
        return;
      }
      onAuthenticated(createTripParticipantSession(trip, selectedMember.id));
      return;
    }

    const claimedTrip = claimTripParticipant(trip, selectedMember.id, participantPassword);
    const claimedMember = claimedTrip.members.find((member) => member.id === selectedMember.id);
    if (!claimedMember?.claimPasswordHash) {
      setError("ตั้งรหัสอย่างน้อย 4 ตัวอักษร");
      return;
    }

    onTripChange(claimedTrip);
    onAuthenticated(createTripParticipantSession(claimedTrip, selectedMember.id));
  }

  return (
    <main className="join-page" aria-label="Join trip">
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
            <Button type="submit" className="join-submit">
              <Icon name="check" />
              เข้าห้อง trip
            </Button>
          </form>
        ) : (
          <div className="participant-step">
            <div className="participant-grid" aria-label="รายชื่อสมาชิกใน trip">
              {trip.members.map((member) => (
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
                <Button type="submit" className="join-submit">
                  <Icon name="check" />
                  {selectedMember.claimPasswordHash ? "ยืนยันตัวตน" : "เริ่มใช้งาน"}
                </Button>
              </form>
            ) : null}
          </div>
        )}
      </section>
    </main>
  );
}

function roleLabel(role: Member["role"]): string {
  if (role === "owner") return "Owner";
  if (role === "organizer") return "Organizer";
  if (role === "traveler") return "Traveller";
  return "Viewer";
}
