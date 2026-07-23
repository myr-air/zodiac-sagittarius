"use client";

/**
 * DayTimeEditDialog — must-finish Edit time dialog (Theme A).
 * Start / End / Duration (readonly) / Timezone; Save → itinerary PATCH.
 */

import { useId, useState } from "react";
import { patchItineraryItem } from "../../src/trip/itinerary-api";

export type DayTimeEditStop = {
  id: string;
  activity: string;
  startTime: string;
  endTime?: string | null;
  timezone?: string;
  timezoneLabel?: string;
  version: number;
};

export type DayTimeEditDialogProps = {
  open: boolean;
  stop: DayTimeEditStop;
  tripId: string;
  sessionToken: string;
  apiBaseUrl?: string;
  fetch?: typeof fetch;
  onClose: () => void;
  onCockpitReload?: () => void;
  onSaved?: (times: { startTime: string; endTime: string }) => void;
};

/** Draft durLabel(09:00, 10:30) → "1h 30m". */
export function durLabel(start: string, end: string): string {
  if (!start || !end) return "";
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  if ([sh, sm, eh, em].some((n) => Number.isNaN(n))) return "";
  let mins = eh * 60 + em - (sh * 60 + sm);
  if (mins < 0) mins += 24 * 60;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${h}h ${String(m).padStart(2, "0")}m`;
}

function timezoneDisplay(stop: DayTimeEditStop): string {
  return stop.timezoneLabel?.trim() || stop.timezone?.trim() || "";
}

/**
 * Edit time must-finish dialog — patches startTime + endTime via itinerary-api.
 */
export function DayTimeEditDialog({
  open,
  stop,
  tripId,
  sessionToken,
  apiBaseUrl = "",
  fetch: fetchImpl = fetch,
  onClose,
  onCockpitReload,
  onSaved,
}: DayTimeEditDialogProps) {
  const baseId = useId();
  const titleId = `${baseId}-title`;
  const startId = `${baseId}-start`;
  const endId = `${baseId}-end`;
  const durId = `${baseId}-dur`;
  const tzId = `${baseId}-tz`;

  const [startTime, setStartTime] = useState(stop.startTime);
  const [endTime, setEndTime] = useState(stop.endTime ?? "");
  const [timezone, setTimezone] = useState(timezoneDisplay(stop));
  const [saving, setSaving] = useState(false);

  // Derive the form fields from `stop` during render (React's documented
  // "adjusting state when a prop changes" pattern) instead of an effect:
  // resync the draft to the latest stop values whenever the dialog is open
  // and either just opened or the underlying stop data changed (e.g. a
  // cockpit reload while the dialog stays open). `synced` remembers the
  // props last written to the draft so user edits in progress aren't
  // clobbered on every render.
  const [synced, setSynced] = useState<{
    open: boolean;
    stopId: string;
    startTime: string;
    endTime: string | null | undefined;
    timezone: string | undefined;
    timezoneLabel: string | undefined;
  } | null>(null);
  if (
    open &&
    (!synced ||
      !synced.open ||
      synced.stopId !== stop.id ||
      synced.startTime !== stop.startTime ||
      synced.endTime !== stop.endTime ||
      synced.timezone !== stop.timezone ||
      synced.timezoneLabel !== stop.timezoneLabel)
  ) {
    setSynced({
      open: true,
      stopId: stop.id,
      startTime: stop.startTime,
      endTime: stop.endTime,
      timezone: stop.timezone,
      timezoneLabel: stop.timezoneLabel,
    });
    setStartTime(stop.startTime);
    setEndTime(stop.endTime ?? "");
    setTimezone(timezoneDisplay(stop));
  } else if (!open && synced?.open) {
    setSynced({ ...synced, open: false });
  }

  if (!open) return null;

  const duration = durLabel(startTime, endTime);

  async function handleSave() {
    if (saving) return;
    setSaving(true);
    try {
      const outcome = await patchItineraryItem(
        {
          tripId,
          itemId: stop.id,
          sessionToken,
          expectedVersion: stop.version,
          patch: {
            startTime,
            endTime,
          },
        },
        { fetch: fetchImpl, apiBaseUrl },
      );
      if (outcome.ok) {
        onSaved?.({ startTime, endTime });
        onClose();
        return;
      }
      if (outcome.code === "version_conflict") {
        onCockpitReload?.();
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="stop-dlg open">
      <div className="stop-dlg-backdrop" onClick={onClose} />
      <div
        className="stop-dlg-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <h3 id={titleId}>Edit time</h3>
        <div className="stop-dlg-body">
          <div className="time-setup-grid grid gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor={startId}>Start</label>
              <input
                id={startId}
                type="time"
                aria-label="Start"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor={endId}>End</label>
              <input
                id={endId}
                type="time"
                aria-label="End"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor={durId}>Duration</label>
              <input
                id={durId}
                type="text"
                aria-label="Duration"
                value={duration}
                readOnly
              />
            </div>
            <div>
              <label htmlFor={tzId}>Timezone</label>
              <input
                id={tzId}
                type="text"
                aria-label="Timezone"
                value={timezone}
                autoComplete="off"
                onChange={(e) => setTimezone(e.target.value)}
              />
            </div>
          </div>
        </div>
        <div className="stop-dlg-foot">
          <button type="button" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className="btn-primary"
            disabled={saving}
            onClick={() => void handleSave()}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
