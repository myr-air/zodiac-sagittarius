/**
 * Right context inspector — stop details when selected (T6).
 * Single empty cue when nothing selected (M81LW2UJ T5); type-shaped enrich
 * cues + quiet Remove (T6 #3). Draft Map link with Resolve-to-fill placeholder
 * when selected (honest — no fake paste API; place-cell Resolve OK).
 * T7 #1: type fields mirror the stop field bag (table + rail stay in sync).
 * M81DDKSC T4: mappable bag keys PATCH via soft-map; non-mappable stay read-only.
 */

"use client";

import { useEffect, useRef, useState } from "react";
import {
  deleteItineraryItem,
  patchItineraryItem,
} from "../../src/trip/itinerary-api";
import type { TripCockpitItineraryItem } from "../../src/trip/trip-cockpit-load";
import {
  BY_OPTIONS,
  MEAL_OPTIONS,
  STAY_ACTION_LABEL,
  STAY_ACTION_OPTIONS,
  fieldsToRail,
  isBagKeyPersistable,
  softMapBagKeyToPatch,
  type StopFieldBag,
} from "../../src/trip/itinerary-type-fields";

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
  stay: "Stay = one hotel action per stop (check-in · drop item · rest · check-out)",
  food: "Food usually wants place · meal — reservation optional",
  attraction: "Attraction usually wants place · ticket — tip note optional",
  experience: "Experience = do an activity (tour/class) — name · meet-at · booking",
  shopping: "Shopping usually wants place · to-get list",
  note: "Note usually wants a short reminder · optional place",
  unset: "Choose a type when you care",
};

const REMOVE_LABEL = "Remove";
const DELETE_DIALOG_TITLE = "Delete activity";
const DELETE_CONFIRM_ACTION = "Delete";
const CANCEL_LABEL = "Cancel";
const DELETE_DIALOG_TITLE_ID = "itinerary-delete-dlg-title";
/** Calm muted surface/text for non-persistable rail fields (DESIGN.md). */
const FIELD_READONLY_CLASS =
  "bg-(--color-surface-muted) text-(--color-text-muted)";

export type ItineraryContextSelectedItem = {
  id: string;
  activity: string;
  activityType: string;
  status: string;
  dayLabel?: string;
  /** Optimistic concurrency token for PATCH (M81DDKSC T4). */
  version?: number;
  /** Per-stop type field bag (T7 #1). */
  fieldBag?: StopFieldBag;
  /**
   * Current API `details` — passed through to softMapBagKeyToPatch so
   * from/to/by/meal patches merge instead of wiping sibling detail fields
   * (M82GSOYG GREEN details merge).
   */
  details?: Record<string, unknown> | null;
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
  /** Rail edits update the shared bag (table stays aligned). */
  onFieldBagChange?: (itemId: string, fieldBag: StopFieldBag) => void;
  /**
   * Successful rail PATCH — parent applies returned summary (esp. version)
   * so the next edit sends the new expectedVersion.
   */
  onPatched?: (item: TripCockpitItineraryItem) => void;
  /** Parent reloads TripCockpit after version_conflict (parity with table). */
  onCockpitReload?: () => void;
  /**
   * Parent bumps after TripCockpit reload completes — clears the conflict
   * lock so rail PATCH can resume.
   */
  reloadToken?: number;
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
  onFieldBagChange,
  onPatched,
  onCockpitReload,
  reloadToken = 0,
}: ItineraryContextRailProps) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [removing, setRemoving] = useState(false);
  /** Calm user-visible DELETE failure (e.g. block with sub-activities). */
  const [deleteError, setDeleteError] = useState<string | null>(null);
  /** After version_conflict, drop patches until parent reloads (table parity). */
  const [awaitingCockpitReload, setAwaitingCockpitReload] = useState(false);
  /** Field keys edited since last PATCH — avoids re-PATCH on incidental blur. */
  const dirtyKeysRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    dirtyKeysRef.current = new Set();
    setDeleteError(null);
    setAwaitingCockpitReload(false);
  }, [selectedItem?.id]);

  /** Conflict lock clears when parent finishes TripCockpit reload. */
  useEffect(() => {
    setAwaitingCockpitReload(false);
  }, [reloadToken]);

  const empty = !selectedItem;
  /** Single empty cue title — do not also render competing "Start here" heading. */
  const title = empty ? "No activity selected" : selectedItem.activity;
  const meta = empty
    ? "Add under a day. Fields appear as you enrich."
    : [
        typeLabel(selectedItem.activityType),
        selectedItem.dayLabel,
        selectedItem.status,
      ]
        .filter(Boolean)
        .join(" · ");

  const fieldDefs = empty ? [] : fieldsToRail(selectedItem.activityType);
  const bag = selectedItem?.fieldBag ?? {};
  const cue = empty ? null : enrichCue(selectedItem.activityType);

  const canPatch = Boolean(
    selectedItem &&
      tripId &&
      sessionToken &&
      apiBaseUrl &&
      fetchImpl &&
      typeof selectedItem.version === "number" &&
      !awaitingCockpitReload,
  );

  function writeBag(key: string, value: string) {
    if (!selectedItem || !onFieldBagChange) return;
    if (!isBagKeyPersistable(selectedItem.activityType, key)) return;
    dirtyKeysRef.current.add(key);
    onFieldBagChange(selectedItem.id, { ...bag, [key]: value });
  }

  function commitRailField(
    key: string,
    value: string,
    opts?: { requireDirty?: boolean },
  ) {
    if (!selectedItem) return;
    if (!isBagKeyPersistable(selectedItem.activityType, key)) return;
    if (opts?.requireDirty && !dirtyKeysRef.current.has(key)) return;

    const nextBag = { ...bag, [key]: value };
    onFieldBagChange?.(selectedItem.id, nextBag);
    dirtyKeysRef.current.delete(key);

    if (!canPatch || !tripId || !sessionToken || !apiBaseUrl || !fetchImpl) {
      return;
    }
    const version = selectedItem.version;
    if (typeof version !== "number") return;

    const patch = softMapBagKeyToPatch({
      activityType: selectedItem.activityType,
      key,
      value,
      bag: nextBag,
      currentActivity: selectedItem.activity,
      currentDetails: selectedItem.details,
    });
    if (!patch) return;

    void patchItineraryItem(
      {
        tripId,
        itemId: selectedItem.id,
        sessionToken,
        expectedVersion: version,
        patch,
      },
      { fetch: fetchImpl, apiBaseUrl },
    ).then((outcome) => {
      if (outcome.ok) {
        onPatched?.(outcome.item);
        return;
      }
      if (outcome.code === "version_conflict") {
        setAwaitingCockpitReload(true);
        onCockpitReload?.();
      }
    });
  }

  function openConfirm() {
    setDeleteError(null);
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
    setDeleteError(null);
    try {
      const outcome = await deleteItineraryItem(
        { tripId, itemId, sessionToken },
        { fetch: fetchImpl, apiBaseUrl },
      );
      if (outcome.ok) {
        onRemoved?.(itemId);
      } else {
        setDeleteError(outcome.error);
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
      {empty ? null : (
        <>
          {deleteError ? (
            <p className="text-sm text-(--color-danger)" role="alert">
              {deleteError}
            </p>
          ) : null}
          <div className="panel ctx-cues">
            <h3>Soft cues</h3>
            <div className="cue missing">{cue}</div>
          </div>
          <div className="panel ctx-fields">
            <h3>Type fields (rail)</h3>
            <div className="field-grid">
              {/* Draft #rail-link — Resolve fills; place-cell Resolve OK; no fake paste API. */}
              <label>
                Map link
                <input
                  id="rail-link"
                  aria-label="Map link"
                  placeholder="Resolve to fill"
                  value=""
                  readOnly
                  className={FIELD_READONLY_CLASS}
                />
              </label>
              {fieldDefs.map((field) => {
                const value = bag[field.key] ?? "";
                const persistable = isBagKeyPersistable(
                  selectedItem.activityType,
                  field.key,
                );
                return (
                  <label key={field.key}>
                    {field.label}
                    {field.kind === "by" ? (
                      <select
                        value={value}
                        aria-label={field.label}
                        className={!persistable ? FIELD_READONLY_CLASS : undefined}
                        disabled={!persistable}
                        onChange={
                          persistable
                            ? (e) =>
                                commitRailField(field.key, e.target.value)
                            : undefined
                        }
                      >
                        {BY_OPTIONS.map((opt) => (
                          <option key={opt || "empty"} value={opt}>
                            {opt || "—"}
                          </option>
                        ))}
                      </select>
                    ) : field.kind === "meal" ? (
                      <select
                        value={value}
                        aria-label={field.label}
                        className={!persistable ? FIELD_READONLY_CLASS : undefined}
                        disabled={!persistable}
                        onChange={
                          persistable
                            ? (e) =>
                                commitRailField(field.key, e.target.value)
                            : undefined
                        }
                      >
                        {MEAL_OPTIONS.map((opt) => (
                          <option key={opt || "empty"} value={opt}>
                            {opt || "—"}
                          </option>
                        ))}
                      </select>
                    ) : field.kind === "stayAction" ? (
                      <select
                        value={value}
                        aria-label={field.label}
                        className={!persistable ? FIELD_READONLY_CLASS : undefined}
                        disabled={!persistable}
                        onChange={
                          persistable
                            ? (e) =>
                                commitRailField(field.key, e.target.value)
                            : undefined
                        }
                      >
                        {STAY_ACTION_OPTIONS.map((opt) => (
                          <option key={opt || "empty"} value={opt}>
                            {opt ? STAY_ACTION_LABEL[opt] || opt : "—"}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        value={value}
                        placeholder="optional"
                        aria-label={field.label}
                        className={!persistable ? FIELD_READONLY_CLASS : undefined}
                        readOnly={!persistable}
                        onChange={
                          persistable
                            ? (e) => writeBag(field.key, e.target.value)
                            : undefined
                        }
                        onBlur={
                          persistable
                            ? (e) =>
                                commitRailField(field.key, e.target.value, {
                                  requireDirty: true,
                                })
                            : undefined
                        }
                      />
                    )}
                  </label>
                );
              })}
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
