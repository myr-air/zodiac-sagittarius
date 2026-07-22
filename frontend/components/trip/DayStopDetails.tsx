"use client";

/**
 * DayStopDetails — inline Selected details (notes + status) for Theme A.
 * Not a dialog; blur commits via itinerary-items PATCH (M80VKAX5 T5).
 */

import { useEffect, useId, useState } from "react";
import { patchItineraryItem } from "../../src/trip/itinerary-api";

export type DayStopDetailsStop = {
  id: string;
  activity: string;
  note?: string;
  status: string;
  version: number;
};

export type DayStopDetailsProps = {
  stop: DayStopDetailsStop;
  tripId: string;
  sessionToken: string;
  apiBaseUrl?: string;
  fetch?: typeof fetch;
  onCockpitReload?: () => void;
};

/**
 * Inline Notes / Status inspector for the selected day-timeline stop.
 */
export function DayStopDetails({
  stop,
  tripId,
  sessionToken,
  apiBaseUrl = "",
  fetch: fetchImpl = fetch,
  onCockpitReload,
}: DayStopDetailsProps) {
  const baseId = useId();
  const notesId = `${baseId}-notes`;
  const statusId = `${baseId}-status`;
  const headingId = `${baseId}-heading`;

  const [note, setNote] = useState(stop.note ?? "");
  const [status, setStatus] = useState(stop.status);
  const [awaitingCockpitReload, setAwaitingCockpitReload] = useState(false);

  useEffect(() => {
    setNote(stop.note ?? "");
    setStatus(stop.status);
  }, [stop.id, stop.note, stop.status]);

  function commitPatch(patch: { note?: string; status?: string }) {
    if (awaitingCockpitReload) return;
    void patchItineraryItem(
      {
        tripId,
        itemId: stop.id,
        sessionToken,
        expectedVersion: stop.version,
        patch,
      },
      { fetch: fetchImpl, apiBaseUrl },
    ).then((outcome) => {
      if (outcome.ok) return;
      if (outcome.code === "version_conflict") {
        setAwaitingCockpitReload(true);
        onCockpitReload?.();
      }
    });
  }

  function commitNote() {
    const next = note;
    if (next === (stop.note ?? "")) return;
    commitPatch({ note: next });
  }

  function commitStatus() {
    const next = status;
    if (next === stop.status) return;
    commitPatch({ status: next });
  }

  return (
    <section
      className="panel day-stop-details rounded-xl border border-(--color-border) bg-(--color-surface) p-4"
      aria-label="Selected details"
    >
      <div className="panel-head mb-3">
        <h2
          id={headingId}
          className="m-0 text-sm font-semibold text-(--color-text)"
        >
          Details
        </h2>
      </div>
      <div className="details grid gap-3">
        <div className="field">
          <label
            htmlFor={notesId}
            className="mb-1 block text-[12px] font-medium text-(--color-text-muted)"
          >
            Notes
          </label>
          <textarea
            id={notesId}
            aria-label="Notes"
            className="min-h-[4.5rem] w-full rounded-md border border-(--color-border) bg-(--color-surface) px-2.5 py-2 text-[13px] text-(--color-text)"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            onBlur={() => commitNote()}
          />
        </div>
        <div className="field">
          <label
            htmlFor={statusId}
            className="mb-1 block text-[12px] font-medium text-(--color-text-muted)"
          >
            Status
          </label>
          <input
            id={statusId}
            type="text"
            aria-label="Status"
            className="w-full rounded-md border border-(--color-border) bg-(--color-surface) px-2.5 py-2 text-[13px] text-(--color-text)"
            value={status}
            autoComplete="off"
            onChange={(e) => setStatus(e.target.value)}
            onBlur={() => commitStatus()}
          />
        </div>
      </div>
    </section>
  );
}
