/**
 * Right context inspector — stop details when selected (T6).
 * Single empty cue when nothing selected (M81LW2UJ T5); type-shaped enrich
 * cues + quiet Remove (T6 #3). Draft Map link with Resolve-to-fill placeholder
 * when selected (honest — no fake paste API; place-cell Resolve OK).
 * T7 #1: type fields mirror the stop field bag (table + rail stay in sync).
 * M81DDKSC T4: mappable bag keys PATCH via soft-map; non-mappable stay read-only.
 * M82LQRZD T4 #1: empty rail (no selection) shows plan-check chrome — Run
 * check + idle/never/clean/stale copy — when `planCheckMode` is supplied
 * (plan-check-inspector-draft-v3.html). No full-plan finding queue here;
 * that lives with a selected stop (T5).
 */

"use client";

import { useEffect, useRef, useState } from "react";
import {
  deleteItineraryItem,
  patchItineraryItem,
} from "../../src/trip/itinerary-api";
import type { TripCockpitItineraryItem } from "../../src/trip/trip-cockpit-load";
import type {
  PatchPlanSuggestionOutcome,
  PlanSuggestionSummary,
} from "../../src/trip/plan-check-api";
import { acceptPlanSuggestion } from "../../src/trip/plan-check-apply";
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

/** Draft mode-idle/never/clean/stale sub copy (plan-check-inspector-draft-v3.html). */
const PLAN_CHECK_META_BY_MODE: Record<
  NonNullable<ItineraryContextRailProps["planCheckMode"]>,
  string
> = {
  idle: "Visible plan · rules check",
  stale: "Visible plan · stale results",
  never: "Visible plan · not checked yet",
  clean: "Visible plan · clean",
};
const RUN_CHECK_LABEL = "Run check";
const STALE_CUE_TEXT =
  "Plan changed since this check — cues may be out of date. Run check to refresh.";

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
  /**
   * Plan-check state for the empty rail (no stop selected). When set, the
   * rail shows plan-check chrome instead of the generic "No activity
   * selected" cue (M82LQRZD T4 #1). Undefined keeps the pre-existing empty
   * cue — full-plan triage page wiring lands separately.
   */
  planCheckMode?: "idle" | "never" | "clean" | "stale";
  /** Draft mode-idle summary count ("<N> checks on this plan — ..."). */
  planPendingCount?: number;
  /** Draft #run-check — always available on the empty rail. */
  onRunPlanCheck?: () => void;
  /**
   * Pending plan-check findings keyed by stop id (mirrors
   * SmartItineraryTable's `planCheckFindingsByStop`, M82LQRZD T3 #1) so a
   * future page can pass the same groupFindingsByStop output to both. When
   * selectedItem is set, findings for selectedItem.id render as a "Checks
   * for this stop" triage list (M82LQRZD T5 #1) — undefined keeps the rail
   * unchanged (no plan-check chrome on a selected stop).
   */
  planCheckFindingsByStop?: Record<string, PlanSuggestionSummary[]>;
  /**
   * Accept/Dismiss/Snooze on one finding's triage buttons. Parent owns the
   * actual PATCH /plan-suggestions/{id} call (T5 wiring only — this rail
   * does not itself call the API).
   */
  onPlanSuggestionTriage?: (args: {
    suggestionId: string;
    status: "accepted" | "dismissed" | "snoozed";
    expectedVersion: number;
    /** Snooze-only — ISO timestamp the suggestion resurfaces at. */
    snoozedUntil?: string;
  }) => PatchPlanSuggestionOutcome | Promise<PatchPlanSuggestionOutcome> | void;
  /**
   * Suggestion PATCH version_conflict channel — distinct from
   * onCockpitReload (itinerary-item PATCH conflicts). Parent reloads the
   * latest plan-check summary; this rail leaves the finding pending
   * (props-only findings — no local accept/dismiss mutation here, M82LQRZD
   * T5 #3).
   */
  onPlanCheckReload?: () => void;
  /**
   * Accept apply success — parent merges the returned suggestion into the
   * plan-check summary so pending cues/triage drop immediately (M82LQRZD).
   */
  onPlanSuggestionResolved?: (suggestion: PlanSuggestionSummary) => void;
};

/** Snooze horizon — resurface the suggestion a day out (draft default). */
const SNOOZE_DURATION_MS = 24 * 60 * 60 * 1000;

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
  planCheckMode,
  planPendingCount,
  onRunPlanCheck,
  planCheckFindingsByStop,
  onPlanSuggestionTriage,
  onPlanCheckReload,
  onPlanSuggestionResolved,
}: ItineraryContextRailProps) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [removing, setRemoving] = useState(false);
  /** Calm user-visible DELETE failure (e.g. block with sub-activities). */
  const [deleteError, setDeleteError] = useState<string | null>(null);
  /** After version_conflict, drop patches until parent reloads (table parity). */
  const [awaitingCockpitReload, setAwaitingCockpitReload] = useState(false);
  /** Field keys edited since last PATCH — avoids re-PATCH on incidental blur. */
  const dirtyKeysRef = useRef<Set<string>>(new Set());

  /**
   * dirtyKeysRef is a plain data ref (not render output), so its reset stays
   * in an effect — refs must not be mutated during render
   * (react-hooks/refs), only the setState calls below need to move out.
   */
  useEffect(() => {
    dirtyKeysRef.current = new Set();
  }, [selectedItem?.id]);

  /**
   * Reset error/conflict state on selection change — adjusted during render
   * (React "storing info from previous renders" pattern) instead of an
   * effect, since these resets must land before this render commits and
   * must not cascade an extra render (react-hooks/set-state-in-effect).
   */
  const [prevSelectedItemId, setPrevSelectedItemId] = useState(
    selectedItem?.id,
  );
  if (selectedItem?.id !== prevSelectedItemId) {
    setPrevSelectedItemId(selectedItem?.id);
    setDeleteError(null);
    setAwaitingCockpitReload(false);
  }

  /** Conflict lock clears when parent finishes TripCockpit reload. */
  const [prevReloadToken, setPrevReloadToken] = useState(reloadToken);
  if (reloadToken !== prevReloadToken) {
    setPrevReloadToken(reloadToken);
    setAwaitingCockpitReload(false);
  }

  const empty = !selectedItem;
  /**
   * Empty rail shows plan-check chrome instead of the generic empty cue
   * once a page wires planCheckMode (M82LQRZD T4 #1). No mode = the
   * pre-existing single empty cue (M81LW2UJ T5).
   */
  const showPlanCheckEmpty = empty && planCheckMode !== undefined;
  /** Single empty cue title — do not also render competing "Start here" heading. */
  const title = showPlanCheckEmpty
    ? "Plan check"
    : empty
      ? "No activity selected"
      : selectedItem.activity;
  const meta = showPlanCheckEmpty
    ? PLAN_CHECK_META_BY_MODE[planCheckMode]
    : empty
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
  /** This stop's pending findings only — a sibling stop's must not leak in. */
  const stopFindings = selectedItem
    ? planCheckFindingsByStop?.[selectedItem.id]
    : undefined;

  async function triage(
    suggestion: PlanSuggestionSummary,
    status: "accepted" | "dismissed" | "snoozed",
    snoozedUntil?: string,
  ) {
    const outcome = await onPlanSuggestionTriage?.({
      suggestionId: suggestion.id,
      status,
      expectedVersion: suggestion.version,
      ...(status === "snoozed" && snoozedUntil
        ? { snoozedUntil }
        : {}),
    });
    if (outcome && !outcome.ok && outcome.code === "version_conflict") {
      onPlanCheckReload?.();
    }
  }

  /**
   * Accept — prefers the apply path (acceptPlanSuggestion) over the plain
   * status-only triage() path once tripId/sessionToken/apiBaseUrl/fetch deps
   * are available, so a safe { itemId, patch } action_payload PATCHes the
   * itinerary item before the suggestion PATCH (M82LQRZD T6). Dismiss/Snooze
   * never call acceptPlanSuggestion — they always use triage() above.
   * On an item-side version_conflict, the item PATCH never ran to
   * completion — the suggestion is left pending (not marked accepted) and
   * onCockpitReload fires (parity with commitRailField). On a
   * suggestion-side version_conflict, onPlanCheckReload fires instead.
   * Falls back to triage() (accepted) when the apply-path deps are missing —
   * the parent then owns the PATCH itself, matching the pre-existing
   * behavior for pages that only wire onPlanSuggestionTriage.
   */
  async function acceptFinding(suggestion: PlanSuggestionSummary) {
    if (!(tripId && sessionToken && apiBaseUrl && fetchImpl)) {
      await triage(suggestion, "accepted");
      return;
    }

    const outcome = await acceptPlanSuggestion(
      {
        tripId,
        sessionToken,
        suggestion,
        ...(typeof selectedItem?.version === "number"
          ? { itemExpectedVersion: selectedItem.version }
          : {}),
      },
      { fetch: fetchImpl, apiBaseUrl },
    );

    if (outcome.ok) {
      if (outcome.appliedItemPatch && outcome.item) {
        onPatched?.(outcome.item);
      }
      // Drop the finding from pending UI (parent merges status into summary).
      onPlanSuggestionResolved?.(outcome.suggestion);
      return;
    }

    if (outcome.code === "version_conflict") {
      if (outcome.stage === "item") {
        onCockpitReload?.();
      } else {
        onPlanCheckReload?.();
      }
    }
  }

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
        {showPlanCheckEmpty ? (
          <button
            type="button"
            id="run-check"
            className="btn-run"
            onClick={onRunPlanCheck}
          >
            {RUN_CHECK_LABEL}
          </button>
        ) : !empty ? (
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
      {showPlanCheckEmpty ? (
        <div className="panel plan-check-empty">
          {planCheckMode === "idle" || planCheckMode === "stale" ? (
            <>
              {planCheckMode === "idle" ? (
                <p className="summary">
                  <em>
                    {planPendingCount ?? 0} check
                    {planPendingCount === 1 ? "" : "s"}
                  </em>{" "}
                  on this plan — open a stop with a cue to triage.
                </p>
              ) : (
                <p className="stale-cue" role="status" aria-live="polite">
                  {STALE_CUE_TEXT}
                </p>
              )}
              <div className="empty-block">
                <strong>Select a stop to review</strong>
                <p>
                  Inline cues mark issues on the table. Triage and edit stay
                  together in this rail.
                </p>
              </div>
            </>
          ) : planCheckMode === "never" ? (
            <div className="empty-block">
              <strong>No plan check yet</strong>
              <p>
                Run check to mark missing times, lodging details, and travel
                gaps on the stops.
              </p>
            </div>
          ) : (
            <div className="empty-block">
              <strong>No suggestions right now</strong>
              <p>
                Latest check found nothing to triage. Run check again after
                you edit the itinerary.
              </p>
            </div>
          )}
        </div>
      ) : empty ? null : (
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
          {stopFindings ? (
            <div className="panel ctx-checks">
              <h3>Checks for this stop</h3>
              {stopFindings.length === 0 ? (
                <p>No pending checks for this stop.</p>
              ) : (
                <ul className="queue-list">
                  {stopFindings.map((finding) => (
                    <li
                      key={finding.id}
                      className="finding"
                      data-severity={finding.severity}
                    >
                      <div className="finding-top">
                        <span className="sev">{finding.severity}</span>
                      </div>
                      <p className="finding-explain">
                        {finding.explanation.en}
                      </p>
                      <p className="finding-action">
                        {finding.recommendedAction.en}
                      </p>
                      <div className="triage">
                        <button
                          type="button"
                          className="btn-triage accept"
                          onClick={() => void acceptFinding(finding)}
                        >
                          Accept
                        </button>
                        <button
                          type="button"
                          className="btn-triage"
                          onClick={() => triage(finding, "dismissed")}
                        >
                          Dismiss
                        </button>
                        <button
                          type="button"
                          className="btn-triage"
                          onClick={() =>
                            triage(
                              finding,
                              "snoozed",
                              new Date(
                                Date.now() + SNOOZE_DURATION_MS,
                              ).toISOString(),
                            )
                          }
                        >
                          Snooze
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ) : null}
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
