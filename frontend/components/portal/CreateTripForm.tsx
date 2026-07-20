"use client";

import { useState } from "react";
import { JoinCredentialsPanel } from "@/components/auth/JoinCredentialsPanel";
import {
  classifyTripSeed as defaultClassifyTripSeed,
  type ClassifiedTripSeed,
  type ClassifiedWhen,
} from "@/src/create-trip/classify-seed";
import {
  composeCreateSeed,
  type CreateSeedDestination,
} from "@/src/create-trip/seed";
import type {
  AccountTripCreateSeed,
  AccountTripMemberSession,
  CreateAccountTripOutcome,
} from "@/src/account/account-api";
import type { TripSeedRecommendations } from "@/src/create-trip/classify-seed";

export type CreateTripFormProps = {
  /** Injected classify seam (defaults to shared classifyTripSeed). */
  classifyTripSeed?: (
    text: string,
  ) => ClassifiedTripSeed | Promise<ClassifiedTripSeed>;
  onCancel?: () => void;
  /** Account session Bearer token for create. */
  sessionToken?: string;
  /** Injected account create seam. */
  createAccountTrip?: (input: {
    sessionToken: string;
    seed: AccountTripCreateSeed;
  }) => Promise<CreateAccountTripOutcome>;
  /** Persist member session after successful create. */
  saveMemberSession?: (session: AccountTripMemberSession) => void;
  /** Navigate after create (e.g. `/trips/{id}`). */
  navigate?: (path: string) => void;
  /**
   * When set, parent hosts the fullscreen JoinCredentialsPanel (portal).
   * When omitted, the form renders the panel inline (tests / default).
   */
  onJoinCredentials?: (credentials: {
    tripId: string;
    joinId: string;
    joinPassword: string;
  }) => void;
};

type WhenMode = ClassifiedWhen["mode"];

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const;

const fieldClass =
  "w-full rounded-(--radius-sm) border border-(--color-border-strong) bg-(--color-surface) px-3.5 py-3 text-sm text-(--color-text) outline-none focus:border-(--color-primary) focus:shadow-[0_0_0_3px_rgba(15,118,110,0.18)]";

const labelClass = "text-xs font-semibold text-(--color-text)";

const modeBtnClass =
  "min-h-11 rounded-(--radius-sm) border border-(--color-border) bg-(--color-surface-muted) px-3 py-2 text-xs font-semibold text-(--color-text-muted) aria-pressed:border-(--color-primary) aria-pressed:bg-(--color-primary) aria-pressed:text-(--color-on-primary)";

function whenModeFromClassified(when: ClassifiedWhen): WhenMode {
  return when.mode;
}

function currentYear(): number {
  return new Date().getFullYear();
}

function formatMonthsRange(
  startY: number,
  startM: number,
  endY: number,
  endM: number,
): string {
  return `${MONTH_NAMES[startM]} ${startY} → ${MONTH_NAMES[endM]} ${endY}`;
}

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

/** First day of start month → last day of end month (0-based month indexes). */
function monthsToIsoBounds(
  startY: number,
  startM: number,
  endY: number,
  endM: number,
): { startDate: string; endDate: string } {
  const lastDay = new Date(Date.UTC(endY, endM + 1, 0)).getUTCDate();
  return {
    startDate: `${startY}-${pad2(startM + 1)}-01`,
    endDate: `${endY}-${pad2(endM + 1)}-${pad2(lastDay)}`,
  };
}

export function CreateTripForm({
  classifyTripSeed = defaultClassifyTripSeed,
  onCancel,
  sessionToken,
  createAccountTrip,
  saveMemberSession,
  navigate,
  onJoinCredentials,
}: CreateTripFormProps) {
  const [seed, setSeed] = useState("");
  const [reviewed, setReviewed] = useState(false);
  const [name, setName] = useState("");
  const [destinations, setDestinations] = useState<CreateSeedDestination[]>(
    [],
  );
  const [whenMode, setWhenMode] = useState<WhenMode>("flexible");
  const [exactStart, setExactStart] = useState("");
  const [exactEnd, setExactEnd] = useState("");
  const [exactOrderError, setExactOrderError] = useState(false);
  const [monthsStartY, setMonthsStartY] = useState<number | null>(null);
  const [monthsStartM, setMonthsStartM] = useState<number | null>(null);
  const [monthsEndY, setMonthsEndY] = useState<number | null>(null);
  const [monthsEndM, setMonthsEndM] = useState<number | null>(null);
  const [monthsPickingEnd, setMonthsPickingEnd] = useState(false);
  const [busy, setBusy] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [recommendations, setRecommendations] =
    useState<TripSeedRecommendations | null>(null);
  const [joinCredentials, setJoinCredentials] = useState<{
    tripId: string;
    joinId: string;
    joinPassword: string;
  } | null>(null);

  const canCreate = name.trim().length > 0 || destinations.length > 0;

  const monthsSummary =
    monthsStartY != null &&
    monthsStartM != null &&
    monthsEndY != null &&
    monthsEndM != null
      ? formatMonthsRange(monthsStartY, monthsStartM, monthsEndY, monthsEndM)
      : null;

  async function handleClassify() {
    setBusy(true);
    setSubmitError(null);
    try {
      const result = await classifyTripSeed(seed);
      setName(result.name);
      setDestinations(result.destinations);
      setWhenMode(whenModeFromClassified(result.when));
      setExactOrderError(false);
      setMonthsPickingEnd(false);
      setRecommendations(result.recommendations ?? null);

      if (result.when.mode === "exact") {
        setExactStart(result.when.start);
        setExactEnd(result.when.end);
      } else {
        setExactStart("");
        setExactEnd("");
      }

      if (result.when.mode === "months") {
        setMonthsStartY(result.when.startY);
        setMonthsStartM(result.when.startM);
        setMonthsEndY(result.when.endY);
        setMonthsEndM(result.when.endM);
      } else {
        setMonthsStartY(null);
        setMonthsStartM(null);
        setMonthsEndY(null);
        setMonthsEndM(null);
      }

      setReviewed(true);
    } catch (err) {
      setSubmitError(
        err instanceof Error
          ? err.message
          : "Could not understand your trip seed. Please try again.",
      );
    } finally {
      setBusy(false);
    }
  }

  function addRelatedPlace(label: string) {
    setDestinations((prev) => {
      if (prev.some((d) => d.label.toLowerCase() === label.toLowerCase())) {
        return prev;
      }
      return [...prev, { label, role: "optional" }];
    });
  }
  function pickMonth(monthIndex: number) {
    if (!monthsPickingEnd || monthsStartM == null || monthsStartY == null) {
      setMonthsStartM(monthIndex);
      setMonthsStartY(monthsStartY ?? currentYear());
      setMonthsEndM(null);
      setMonthsEndY(null);
      setMonthsPickingEnd(true);
      return;
    }

    const startY = monthsStartY;
    const startM = monthsStartM;
    const endY = monthIndex < startM ? startY + 1 : startY;
    setMonthsEndM(monthIndex);
    setMonthsEndY(endY);
    setMonthsPickingEnd(false);
  }

  function normalizeExactOnBlur() {
    if (exactStart && exactEnd && exactStart > exactEnd) {
      setExactStart(exactEnd);
      setExactEnd(exactStart);
      setExactOrderError(false);
    }
  }

  function buildCreateSeed(): AccountTripCreateSeed | null {
    const composed = composeCreateSeed({ name, destinations });
    if (!composed.ok) return null;

    const payload: AccountTripCreateSeed = {
      name: composed.seed.name,
      destinationLabel: composed.seed.destinationLabel,
    };

    if (whenMode === "exact" && exactStart && exactEnd) {
      payload.startDate = exactStart;
      payload.endDate = exactEnd;
    } else if (
      whenMode === "months" &&
      monthsStartY != null &&
      monthsStartM != null &&
      monthsEndY != null &&
      monthsEndM != null
    ) {
      const bounds = monthsToIsoBounds(
        monthsStartY,
        monthsStartM,
        monthsEndY,
        monthsEndM,
      );
      payload.startDate = bounds.startDate;
      payload.endDate = bounds.endDate;
    }
    // flexible / incomplete → omit dates (server defaults); never partySize

    return payload;
  }

  async function handleCreate() {
    if (!canCreate || !sessionToken || !createAccountTrip) return;

    const seedPayload = buildCreateSeed();
    if (!seedPayload) return;

    setBusy(true);
    setSubmitError(null);
    try {
      const outcome = await createAccountTrip({
        sessionToken,
        seed: seedPayload,
      });
      if (!outcome.ok) {
        setSubmitError(outcome.error);
        return;
      }
      // Match landing: persist member session at create, show credentials before navigate.
      saveMemberSession?.(outcome.memberSession);
      const credentials = {
        tripId: outcome.trip.id,
        joinId: outcome.trip.joinId,
        joinPassword: outcome.joinPassword,
      };
      if (onJoinCredentials) {
        onJoinCredentials(credentials);
      } else {
        setJoinCredentials(credentials);
      }
    } finally {
      setBusy(false);
    }
  }

  function handleCredentialsContinue() {
    if (!joinCredentials) return;
    navigate?.(`/trips/${joinCredentials.tripId}`);
  }

  if (joinCredentials) {
    return (
      <JoinCredentialsPanel
        joinId={joinCredentials.joinId}
        joinPassword={joinCredentials.joinPassword}
        onContinue={handleCredentialsContinue}
      />
    );
  }

  return (
    <form
      className="flex flex-col gap-4 rounded-(--radius-md) border border-(--color-border) bg-(--color-surface) p-4 text-(--color-text)"
      onSubmit={(event) => {
        event.preventDefault();
        void handleCreate();
      }}
      aria-label="Create trip"
    >
      <div className="flex flex-col gap-1.5">
        <label htmlFor="create-trip-seed" className={labelClass}>
          Describe the trip
        </label>
        <textarea
          id="create-trip-seed"
          className={`${fieldClass} min-h-[110px] resize-y`}
          value={seed}
          onChange={(event) => setSeed(event.target.value)}
          placeholder="e.g. Friends trip to Japan in October, maybe Korea too — leave dates flexible"
          rows={4}
        />
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className="portal-btn portal-btn--primary"
          onClick={() => void handleClassify()}
          disabled={busy || !seed.trim()}
        >
          Understand with AI
        </button>
        {onCancel ? (
          <button
            type="button"
            className="portal-btn portal-btn--ghost"
            onClick={onCancel}
          >
            Cancel
          </button>
        ) : null}
      </div>

      {reviewed ? (
        <div className="flex flex-col gap-4 border-t border-(--color-border) pt-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="create-trip-name" className={labelClass}>
              Trip name
            </label>
            <input
              id="create-trip-name"
              className={fieldClass}
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <p className={labelClass} id="create-trip-destinations-label">
              Destinations
            </p>
            <ul
              className="m-0 flex list-none flex-col gap-2 p-0"
              role="list"
              aria-labelledby="create-trip-destinations-label"
            >
              {destinations.map((dest, index) => (
                <li
                  key={`${dest.role}-${index}`}
                  className="flex min-h-11 items-center gap-2 rounded-(--radius-sm) border border-(--color-border) bg-(--color-surface-muted) px-2 py-1"
                >
                  <input
                    className="min-h-11 min-w-0 flex-1 border-0 bg-transparent px-1.5 text-sm font-medium text-(--color-text) outline-none"
                    type="text"
                    value={dest.label}
                    aria-label={`${dest.role} destination`}
                    onChange={(event) => {
                      const label = event.target.value;
                      setDestinations((prev) =>
                        prev.map((d, i) => (i === index ? { ...d, label } : d)),
                      );
                    }}
                  />
                  <span className="shrink-0 text-xs font-semibold capitalize text-(--color-text-muted)">
                    {dest.role}
                  </span>
                  <button
                    type="button"
                    className="portal-btn portal-btn--ghost shrink-0 px-2 py-1 text-xs"
                    aria-label={`Remove ${dest.role} destination`}
                    onClick={() => {
                      setDestinations((prev) =>
                        prev.filter((_, i) => i !== index),
                      );
                    }}
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
            {destinations.length === 0 ? (
              <button
                type="button"
                className="portal-btn portal-btn--ghost self-start"
                onClick={() => {
                  setDestinations([{ label: "", role: "primary" }]);
                }}
              >
                Add destination
              </button>
            ) : null}
            {recommendations &&
            (recommendations.relatedPlaces.length > 0 ||
              recommendations.styles.length > 0) ? (
              <div className="flex flex-col gap-1.5 pt-1">
                <p className="text-xs text-(--color-text-muted)">
                  AI suggestions
                  {recommendations.seasonHint
                    ? ` · ${recommendations.seasonHint}`
                    : ""}
                  {recommendations.styles.length > 0
                    ? ` · ${recommendations.styles.join(", ")}`
                    : ""}
                </p>
                {recommendations.relatedPlaces.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {recommendations.relatedPlaces.map((place) => (
                      <button
                        key={place}
                        type="button"
                        className="portal-btn portal-btn--ghost px-2 py-1 text-xs"
                        onClick={() => addRelatedPlace(place)}
                      >
                        Add {place}
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>

          <div
            className="flex flex-col gap-2"
            role="group"
            aria-label="When mode"
          >
            <p className={labelClass}>When</p>
            <div className="flex flex-wrap gap-2">
              {(
                [
                  ["flexible", "Flexible"],
                  ["months", "Months"],
                  ["exact", "Exact"],
                ] as const
              ).map(([mode, label]) => (
                <button
                  key={mode}
                  type="button"
                  className={modeBtnClass}
                  aria-pressed={whenMode === mode}
                  onClick={() => setWhenMode(mode)}
                >
                  {label}
                </button>
              ))}
            </div>

            {whenMode === "months" ? (
              <div className="mt-1 flex flex-col gap-2">
                {monthsSummary ? (
                  <p className="text-sm text-(--color-text)">{monthsSummary}</p>
                ) : null}
                <div className="flex flex-wrap gap-2">
                  {MONTH_NAMES.map((label, index) => (
                    <button
                      key={label}
                      type="button"
                      className={modeBtnClass}
                      aria-pressed={
                        monthsStartM === index || monthsEndM === index
                      }
                      onClick={() => pickMonth(index)}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}

            {whenMode === "exact" ? (
              <div className="mt-1 grid gap-3 sm:grid-cols-2">
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="create-trip-start" className={labelClass}>
                    Start
                  </label>
                  <input
                    id="create-trip-start"
                    className={fieldClass}
                    type="date"
                    value={exactStart}
                    onChange={(event) => {
                      setExactStart(event.target.value);
                      setExactOrderError(false);
                    }}
                    onBlur={normalizeExactOnBlur}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="create-trip-end" className={labelClass}>
                    End
                  </label>
                  <input
                    id="create-trip-end"
                    className={fieldClass}
                    type="date"
                    value={exactEnd}
                    onChange={(event) => {
                      setExactEnd(event.target.value);
                      setExactOrderError(false);
                    }}
                    onBlur={normalizeExactOnBlur}
                  />
                </div>
                {exactOrderError ? (
                  <p role="alert" className="text-sm text-(--color-danger) sm:col-span-2">
                    Start must be before or equal to end
                  </p>
                ) : null}
              </div>
            ) : null}
          </div>

          {submitError ? (
            <p role="alert" className="text-sm text-(--color-danger)">
              {submitError}
            </p>
          ) : null}

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="portal-btn portal-btn--primary"
              disabled={!canCreate || busy}
              onClick={() => void handleCreate()}
            >
              Create trip
            </button>
          </div>
        </div>
      ) : null}
    </form>
  );
}
