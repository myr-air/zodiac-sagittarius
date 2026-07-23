"use client";

/**
 * PlaceResolveDialog — draft #dlg-resolve candidate picker (M81HY2YR T2 #1).
 * Resolve → pick candidate → PATCH place/mapLink/lat/lng via expectedVersion.
 */

import { useEffect, useId, useState } from "react";
import { patchItineraryItem } from "../../src/trip/itinerary-api";
import {
  resolvePlace,
  type PlaceCandidate,
} from "../../src/trip/place-resolve-api";
import type { TripCockpitItineraryItem } from "../../src/trip/trip-cockpit-load";

export type PlaceResolveDialogItem = {
  id: string;
  activity: string;
  place: string;
  day: string;
  version: number;
};

export type PlaceResolveDialogProps = {
  open: boolean;
  item: PlaceResolveDialogItem;
  tripId: string;
  sessionToken: string;
  destinationLabel: string;
  countries: string[];
  apiBaseUrl?: string;
  fetch?: typeof fetch;
  onClose: () => void;
  onApplied?: (item: TripCockpitItineraryItem) => void;
  onCockpitReload?: () => void;
};

function nextClientMutationId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `place-resolve-${Date.now()}`;
}

function confidenceLabel(candidate: PlaceCandidate): string {
  if (candidate.confidence >= 0.8) return "High confidence · map lookup";
  if (candidate.confidence >= 0.5) return "Medium confidence";
  return "Lower confidence";
}

/**
 * Explicit Resolve candidate picker — persists place + map pin via itinerary PATCH.
 */
export function PlaceResolveDialog({
  open,
  item,
  tripId,
  sessionToken,
  destinationLabel,
  countries,
  apiBaseUrl = "",
  fetch: fetchImpl = fetch,
  onClose,
  onApplied,
  onCockpitReload,
}: PlaceResolveDialogProps) {
  const baseId = useId();
  const titleId = `${baseId}-title`;

  /** Parent remounts with key={item.id}; start loading — no sync reset in effect. */
  const [candidates, setCandidates] = useState<PlaceCandidate[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [loading, setLoading] = useState(open);
  const [applying, setApplying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const countriesKey = countries.join("\0");

  useEffect(() => {
    if (!open) return;

    let cancelled = false;

    void resolvePlace(
      {
        tripId,
        sessionToken,
        clientMutationId: nextClientMutationId(),
        activity: item.activity,
        placeHint: item.place,
        destinationLabel,
        countries,
        day: item.day,
      },
      { fetch: fetchImpl, apiBaseUrl },
    ).then((outcome) => {
      if (cancelled) return;
      setLoading(false);
      if (!outcome.ok) {
        setError(outcome.error);
        return;
      }
      if (
        outcome.status === "unresolved" ||
        outcome.candidates.length === 0
      ) {
        setError(
          "Place resolve is unavailable right now. You can still paste a map link.",
        );
        setCandidates([]);
        return;
      }
      setCandidates(outcome.candidates);
      setSelectedIndex(0);
    });

    return () => {
      cancelled = true;
    };
  }, [
    open,
    tripId,
    sessionToken,
    item.id,
    item.activity,
    item.place,
    item.day,
    destinationLabel,
    countriesKey,
    apiBaseUrl,
    fetchImpl,
  ]);

  if (!open) return null;

  async function handleApply() {
    if (applying || selectedIndex == null) return;
    const candidate = candidates[selectedIndex];
    if (!candidate) return;

    setApplying(true);
    setError(null);
    try {
      const outcome = await patchItineraryItem(
        {
          tripId,
          itemId: item.id,
          sessionToken,
          expectedVersion: item.version,
          patch: {
            place: candidate.name,
            mapLink: candidate.mapLink,
            latitude: candidate.coordinates.lat,
            longitude: candidate.coordinates.lng,
          },
        },
        { fetch: fetchImpl, apiBaseUrl },
      );
      if (outcome.ok) {
        onApplied?.(outcome.item);
        onClose();
        return;
      }
      if (outcome.code === "version_conflict") {
        onCockpitReload?.();
      }
      setError(outcome.error);
    } finally {
      setApplying(false);
    }
  }

  const hint = item.place.trim() || "—";
  const dest = destinationLabel.trim() || "—";

  return (
    <div className="stop-dlg open place-resolve-dlg">
      <div className="stop-dlg-backdrop" onClick={onClose} />
      <div
        className="stop-dlg-card place-resolve-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <div className="place-resolve-head">
          <div>
            <h3 id={titleId}>Resolve place</h3>
            <p>
              Hint: {hint} · destination {dest}
            </p>
          </div>
          <button type="button" className="btn-quiet" onClick={onClose}>
            Close
          </button>
        </div>
        <div className="stop-dlg-body place-resolve-body">
          <div className="step-label">Candidates</div>
          {loading ? (
            <p className="place-resolve-status">Looking up places…</p>
          ) : null}
          {candidates.map((candidate, index) => {
            const pressed = selectedIndex === index;
            return (
              <button
                key={`${candidate.name}-${candidate.mapLink}-${index}`}
                type="button"
                className="candidate"
                aria-pressed={pressed ? "true" : "false"}
                onClick={() => setSelectedIndex(index)}
              >
                <strong>{candidate.name}</strong>
                <span>{candidate.address}</span>
                <span className="conf">{confidenceLabel(candidate)}</span>
              </button>
            );
          })}
          {error ? (
            <div className="error-box" role="alert">
              {error}
            </div>
          ) : null}
        </div>
        <div className="stop-dlg-foot">
          <button type="button" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className="btn-primary"
            disabled={applying || selectedIndex == null || loading}
            onClick={() => void handleApply()}
          >
            Apply to stop
          </button>
        </div>
      </div>
    </div>
  );
}
