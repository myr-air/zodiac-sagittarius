"use client";

import { useState } from "react";
import {
  defaultApiBaseUrl,
  joinAsClaimableMember,
  resolveTripInvite,
  tripAccessShell,
  type ClaimableMember,
} from "@/src/auth/trip-access";
import { useAuthLocale } from "./AuthLocaleProvider";

type JoinPhase =
  | { kind: "code" }
  | {
      kind: "pick-member";
      tripId: string;
      joinSessionToken: string;
      claimableMembers: ClaimableMember[];
    };

export function TripAccessForm() {
  const shell = tripAccessShell();
  const { copy } = useAuthLocale();
  const [code, setCode] = useState("");
  const [phase, setPhase] = useState<JoinPhase>({ kind: "code" });
  const [selectedMemberId, setSelectedMemberId] = useState<string>("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const { inputFr, enterFr } = shell.codeRow.rail.controls;

  async function onSubmitCode(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setPending(true);
    try {
      const outcome = await resolveTripInvite(code, {
        fetch,
        apiBaseUrl: defaultApiBaseUrl(),
      });
      if (!outcome.ok) {
        setError(outcome.error);
        return;
      }
      setPhase({
        kind: "pick-member",
        tripId: outcome.tripId,
        joinSessionToken: outcome.joinSessionToken,
        claimableMembers: outcome.claimableMembers,
      });
      setSelectedMemberId(outcome.claimableMembers[0]?.id ?? "");
    } finally {
      setPending(false);
    }
  }

  async function onSubmitClaim(event: React.FormEvent) {
    event.preventDefault();
    if (phase.kind !== "pick-member" || !selectedMemberId) return;
    setError(null);
    setPending(true);
    try {
      const member = phase.claimableMembers.find((m) => m.id === selectedMemberId);
      if (!member) {
        setError(copy.trip.selectMember);
        return;
      }
      const outcome = await joinAsClaimableMember(
        {
          tripId: phase.tripId,
          memberId: member.id,
          participantPassword: password,
          joinSessionToken: phase.joinSessionToken,
          claimedAt: member.claimedAt,
        },
        {
          fetch,
          apiBaseUrl: defaultApiBaseUrl(),
          storage:
            typeof window !== "undefined"
              ? window.localStorage
              : {
                  getItem: () => null,
                  setItem: () => undefined,
                },
          navigate: (route) => {
            window.location.assign(route);
          },
        },
      );
      if (!outcome.ok) {
        setError(outcome.error);
      }
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="w-full">
      <p className="m-0 inline-flex items-center gap-2 rounded-full border border-(--color-primary-border) bg-(--color-primary-soft) px-2.5 py-1.5 text-xs font-bold text-(--color-primary-strong)">
        <span
          className="inline-block size-2 rounded-full bg-(--color-primary)"
          aria-hidden="true"
        />
        {copy.trip.kicker}
      </p>
      <h1 className="mt-3 mb-0 text-[clamp(1.618rem,3vw,2.125rem)] font-bold leading-tight text-(--color-text)">
        {copy.trip.heading}
      </h1>
      <p className="mt-3 mb-0 w-full text-sm leading-[1.618] text-(--color-text-muted)">
        {copy.trip.lede}
      </p>

      {phase.kind === "code" ? (
        <form className="mt-6 w-full" onSubmit={onSubmitCode}>
          <div className="grid gap-2">
            <label
              htmlFor={shell.codeRow.inputId}
              className="text-xs font-semibold leading-none text-(--color-text)"
            >
              {copy.trip.codeLabel}
            </label>
            <div
              className="grid items-stretch gap-3 min-[480px]:grid-cols-[var(--trip-code-input)_var(--trip-code-enter)]"
              style={
                {
                  ["--trip-code-input" as string]: `${inputFr}fr`,
                  ["--trip-code-enter" as string]: `${enterFr}fr`,
                } as React.CSSProperties
              }
            >
              <input
                id={shell.codeRow.inputId}
                name="tripCode"
                value={code}
                onChange={(event) => setCode(event.target.value)}
                autoComplete="off"
                spellCheck={false}
                placeholder={copy.trip.codePlaceholder}
                disabled={pending}
                className="min-h-14 w-full rounded-[8px] border border-(--color-border) bg-(--color-surface) px-3 font-mono tracking-[0.06em] text-(--color-text) outline-none transition-[border-color,box-shadow] duration-[180ms] focus:border-(--color-primary) focus:shadow-[0_0_0_3px_rgba(15,118,110,0.18)]"
              />
              <button
                type="submit"
                disabled={pending || code.trim().length === 0}
                className="min-h-14 w-full rounded-[8px] bg-(--color-primary) px-4 font-bold text-(--color-on-primary) transition-colors duration-[180ms] hover:bg-(--color-primary-strong) disabled:opacity-60"
              >
                {copy.trip.enter}
              </button>
            </div>
            <span className="text-xs leading-[1.618] text-(--color-text-subtle)">
              {copy.trip.codeHint}
            </span>
          </div>
        </form>
      ) : (
        <form className="mt-6 grid w-full gap-4" onSubmit={onSubmitClaim}>
          <div className="grid gap-2">
            <label
              htmlFor="trip-member"
              className="text-xs font-semibold leading-none text-(--color-text)"
            >
              {copy.trip.who}
            </label>
            <select
              id="trip-member"
              value={selectedMemberId}
              onChange={(event) => setSelectedMemberId(event.target.value)}
              disabled={pending}
              className="min-h-14 w-full rounded-[8px] border border-(--color-border) bg-(--color-surface) px-3 text-(--color-text) outline-none duration-[180ms] focus:border-(--color-primary) focus:shadow-[0_0_0_3px_rgba(15,118,110,0.18)]"
            >
              {phase.claimableMembers.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.displayName}
                  {member.claimedAt ? " (claimed)" : ""}
                </option>
              ))}
            </select>
          </div>
          <div className="grid gap-2">
            <label
              htmlFor="trip-member-password"
              className="text-xs font-semibold leading-none text-(--color-text)"
            >
              {copy.trip.memberPassword}
            </label>
            <input
              id="trip-member-password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
              disabled={pending}
              className="min-h-14 w-full rounded-[8px] border border-(--color-border) bg-(--color-surface) px-3 text-(--color-text) outline-none duration-[180ms] focus:border-(--color-primary) focus:shadow-[0_0_0_3px_rgba(15,118,110,0.18)]"
            />
          </div>
          <button
            type="submit"
            disabled={
              pending || !selectedMemberId || password.trim().length === 0
            }
            className="min-h-14 w-full rounded-[8px] bg-(--color-primary) px-4 font-bold text-(--color-on-primary) transition-colors duration-[180ms] hover:bg-(--color-primary-strong) disabled:opacity-60"
          >
            {copy.trip.enter}
          </button>
          <button
            type="button"
            disabled={pending}
            onClick={() => {
              setPhase({ kind: "code" });
              setPassword("");
              setError(null);
            }}
            className="text-sm font-bold text-(--color-text-muted) underline-offset-2 hover:underline"
          >
            {copy.trip.useDifferentCode}
          </button>
        </form>
      )}

      {error ? (
        <p
          role="alert"
          className="mt-4 rounded-[13px] border border-(--color-danger-border) bg-(--color-danger-soft) px-3 py-2 text-sm text-(--color-danger)"
        >
          {error}
        </p>
      ) : null}

      <p className="mt-6 text-sm text-(--color-text-muted)">
        {copy.trip.needWorkspace}{" "}
        <a
          href={shell.registerHref}
          className="font-bold text-(--color-primary-strong) underline-offset-2 hover:underline"
        >
          {copy.trip.registerLink}
        </a>
      </p>
      <p className="mt-2 text-sm text-(--color-text-muted)">
        {copy.trip.organizers}{" "}
        <a
          href={shell.loginHref}
          className="font-bold text-(--color-route) underline-offset-2 hover:underline"
        >
          {copy.trip.logInLink}
        </a>{" "}
        {copy.trip.manageOwnership}
      </p>
    </div>
  );
}
