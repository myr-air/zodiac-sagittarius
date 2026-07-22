/**
 * Right context inspector — stop details when selected (T6).
 * Empty cue when nothing selected; type-shaped enrich cues + quiet Remove (T6 #3).
 */

"use client";

import { useState } from "react";
import { deleteItineraryItem } from "../../src/trip/itinerary-api";

const TYPE_LABEL: Record<string, string> = {
  travel: "Travel",
  food: "Food",
  stay: "Stay",
  attraction: "Attraction",
  experience: "Experience",
  shopping: "Shopping",
  unset: "Type",
};

/** Draft CUE_BY_TYPE — soft enrich hints by activity type. */
const CUE_BY_TYPE: Record<string, string> = {
  travel: "Travel usually wants From · To · By — fill when ready",
  stay: "Stay usually wants place · check-in / check-out",
  food: "Food usually wants place · meal slot",
  attraction: "Attraction usually wants place · duration",
  experience: "Experience usually wants title · meeting point",
  shopping: "Shopping usually wants place · list",
  note: "Note usually wants a short reminder · optional place",
  unset: "Choose a type when you care",
};

/** Draft fieldsToRail labels (empty values Phase 1 — cockpit has no typed field bag yet). */
function fieldsToRail(type: string): string[] {
  if (type === "travel") return ["From", "To", "By"];
  if (type === "stay") return ["Place", "Check-in", "Check-out"];
  if (type === "food") return ["Place", "Meal"];
  if (type === "attraction") return ["Place", "Duration"];
  if (type === "experience") return ["Title", "Meeting point"];
  if (type === "shopping") return ["Place", "List"];
  if (type === "note") return ["Note", "Place"];
  return ["Title", "Place"];
}

const REMOVE_LABEL = "Remove";
const DELETE_DIALOG_TITLE = "Delete activity";
const DELETE_CONFIRM_ACTION = "Delete";
const CANCEL_LABEL = "Cancel";
const DELETE_DIALOG_TITLE_ID = "itinerary-delete-dlg-title";

export type ItineraryContextSelectedItem = {
  id: string;
  activity: string;
  activityType: string;
  status: string;
  dayLabel?: string;
};

type ItineraryContextRailProps = {
  /** Selected stop summary; null/undefined = empty cue. */
  selectedItem?: ItineraryContextSelectedItem | null;
  tripId?: string;
  sessionToken?: string;
  apiBaseUrl?: string;
  fetch?: typeof fetch;
  /** After successful DELETE — parent clears selection / reloads. */
  onRemoved?: (itemId: string) => void;
};

function typeLabel(activityType: string): string {
  if (TYPE_LABEL[activityType]) return TYPE_LABEL[activityType]!;
  return TYPE_LABEL.unset;
}

function enrichCue(activityType: string): string {
  return CUE_BY_TYPE[activityType] || CUE_BY_TYPE.unset;
}

/**
 * Draft landmarks: #ctx-title / #ctx-meta inside aria-label="Context inspector".
 * Soft cues + type fields + quiet Remove (T6 #3).
 */
export function ItineraryContextRail({
  selectedItem,
  tripId,
  sessionToken,
  apiBaseUrl,
  fetch: fetchImpl,
  onRemoved,
}: ItineraryContextRailProps) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [removing, setRemoving] = useState(false);

  const empty = !selectedItem;
  const title = empty ? "No activity selected" : selectedItem.activity;
  const meta = empty
    ? "Select a stop to inspect"
    : [
        typeLabel(selectedItem.activityType),
        selectedItem.dayLabel,
        selectedItem.status,
      ]
        .filter(Boolean)
        .join(" · ");

  const fieldLabels = empty ? [] : fieldsToRail(selectedItem.activityType);
  const cue = empty ? null : enrichCue(selectedItem.activityType);

  function openConfirm() {
    setConfirmOpen(true);
  }

  function closeConfirm() {
    setConfirmOpen(false);
  }

  async function confirmDelete() {
    if (
      !selectedItem ||
      !tripId ||
      !sessionToken ||
      !apiBaseUrl ||
      !fetchImpl ||
      removing
    ) {
      return;
    }
    const itemId = selectedItem.id;
    closeConfirm();
    setRemoving(true);
    try {
      const outcome = await deleteItineraryItem(
        { tripId, itemId, sessionToken },
        { fetch: fetchImpl, apiBaseUrl },
      );
      if (outcome.ok) {
        onRemoved?.(itemId);
      }
    } finally {
      setRemoving(false);
    }
  }

  return (
    <aside
      className="context border-l border-(--color-border) bg-(--color-surface)"
      aria-label="Context inspector"
    >
      <div className="ctx-head">
        <div>
          <h2 id="ctx-title">{title}</h2>
          <p className="meta" id="ctx-meta">
            {meta}
          </p>
        </div>
        {!empty ? (
          <button
            type="button"
            className="btn-quiet-danger"
            disabled={removing}
            onClick={openConfirm}
          >
            {REMOVE_LABEL}
          </button>
        ) : null}
      </div>
      {empty ? (
        <div className="ctx-empty-start">
          <h3>Start here</h3>
          <p>Add under a day. Fields appear as you enrich.</p>
        </div>
      ) : (
        <>
          <div className="panel ctx-cues">
            <h3>Soft cues</h3>
            <div className="cue missing">{cue}</div>
          </div>
          <div className="panel ctx-fields">
            <h3>Type fields (rail)</h3>
            <div className="field-grid">
              {fieldLabels.map((label) => (
                <label key={label}>
                  {label}
                  {label === "By" ? (
                    <select defaultValue="" aria-label={label}>
                      <option value="">—</option>
                      <option value="flight">flight</option>
                      <option value="train">train</option>
                      <option value="bus">bus</option>
                      <option value="taxi">taxi</option>
                      <option value="ferry">ferry</option>
                      <option value="walk">walk</option>
                      <option value="car">car</option>
                      <option value="shuttle">shuttle</option>
                    </select>
                  ) : (
                    <input
                      defaultValue=""
                      placeholder="optional"
                      aria-label={label}
                    />
                  )}
                </label>
              ))}
            </div>
          </div>
        </>
      )}

      {confirmOpen && selectedItem ? (
        <div className="stop-dlg">
          <div className="stop-dlg-backdrop" onClick={closeConfirm} />
          <div
            className="stop-dlg-card"
            role="dialog"
            aria-modal="true"
            aria-labelledby={DELETE_DIALOG_TITLE_ID}
          >
            <h3 id={DELETE_DIALOG_TITLE_ID}>{DELETE_DIALOG_TITLE}</h3>
            <p className="stop-dlg-confirm">
              {`Remove "${selectedItem.activity}" from the plan?`}
            </p>
            <div className="stop-dlg-foot">
              <button type="button" onClick={closeConfirm}>
                {CANCEL_LABEL}
              </button>
              <button
                type="button"
                disabled={removing}
                onClick={() => void confirmDelete()}
              >
                {DELETE_CONFIRM_ACTION}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </aside>
  );
}
