"use client";

/**
 * Day timeline — Theme A Calm Travel Ops collapsible stop cards (M80VKAX5 T3–T5).
 * Landmarks from day-workspace-theme-a-draft-v9: Day timeline / details.stop /
 * Activity type picker / Type setup from shared typeFieldDefs.
 * T4: day-scoped create / patch / reorder / delete via itinerary-api.
 * T5: time-block column + Edit time dialog; selection drives Details.
 */

import { useEffect, useId, useRef, useState } from "react";
import {
  createItineraryItem,
  deleteItineraryItem,
  patchItineraryItem,
  reorderItineraryItems,
  type ItineraryItemPatchFields,
} from "../../src/trip/itinerary-api";
import type { DayPlanAssistOption } from "../../src/trip/day-plan-assist-api";
import {
  BY_OPTIONS,
  MEAL_OPTIONS,
  STAY_ACTION_LABEL,
  STAY_ACTION_OPTIONS,
  seedFieldBag,
  typeFieldDefs,
  type StopFieldBag,
  type TypeFieldDef,
} from "../../src/trip/itinerary-type-fields";
import { DayAiPlanDialog } from "./DayAiPlanDialog";
import { DayAiSuggestionChip } from "./DayAiSuggestionChip";
import { DayTimeEditDialog, durLabel } from "./DayTimeEditDialog";
/** Locked day-editor picker set (includes Note — day matrix). */
const PICKER_TYPES = [
  { activityType: "travel", label: "Travel" },
  { activityType: "food", label: "Food" },
  { activityType: "shopping", label: "Shopping" },
  { activityType: "attraction", label: "Attraction" },
  { activityType: "experience", label: "Experience" },
  { activityType: "stay", label: "Stay" },
  { activityType: "note", label: "Note" },
] as const;

const TYPE_LABEL: Record<string, string> = Object.fromEntries(
  PICKER_TYPES.map((t) => [t.activityType, t.label]),
);

const ADD_STOP_LABEL = "+ Add stop";
const REMOVE_LABEL = "Remove";
const DELETE_DIALOG_TITLE = "Delete activity";
const DELETE_CONFIRM_ACTION = "Delete";
const CANCEL_LABEL = "Cancel";
const DELETE_DIALOG_TITLE_ID = "day-timeline-delete-dlg-title";

/** Default create payload for day-editor "+ Add stop". */
const CREATE_ACTIVITY = "New stop";
const CREATE_ACTIVITY_TYPE = "note";
const CREATE_PLACE = "";

/** Test + production seam: detail `{ day, itemIds }` commits active-day order. */
const DAY_TIMELINE_REORDER_EVENT = "joii:day-timeline-reorder";

type DayTimelineReorderDetail = {
  day?: unknown;
  itemIds?: unknown;
};

export type DayTimelineStop = {
  id: string;
  activity: string;
  activityType: string;
  place: string;
  /** Optimistic concurrency — required for PATCH. */
  version?: number;
  startTime?: string;
  endTime?: string | null;
  timezone?: string;
  timezoneLabel?: string;
  note?: string;
  status?: string;
};

/** Inline AI chip under a related stop (outside details.stop). */
export type DayTimelineAiSuggestion = {
  relatedStopId: string;
  batchId: string;
  option: DayPlanAssistOption;
  /** Chip heading title (may differ from option.title used in the dialog). */
  chipTitle?: string;
  affectLabels?: string[];
  subtitle?: string;
};

export type DayTimelineProps = {
  stops: DayTimelineStop[];
  tripId?: string;
  planVariantId?: string;
  day?: string;
  sessionToken?: string;
  apiBaseUrl?: string;
  fetch?: typeof fetch;
  reorderEnabled?: boolean;
  /** Currently selected stop id (drives DayStopDetails). */
  selectedStopId?: string | null;
  /** Stop card / time interaction → select for Details panel. */
  onSelectStop?: (stop: DayTimelineStop) => void;
  /**
   * Parent reloads TripCockpit after version_conflict.
   * Further patches stay blocked until authoritative state returns.
   */
  onCockpitReload?: () => void;
  /** Open day-plan-assist options as compact chips under related stops. */
  aiSuggestions?: DayTimelineAiSuggestion[];
  /** Parent updates open batch after Accept/Reject. */
  onAiBatchResolved?: (result: {
    batchId: string;
    openOptionIds: string[];
  }) => void;
};

function activityTypeLabel(activityType: string): string {
  return TYPE_LABEL[activityType] ?? "Type";
}

/** Calm Travel Ops type-setup field chrome (draft .stop-setup). */
const SETUP_LABEL_CLASS =
  "mb-1 block text-[11px] font-semibold text-(--color-text-muted)";
const SETUP_CONTROL_CLASS =
  "h-10 w-full rounded-[var(--radius-sm)] border border-(--color-border) bg-(--color-surface) px-2.5 text-[13px] text-(--color-text) outline-none focus:border-(--color-primary) focus:shadow-[0_0_0_3px_rgba(15,118,110,0.18)]";

function SetupField({
  field,
  value,
  onChange,
  onBlurCommit,
}: {
  field: TypeFieldDef;
  value: string;
  onChange: (key: string, value: string) => void;
  onBlurCommit?: (key: string, value: string) => void;
}) {
  const id = useId();
  const controlId = `${id}-${field.key}`;

  if (field.kind === "by") {
    return (
      <div>
        <label className={SETUP_LABEL_CLASS} htmlFor={controlId}>
          {field.label}
        </label>
        <select
          id={controlId}
          className={SETUP_CONTROL_CLASS}
          aria-label={field.label}
          value={value}
          onChange={(e) => onChange(field.key, e.target.value)}
          onBlur={(e) => onBlurCommit?.(field.key, e.target.value)}
        >
          {BY_OPTIONS.map((opt) => (
            <option key={opt || "empty"} value={opt}>
              {opt || "—"}
            </option>
          ))}
        </select>
      </div>
    );
  }

  if (field.kind === "meal") {
    return (
      <div>
        <label className={SETUP_LABEL_CLASS} htmlFor={controlId}>
          {field.label}
        </label>
        <select
          id={controlId}
          className={SETUP_CONTROL_CLASS}
          aria-label={field.label}
          value={value}
          onChange={(e) => onChange(field.key, e.target.value)}
          onBlur={(e) => onBlurCommit?.(field.key, e.target.value)}
        >
          {MEAL_OPTIONS.map((opt) => (
            <option key={opt || "empty"} value={opt}>
              {opt || "—"}
            </option>
          ))}
        </select>
      </div>
    );
  }

  if (field.kind === "stayAction") {
    return (
      <div>
        <label className={SETUP_LABEL_CLASS} htmlFor={controlId}>
          {field.label}
        </label>
        <select
          id={controlId}
          className={SETUP_CONTROL_CLASS}
          aria-label={field.label}
          value={value}
          onChange={(e) => onChange(field.key, e.target.value)}
          onBlur={(e) => onBlurCommit?.(field.key, e.target.value)}
        >
          {STAY_ACTION_OPTIONS.map((opt) => (
            <option key={opt || "empty"} value={opt}>
              {opt ? STAY_ACTION_LABEL[opt] || opt : "—"}
            </option>
          ))}
        </select>
      </div>
    );
  }

  return (
    <div>
      <label className={SETUP_LABEL_CLASS} htmlFor={controlId}>
        {field.label}
      </label>
      <input
        id={controlId}
        className={SETUP_CONTROL_CLASS}
        type="text"
        aria-label={field.label}
        value={value}
        placeholder={field.placeholder ?? field.label}
        autoComplete="off"
        onChange={(e) => onChange(field.key, e.target.value)}
        onBlur={(e) => onBlurCommit?.(field.key, e.target.value)}
      />
    </div>
  );
}

function TimelineStopCard({
  stop,
  selected,
  isFirst,
  isLast,
  canPatch,
  onPatch,
  onRemove,
  onSelect,
  onEditTime,
}: {
  stop: DayTimelineStop;
  selected: boolean;
  isFirst: boolean;
  isLast: boolean;
  canPatch: boolean;
  onPatch: (patch: ItineraryItemPatchFields) => void;
  onRemove: () => void;
  onSelect: () => void;
  onEditTime: () => void;
}) {
  const [activityType, setActivityType] = useState(stop.activityType);
  const [fieldBag, setFieldBag] = useState<StopFieldBag>(() =>
    seedFieldBag(stop),
  );
  const [typeMenuOpen, setTypeMenuOpen] = useState(false);

  const typeLabel = activityTypeLabel(activityType);
  const fieldDefs = typeFieldDefs(activityType);
  const startTime = stop.startTime?.trim() || "";
  const endTime = stop.endTime?.trim() || "";
  const tzLabel =
    stop.timezoneLabel?.trim() || stop.timezone?.trim() || "";
  const duration = startTime && endTime ? durLabel(startTime, endTime) : "";
  const hasEnd = Boolean(endTime);
  const typeNodeClass = PICKER_TYPES.some((t) => t.activityType === activityType)
    ? activityType
    : "unset";

  function updateBag(key: string, value: string) {
    setFieldBag((prev) => ({ ...prev, [key]: value }));
  }

  function commitBagKey(key: string, value: string) {
    setFieldBag((prev) => ({ ...prev, [key]: value }));
    if (!canPatch) return;
    // Soft map to documented top-level PATCH fields (same as table).
    if (key === "place") {
      if (value !== stop.place) onPatch({ place: value });
    }
  }

  function selectType(nextType: string) {
    setTypeMenuOpen(false);
    if (nextType === activityType) return;
    setActivityType(nextType);
    if (canPatch) onPatch({ activityType: nextType });
  }

  return (
    <div
      className={`timeline-row grid grid-cols-[4.5rem_1rem_minmax(0,1fr)] items-start gap-2 ${selected ? "selected" : ""}`}
    >
      <button
        type="button"
        className={`time-block${hasEnd ? "" : " no-end"}`}
        style={{ textAlign: "center" }}
        aria-haspopup="dialog"
        aria-label={`Edit time for ${stop.activity}`}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onSelect();
          onEditTime();
        }}
      >
        <span className="t-start block text-[12px] font-semibold tabular-nums text-(--color-text)">
          {startTime || "—"}
        </span>
        <span
          className="t-sep block text-[9px] font-medium text-(--color-text-subtle)"
          aria-hidden="true"
        >
          ~
        </span>
        <span className="t-end block text-[12px] font-medium tabular-nums text-(--color-text-muted)">
          {endTime}
        </span>
        <span className="t-dur block text-[10px] tabular-nums text-(--color-text-subtle)">
          {duration}
        </span>
        <span className="t-tz block text-[9px] font-semibold tracking-wide text-(--color-route, var(--color-primary))">
          {tzLabel}
        </span>
      </button>

      <div className="dotline" aria-hidden="true">
        {!isFirst ? <span className="spine top" /> : null}
        <i
          className={`type-node ${typeNodeClass}`}
          data-type={activityType}
        />
        {!isLast ? <span className="spine bot" /> : null}
      </div>

      <details
        className="stop min-w-0"
        data-stop-id={stop.id}
        onClick={() => onSelect()}
      >
        <summary className="flex cursor-pointer list-none items-start gap-2 py-2">
          <span
            className="chev shrink-0 text-(--color-text-muted)"
            aria-hidden="true"
          >
            ▸
          </span>
          <div className="stop-sum-main min-w-0 flex-1">
            <strong className="block text-sm font-semibold text-(--color-text)">
              {stop.activity}
            </strong>
            <p className="place m-0 text-[12px] text-(--color-text-muted)">
              {stop.place}
            </p>
          </div>
          <div className="stop-top-right flex shrink-0 items-start gap-2">
            <div className="type-wrap relative">
              <button
                type="button"
                className={`type-btn ${activityType} rounded-md border border-(--color-border) bg-(--color-surface) px-2 py-1 text-[12px] font-medium text-(--color-text)`}
                data-type-trigger=""
                aria-haspopup="listbox"
                aria-expanded={typeMenuOpen}
                aria-label="Activity type"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onSelect();
                  setTypeMenuOpen((open) => !open);
                }}
              >
                {typeLabel} ▾
              </button>
              {typeMenuOpen ? (
                <ul
                  className="type-menu absolute right-0 z-10 mt-1 min-w-[9rem] rounded-md border border-(--color-border) bg-(--color-surface) py-1 shadow-sm"
                  role="listbox"
                  aria-label="Activity type"
                >
                  {PICKER_TYPES.map(({ activityType: type, label }) => (
                    <li key={type} role="none">
                      <button
                        type="button"
                        role="option"
                        aria-selected={type === activityType}
                        className="block w-full px-3 py-1.5 text-left text-[12px] text-(--color-text) hover:bg-(--color-surface-muted)"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          selectType(type);
                        }}
                      >
                        {label}
                      </button>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
            <button
              type="button"
              className="btn-quiet-danger text-[12px] text-(--color-danger, #b91c1c)"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onRemove();
              }}
            >
              {REMOVE_LABEL}
            </button>
          </div>
        </summary>

        <div
          className="stop-setup mt-2 grid gap-2 border-t border-(--color-border) pt-3 sm:grid-cols-2"
          aria-label="Type setup"
          data-activity-type={activityType}
          role="group"
        >
          {fieldDefs.map((field) => (
            <SetupField
              key={field.key}
              field={field}
              value={fieldBag[field.key] ?? ""}
              onChange={updateBag}
              onBlurCommit={commitBagKey}
            />
          ))}
        </div>
      </details>
    </div>
  );
}

/** Stable default — inline `[]` would retrigger the sync effect every render. */
const EMPTY_AI_SUGGESTIONS: DayTimelineAiSuggestion[] = [];

/**
 * Active-day stop list as expand/collapse type-correct cards + day CRUD.
 */
export function DayTimeline({
  stops,
  tripId,
  planVariantId,
  day,
  sessionToken,
  apiBaseUrl = "",
  fetch: fetchImpl = fetch,
  reorderEnabled = false,
  selectedStopId = null,
  onSelectStop,
  onCockpitReload,
  aiSuggestions = EMPTY_AI_SUGGESTIONS,
  onAiBatchResolved,
}: DayTimelineProps) {
  const timelineRef = useRef<HTMLElement>(null);
  const [localStops, setLocalStops] = useState(stops);
  const [awaitingCockpitReload, setAwaitingCockpitReload] = useState(false);
  const [creating, setCreating] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<DayTimelineStop | null>(
    null,
  );
  const [removing, setRemoving] = useState(false);
  const [timeEditStop, setTimeEditStop] = useState<DayTimelineStop | null>(
    null,
  );
  const [openSuggestionKey, setOpenSuggestionKey] = useState<string | null>(
    null,
  );
  const [localAiSuggestions, setLocalAiSuggestions] = useState(aiSuggestions);

  // Re-sync local copies when the incoming props change identity, adjusting
  // state during render (React's documented pattern) instead of an effect —
  // avoids the extra commit a setState-in-effect would cause.
  const [prevAiSuggestions, setPrevAiSuggestions] = useState(aiSuggestions);
  if (aiSuggestions !== prevAiSuggestions) {
    setPrevAiSuggestions(aiSuggestions);
    setLocalAiSuggestions(aiSuggestions);
  }

  const openSuggestion =
    localAiSuggestions.find(
      (s) => `${s.batchId}:${s.option.id}` === openSuggestionKey,
    ) ?? null;

  const [prevStops, setPrevStops] = useState(stops);
  if (stops !== prevStops) {
    setPrevStops(stops);
    setLocalStops(stops);
    setAwaitingCockpitReload(false);
  }

  const canMutate = Boolean(tripId && sessionToken && planVariantId && day);
  const canPatch = canMutate && !awaitingCockpitReload;

  function commitPatch(stop: DayTimelineStop, patch: ItineraryItemPatchFields) {
    if (!tripId || !sessionToken || awaitingCockpitReload) return;
    if (typeof stop.version !== "number") return;
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
      if (!outcome.ok && outcome.code === "version_conflict") {
        setAwaitingCockpitReload(true);
        onCockpitReload?.();
      }
    });
  }

  function commitAddStop() {
    if (!tripId || !sessionToken || !planVariantId || !day || creating) return;
    setCreating(true);
    void createItineraryItem(
      {
        tripId,
        sessionToken,
        planVariantId,
        day,
        activity: CREATE_ACTIVITY,
        activityType: CREATE_ACTIVITY_TYPE,
        place: CREATE_PLACE,
      },
      { fetch: fetchImpl, apiBaseUrl },
    )
      .then((outcome) => {
        if (outcome.ok) {
          setLocalStops((prev) => [
            ...prev,
            {
              id: outcome.item.id,
              activity: outcome.item.activity,
              activityType: outcome.item.activityType,
              place: outcome.item.place,
              version: outcome.item.version,
              startTime: outcome.item.startTime,
              endTime: outcome.item.endTime,
              status: outcome.item.status,
            },
          ]);
        }
      })
      .finally(() => setCreating(false));
  }

  function commitReorder(orderDay: string, itemIds: string[]) {
    if (!tripId || !sessionToken || !planVariantId || itemIds.length === 0) {
      return;
    }
    void reorderItineraryItems(
      {
        tripId,
        sessionToken,
        planVariantId,
        day: orderDay,
        itemIds,
      },
      { fetch: fetchImpl, apiBaseUrl },
    );
  }

  async function confirmDelete() {
    if (!pendingDelete || !tripId || !sessionToken || removing) return;
    const itemId = pendingDelete.id;
    setPendingDelete(null);
    setRemoving(true);
    try {
      const outcome = await deleteItineraryItem(
        { tripId, itemId, sessionToken },
        { fetch: fetchImpl, apiBaseUrl },
      );
      if (outcome.ok) {
        setLocalStops((prev) => prev.filter((s) => s.id !== itemId));
      }
    } finally {
      setRemoving(false);
    }
  }

  useEffect(() => {
    const el = timelineRef.current;
    if (!el || !reorderEnabled) return;
    const onReorder = (event: Event) => {
      const detail = (event as CustomEvent<DayTimelineReorderDetail>).detail;
      const orderDay =
        detail && typeof detail.day === "string" ? detail.day.trim() : "";
      const rawIds = detail?.itemIds;
      if (!orderDay || !Array.isArray(rawIds)) return;
      // Active-day scope only — drop ids that are not on this timeline.
      const dayIdSet = new Set(localStops.map((s) => s.id));
      const itemIds = rawIds.filter(
        (id): id is string =>
          typeof id === "string" && id.length > 0 && dayIdSet.has(id),
      );
      if (itemIds.length === 0) return;
      commitReorder(orderDay, itemIds);
    };
    el.addEventListener(DAY_TIMELINE_REORDER_EVENT, onReorder);
    return () => el.removeEventListener(DAY_TIMELINE_REORDER_EVENT, onReorder);
    // Rebind when mutation deps or day scope change.
  }, [
    reorderEnabled,
    tripId,
    sessionToken,
    planVariantId,
    day,
    fetchImpl,
    apiBaseUrl,
    localStops,
  ]);

  return (
    <section
      ref={timelineRef}
      className="day-timeline"
      aria-label="Day timeline"
    >
      <ul className="timeline m-0 flex list-none flex-col gap-1 p-0">
        {localStops.map((stop, index) => {
          const stopSuggestions = localAiSuggestions.filter(
            (s) => s.relatedStopId === stop.id,
          );
          return (
            <li key={stop.id} className="min-w-0">
              <TimelineStopCard
                stop={stop}
                selected={selectedStopId === stop.id}
                isFirst={index === 0}
                isLast={index === localStops.length - 1}
                canPatch={canPatch}
                onPatch={(patch) => commitPatch(stop, patch)}
                onRemove={() => setPendingDelete(stop)}
                onSelect={() => onSelectStop?.(stop)}
                onEditTime={() => setTimeEditStop(stop)}
              />
              {stopSuggestions.map((suggestion) => (
                <DayAiSuggestionChip
                  key={`${suggestion.batchId}:${suggestion.option.id}`}
                  option={{
                    id: suggestion.option.id,
                    label: suggestion.option.label,
                    title: suggestion.chipTitle ?? suggestion.option.title,
                    summary: suggestion.option.summary,
                  }}
                  onOpen={() =>
                    setOpenSuggestionKey(
                      `${suggestion.batchId}:${suggestion.option.id}`,
                    )
                  }
                />
              ))}
            </li>
          );
        })}
      </ul>

      <button
        type="button"
        className="add-stop mt-3 rounded-md border border-(--color-border) bg-(--color-surface) px-3 py-2 text-[13px] font-medium text-(--color-text)"
        disabled={!canMutate || creating}
        onClick={() => commitAddStop()}
      >
        {ADD_STOP_LABEL}
      </button>

      {timeEditStop &&
      tripId &&
      sessionToken &&
      typeof timeEditStop.version === "number" ? (
        <DayTimeEditDialog
          open
          stop={{
            id: timeEditStop.id,
            activity: timeEditStop.activity,
            startTime: timeEditStop.startTime ?? "",
            endTime: timeEditStop.endTime ?? "",
            timezone: timeEditStop.timezone,
            timezoneLabel: timeEditStop.timezoneLabel,
            version: timeEditStop.version,
          }}
          tripId={tripId}
          sessionToken={sessionToken}
          apiBaseUrl={apiBaseUrl}
          fetch={fetchImpl}
          onClose={() => setTimeEditStop(null)}
          onCockpitReload={onCockpitReload}
          onSaved={({ startTime, endTime }) => {
            setLocalStops((prev) =>
              prev.map((s) =>
                s.id === timeEditStop.id
                  ? { ...s, startTime, endTime, version: (s.version ?? 0) + 1 }
                  : s,
              ),
            );
          }}
        />
      ) : null}

      {openSuggestion && tripId && sessionToken ? (
        <DayAiPlanDialog
          open
          tripId={tripId}
          batchId={openSuggestion.batchId}
          sessionToken={sessionToken}
          apiBaseUrl={apiBaseUrl}
          fetch={fetchImpl}
          option={openSuggestion.option}
          batchOptions={localAiSuggestions
            .filter((s) => s.batchId === openSuggestion.batchId)
            .map((s) => s.option)}
          affectLabels={openSuggestion.affectLabels ?? []}
          subtitle={openSuggestion.subtitle}
          onClose={() => setOpenSuggestionKey(null)}
          onBatchResolved={({ openOptionIds }) => {
            const batchId = openSuggestion.batchId;
            setLocalAiSuggestions((prev) =>
              prev.filter(
                (s) =>
                  s.batchId !== batchId ||
                  openOptionIds.includes(s.option.id),
              ),
            );
            setOpenSuggestionKey(null);
            onAiBatchResolved?.({ batchId, openOptionIds });
          }}
        />
      ) : null}

      {pendingDelete ? (
        <div className="stop-dlg">
          <div
            className="stop-dlg-backdrop"
            onClick={() => setPendingDelete(null)}
          />
          <div
            className="stop-dlg-card"
            role="dialog"
            aria-modal="true"
            aria-labelledby={DELETE_DIALOG_TITLE_ID}
          >
            <h3 id={DELETE_DIALOG_TITLE_ID}>{DELETE_DIALOG_TITLE}</h3>
            <p className="stop-dlg-confirm">
              {`Remove "${pendingDelete.activity}" from the plan?`}
            </p>
            <div className="stop-dlg-foot">
              <button type="button" onClick={() => setPendingDelete(null)}>
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
    </section>
  );
}
