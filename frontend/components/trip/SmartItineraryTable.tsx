/**
 * Smart Itinerary Table — day spine + stop rows (time rail | body).
 * Phase-1 composition matches itinerary-plan-draft-v1 landmarks (T3 #2–#3).
 * T4 #1–#3: Quick-only add → POST create → append summary / calm draft error.
 * T5 #1: inline blur/commit → PATCH itinerary-items/{itemId} + expectedVersion.
 * T5 #2: version_conflict → onCockpitReload; block patches until model reloads.
 * T5 reorder: joii:plan-day-reorder / DnD drop → PATCH itinerary-items/order.
 * T7 #1: type-shaped field bag (renderTypeFields / syncFieldsFromType).
 * T7 #2: Food Meal + Travel By choice-chips on .title-with-meta → PATCH.
 * T7 #3: Note / Link / Time setup dialogs → same item PATCH (no parallel backends).
 */

"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  createItineraryItem,
  patchItineraryItem,
  reorderItineraryItems,
  type ItineraryItemPatchFields,
} from "../../src/trip/itinerary-api";
import {
  BY_OPTIONS,
  MEAL_OPTIONS,
  activitySummaryFromBag,
  seedFieldBag,
  typeFieldDefs,
  type StopFieldBag,
} from "../../src/trip/itinerary-type-fields";
import type { TripCockpitItineraryItem } from "../../src/trip/trip-cockpit-load";
import type {
  ItineraryTableChildStop,
  ItineraryTableModel,
  ItineraryTableStop,
} from "../../src/trip/itinerary-table-model";

/** Draft SUBPLAN_CHEVRON — expands/collapses nested sub-activity tree. */
const SUBPLAN_CHEVRON = (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M6 9l6 6 6-6" />
  </svg>
);

/** Draft choice-chip chevron (same path as SUBPLAN_CHEVRON). */
const CHOICE_CHIP_CHEVRON = SUBPLAN_CHEVRON;

/** Draft openStopDialog / openTimeSetupDialog action icons. */
const NOTE_ACTION_ICON = (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M7 3h7l5 5v13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z" />
    <path d="M14 3v5h5M9 13h6M9 17h4" />
  </svg>
);
const LINK_ACTION_ICON = (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M10 13a5 5 0 0 0 7.07 0l1.41-1.41a5 5 0 0 0-7.07-7.07L10 5.93" />
    <path d="M14 11a5 5 0 0 0-7.07 0L5.52 12.4a5 5 0 0 0 7.07 7.07L14 18.07" />
  </svg>
);
const TIME_SETUP_ICON = (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3.5 2" />
  </svg>
);

type StopDialogMode = "note" | "link" | "time-setup";

const STOP_DIALOG_TITLE: Record<StopDialogMode, string> = {
  note: "Note",
  link: "Link",
  "time-setup": "Time setup",
};

/** Test + production seam: detail `{ day, itemIds }` commits Plan Day order. */
const PLAN_DAY_REORDER_EVENT = "joii:plan-day-reorder";

type PlanDayReorderDetail = {
  day?: unknown;
  itemIds?: unknown;
};

/** Stop summary handed to the parent for context-rail selection (T6 #1). */
export type SmartItinerarySelectPayload = {
  id: string;
  activity: string;
  activityType: string;
  status: string;
  dayLabel: string;
  /** Per-stop type field bag (T7 #1). */
  fieldBag: StopFieldBag;
};

export type SmartItineraryTableProps = {
  model: ItineraryTableModel;
  /** Trip id for itinerary create/patch (T4 #2 / T5 #1). */
  tripId?: string;
  sessionToken?: string;
  apiBaseUrl?: string;
  fetch?: typeof fetch;
  /**
   * Parent reloads TripCockpit after version_conflict (T5 #2).
   * Further patches stay blocked until authoritative state returns.
   */
  onCockpitReload?: () => void;
  /** Currently selected stop id (tonal `.selected` style). */
  selectedId?: string | null;
  /** Row click → select payload (parent toggles / clears). */
  onSelect?: (item: SmartItinerarySelectPayload) => void;
  /**
   * Type / field-bag changes on a stop (no toggle) so the rail stays aligned
   * while the row remains selected (T7 #1).
   */
  onInspectChange?: (item: SmartItinerarySelectPayload) => void;
  /** External bag write (rail → table) for the selected stop. */
  fieldBagById?: Record<string, StopFieldBag>;
  /** Command-bar Reorder — when true, render draft `.day-drag` / `.stop-drag` grips. */
  reorderEnabled?: boolean;
};

/** Cockpit summary may carry endTime for the time rail (not on typed load subset yet). */
type ItemWithEnd = TripCockpitItineraryItem & { endTime?: string };

/** Draft TYPE_LABEL picker set (API `default` maps to unset/"Type"). */
const PICKER_TYPE_LIST = [
  "travel",
  "food",
  "shopping",
  "attraction",
  "experience",
  "stay",
] as const;

const PICKER_TYPES = new Set<string>(PICKER_TYPE_LIST);

/** localStorage key for per-trip collapsed Plan Day ISO dates (T4 #1). */
const COLLAPSED_DAYS_STORAGE_PREFIX = "joii.itinerary.collapsedDays.";

function collapsedDaysStorageKey(tripId: string): string {
  return `${COLLAPSED_DAYS_STORAGE_PREFIX}${tripId}`;
}

function readCollapsedDays(tripId: string | undefined): Set<string> {
  if (!tripId || typeof window === "undefined") return new Set();
  try {
    const raw = window.localStorage.getItem(collapsedDaysStorageKey(tripId));
    if (!raw) return new Set();
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return new Set();
    return new Set(
      parsed.filter((day): day is string => typeof day === "string"),
    );
  } catch {
    return new Set();
  }
}

function writeCollapsedDays(
  tripId: string | undefined,
  days: Set<string>,
): void {
  if (!tripId || typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      collapsedDaysStorageKey(tripId),
      JSON.stringify([...days]),
    );
  } catch {
    // Quota / private mode — collapse still works in-session.
  }
}

const TYPE_LABEL: Record<string, string> = {
  travel: "Travel",
  food: "Food",
  stay: "Stay",
  attraction: "Attraction",
  experience: "Experience",
  shopping: "Shopping",
  unset: "Type",
};

/** Draft TYPE_ICON — 24×24 stroke SVGs (CSS: stroke currentColor, fill none). */
const TYPE_ICON: Record<string, ReactNode> = {
  travel: (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M22 2 11 13" />
      <path d="m22 2-7 20-4-9-9-4 20-7z" />
    </svg>
  ),
  food: (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M3 2v7a2 2 0 0 0 2 2h0" />
      <path d="M7 2v20" />
      <path d="M21 15V2a5 5 0 0 0-5 5v6a2 2 0 0 0 2 2h3" />
      <path d="M21 15v7" />
    </svg>
  ),
  stay: (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M2 20V10a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v10" />
      <path d="M4 8V6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v2" />
      <path d="M12 4v6" />
      <path d="M2 18h20" />
    </svg>
  ),
  attraction: (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M3 21h18" />
      <path d="M5 21V10l7-6 7 6v11" />
      <path d="M9 21v-6h6v6" />
      <circle cx="10" cy="10" r="0.8" />
      <circle cx="14" cy="10" r="0.8" />
    </svg>
  ),
  experience: (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="2" y="7" width="20" height="13" rx="2" />
      <path d="M12 2v5" />
      <path d="M8 2v2" />
      <path d="M16 2v2" />
      <path d="M2 13h20" />
    </svg>
  ),
  shopping: (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
      <path d="M3 6h18" />
      <path d="M16 10a4 4 0 0 1-8 0" />
    </svg>
  ),
  unset: (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 8v8" />
      <path d="M8 12h8" />
    </svg>
  ),
};

function typeIcon(type: string): ReactNode {
  return TYPE_ICON[type] ?? TYPE_ICON.unset;
}

const STATUS_OPTIONS = ["idea", "planned", "booked"] as const;

const DOW_SHORT = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"] as const;
const MON_SHORT = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
] as const;

function readEndTime(item: TripCockpitItineraryItem): string {
  return (item as ItemWithEnd).endTime ?? "";
}

/** Parse HH:MM → minutes from midnight; null if incomplete. Draft parseHm. */
function parseHm(value: string): number | null {
  const m = /^(\d{1,2}):(\d{2})$/.exec(value.trim());
  if (!m) return null;
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (h > 23 || min > 59) return null;
  return h * 60 + min;
}

/** Draft formatDuration: overnight windows wrap +24h (e.g. 09:40–05:50 → 20h 10m). */
function formatDuration(mins: number): string {
  if (mins <= 0) return "—";
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

function durationLabel(startTime: string, endTime: string): string {
  const a = parseHm(startTime);
  const b = parseHm(endTime);
  if (a == null || b == null) return "—";
  let d = b - a;
  if (d < 0) d += 24 * 60;
  if (d === 0) return "—";
  return formatDuration(d);
}

/**
 * Draft type-trigger class + label. Picker types keep their token; API
 * `default` / unknown / empty → unset / "Type".
 */
function typeTriggerMeta(activityType: string): {
  className: string;
  label: string;
} {
  if (PICKER_TYPES.has(activityType)) {
    return { className: activityType, label: TYPE_LABEL[activityType]! };
  }
  return { className: "unset", label: TYPE_LABEL.unset };
}

/**
 * Pretty day parts from YYYY-MM-DD.
 * dom/mon from the ISO day (UTC). data-dow follows draft TRIP_CALENDAR, which
 * uses the prior UTC weekday (2026-04-12 → sat) — see decisions.md.
 */
function prettyDayParts(isoDay: string): {
  dow: (typeof DOW_SHORT)[number];
  dom: string;
  mon: (typeof MON_SHORT)[number];
  dowLabel: string;
} {
  const d = new Date(`${isoDay}T00:00:00.000Z`);
  const dowDate = new Date(d);
  dowDate.setUTCDate(dowDate.getUTCDate() - 1);
  const dow = DOW_SHORT[dowDate.getUTCDay()]!;
  const mon = MON_SHORT[d.getUTCMonth()]!;
  const dom = String(d.getUTCDate());
  const dowLabel = dow.charAt(0).toUpperCase() + dow.slice(1);
  return { dow, dom, mon, dowLabel };
}

/** Draft TRIP_CALENDAR demo weather (static only — no live fetch). */
type DemoWx = {
  wx: "cloud" | "sun" | "rain";
  temp: string;
  rise: string;
  set: string;
  label: string;
};

const DEMO_WX_BY_ISO: Record<string, DemoWx> = {
  "2026-04-12": {
    wx: "cloud",
    temp: "16°",
    rise: "05:18",
    set: "18:05",
    label: "Cloudy",
  },
  "2026-04-13": {
    wx: "sun",
    temp: "18°",
    rise: "05:17",
    set: "18:06",
    label: "Sunny",
  },
  "2026-04-14": {
    wx: "rain",
    temp: "14°",
    rise: "05:15",
    set: "18:07",
    label: "Rain",
  },
};

const DEMO_WX_CYCLE: DemoWx[] = [
  DEMO_WX_BY_ISO["2026-04-12"]!,
  DEMO_WX_BY_ISO["2026-04-13"]!,
  DEMO_WX_BY_ISO["2026-04-14"]!,
];

function demoWxForDay(isoDay: string, dayNum: number): DemoWx {
  return DEMO_WX_BY_ISO[isoDay] ?? DEMO_WX_CYCLE[(dayNum - 1) % DEMO_WX_CYCLE.length]!;
}

function WxIcon({ kind }: { kind: DemoWx["wx"] }) {
  if (kind === "sun") {
    return (
      <svg className="wx-icon" viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
      </svg>
    );
  }
  if (kind === "rain") {
    return (
      <svg className="wx-icon" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M7 15h10a4 4 0 0 0 .5-8 5.5 5.5 0 0 0-10.7 1.5A3.5 3.5 0 0 0 7 15z" />
        <path d="M8 18l-1 2M12 18l-1 2M16 18l-1 2" />
      </svg>
    );
  }
  return (
    <svg className="wx-icon" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M7 18h10a4 4 0 0 0 .5-8 5.5 5.5 0 0 0-10.7 1.5A3.5 3.5 0 0 0 7 18z" />
    </svg>
  );
}

function DayWx({ isoDay, dayNum }: { isoDay: string; dayNum: number }) {
  const demo = demoWxForDay(isoDay, dayNum);
  const summary = `${demo.label} · ${demo.temp} · ↑${demo.rise} · ↓${demo.set}`;
  return (
    <div
      className="day-wx"
      data-wx={demo.wx}
      title={summary}
      aria-label={summary}
    >
      <WxIcon kind={demo.wx} />
      <span className="wx-temp">{demo.temp}</span>
      <span className="wx-sun" title="Sunrise">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M4 18h16M12 14V6M9 9l3-3 3 3" />
          <path d="M6 18a6 6 0 0 1 12 0" />
        </svg>
        {demo.rise}
      </span>
      <span className="wx-sun" title="Sunset">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M4 18h16M12 6v8M9 11l3 3 3-3" />
          <path d="M6 18a6 6 0 0 1 12 0" />
        </svg>
        {demo.set}
      </span>
    </div>
  );
}

function DayRow({
  isoDay,
  dayNum,
  collapsed,
  activityCount,
  onToggle,
  showDragGrip,
}: {
  isoDay: string;
  dayNum: number;
  collapsed: boolean;
  activityCount: number;
  onToggle: () => void;
  showDragGrip: boolean;
}) {
  const { dow, dom, mon, dowLabel } = prettyDayParts(isoDay);
  const countLabel =
    activityCount === 1 ? "1 activity" : `${activityCount} activities`;
  const expandLabel = collapsed ? "Expand day" : "Collapse day";

  return (
    <tr
      className="day-row"
      data-day-block=""
      data-collapsed={collapsed ? "true" : "false"}
    >
      <td colSpan={1}>
        <div className="day-head">
          <div className="day-rail">
            <button
              type="button"
              className="day-id"
              data-day-toggle=""
              data-dow={dow}
              aria-expanded={collapsed ? "false" : "true"}
              title={expandLabel}
              aria-label={expandLabel}
              onClick={onToggle}
            >
              {showDragGrip ? (
                <span className="day-drag" aria-hidden="true">
                  <i />
                  <i />
                  <i />
                </span>
              ) : null}
              <span className="day-num" data-day-num="">
                {dayNum}
              </span>
            </button>
            <time className="day-date" dateTime={isoDay}>
              <span className="dow" hidden>
                {dowLabel}
              </span>
              <span className="dom">{dom}</span>
              <span className="mon">{mon}</span>
            </time>
          </div>
          <div className="day-aside">
            <span
              className="day-count"
              data-day-count=""
              hidden={!collapsed}
            >
              {countLabel}
            </span>
            <DayWx isoDay={isoDay} dayNum={dayNum} />
          </div>
        </div>
      </td>
    </tr>
  );
}

function moveItemId(ids: string[], fromId: string, beforeId: string): string[] {
  if (fromId === beforeId) return ids;
  const from = ids.indexOf(fromId);
  const to = ids.indexOf(beforeId);
  if (from < 0 || to < 0) return ids;
  const next = [...ids];
  next.splice(from, 1);
  const insertAt = next.indexOf(beforeId);
  next.splice(insertAt, 0, fromId);
  return next;
}

function StopRow({
  item,
  dayLabel,
  zebraBg,
  selected,
  bodyHidden,
  canPatch,
  showDragGrip,
  externalBag,
  onPatch,
  onSelect,
  onInspectChange,
  onDropReorder,
}: {
  item: ItineraryTableStop;
  dayLabel: string;
  zebraBg: string;
  selected: boolean;
  bodyHidden: boolean;
  canPatch: boolean;
  showDragGrip: boolean;
  externalBag?: StopFieldBag;
  onPatch: (patch: ItineraryItemPatchFields) => void;
  onSelect?: (payload: {
    activity: string;
    activityType: string;
    fieldBag: StopFieldBag;
  }) => void;
  onInspectChange?: (payload: {
    activity: string;
    activityType: string;
    fieldBag: StopFieldBag;
  }) => void;
  /** Same-day drop target — dragged id lands before this row. */
  onDropReorder?: (draggedId: string, beforeId: string) => void;
}) {
  const endTime = readEndTime(item);
  const children: ItineraryTableChildStop[] = item.children ?? [];
  const hasSubplan = children.length > 0;
  const [activityType, setActivityType] = useState(item.activityType);
  const [fieldBag, setFieldBag] = useState<StopFieldBag>(() =>
    seedFieldBag(item),
  );
  const [typeMenuOpen, setTypeMenuOpen] = useState(false);
  /** Draft choice-chip listbox: Travel By or Food Meal (T7 #2). */
  const [choiceMenu, setChoiceMenu] = useState<"by" | "meal" | null>(null);
  const [subsOpen, setSubsOpen] = useState(false);
  /** Draft openStopDialog(note|link) / openTimeSetupDialog (T7 #3). */
  const [dialogMode, setDialogMode] = useState<StopDialogMode | null>(null);
  const [dlgNote, setDlgNote] = useState("");
  const [dlgLink, setDlgLink] = useState("");
  const [dlgStart, setDlgStart] = useState("");
  const [dlgEnd, setDlgEnd] = useState("");
  const { className: typeClass, label: typeLabel } = typeTriggerMeta(activityType);

  // Rail → table bag sync for the selected stop.
  useEffect(() => {
    if (!externalBag) return;
    setFieldBag((prev) => {
      const keys = new Set([...Object.keys(prev), ...Object.keys(externalBag)]);
      let same = true;
      for (const key of keys) {
        if ((prev[key] ?? "") !== (externalBag[key] ?? "")) {
          same = false;
          break;
        }
      }
      return same ? prev : { ...prev, ...externalBag };
    });
  }, [externalBag]);

  const commitField =
    (field: keyof ItineraryItemPatchFields, previous: string) =>
    (value: string) => {
      if (!canPatch) return;
      if (value === previous) return;
      // Time clears must be null — "" fails server HH:MM validation (T5 #3).
      const cleared =
        (field === "startTime" || field === "endTime") && value.trim() === ""
          ? null
          : value;
      onPatch({ [field]: cleared });
    };

  function emitInspect(nextType: string, nextBag: StopFieldBag) {
    onInspectChange?.({
      activity: activitySummaryFromBag(nextType, nextBag) || item.activity,
      activityType: nextType,
      fieldBag: nextBag,
    });
  }

  function updateBagKey(key: string, value: string) {
    setFieldBag((prev) => {
      const next = { ...prev, [key]: value };
      emitInspect(activityType, next);
      return next;
    });
  }

  function commitBagKey(key: string, value: string) {
    let next = { ...fieldBag, [key]: value };
    setFieldBag(next);
    emitInspect(activityType, next);
    if (!canPatch) return;

    // Soft map to documented top-level PATCH fields (not ambiguous details).
    if (key === "place") {
      if (value !== item.place) onPatch({ place: value });
      return;
    }
    if (key === "title") {
      if (value !== item.activity) onPatch({ activity: value });
      return;
    }
    if (key === "note" && activityType === "travel") {
      // Travel airline note stored in API place until details schema is wired.
      if (value !== item.place) onPatch({ place: value });
      return;
    }
    if ((key === "from" || key === "to") && activityType === "travel") {
      const summary = activitySummaryFromBag(activityType, next);
      if (summary) {
        next = { ...next, title: summary };
        setFieldBag(next);
        emitInspect(activityType, next);
      }
      if (summary && summary !== item.activity) {
        onPatch({ activity: summary });
      }
      return;
    }
    if (key === "by") {
      // Travel By → API activitySubtype (validate_activity_subtype).
      onPatch({ activitySubtype: value || null });
      return;
    }
    if (key === "meal") {
      // Food Meal → API details.meal.
      onPatch({ details: { meal: value } });
    }
  }

  function closeStopDialog() {
    setDialogMode(null);
  }

  function openStopDialog(mode: "note" | "link") {
    setChoiceMenu(null);
    setTypeMenuOpen(false);
    if (mode === "note") {
      setDlgNote("");
    } else {
      setDlgLink("");
    }
    setDialogMode(mode);
  }

  function openTimeSetupDialog() {
    setChoiceMenu(null);
    setTypeMenuOpen(false);
    setDlgStart(item.startTime ?? "");
    setDlgEnd(endTime);
    setDialogMode("time-setup");
  }

  function saveStopDialog() {
    if (!dialogMode) return;
    if (dialogMode === "note") {
      if (canPatch) onPatch({ note: dlgNote.trim() });
      closeStopDialog();
      return;
    }
    if (dialogMode === "link") {
      if (canPatch) onPatch({ mapLink: dlgLink.trim() });
      closeStopDialog();
      return;
    }
    // time-setup
    if (canPatch) {
      const start = dlgStart.trim();
      const end = dlgEnd.trim();
      onPatch({
        startTime: start === "" ? null : start,
        endTime: end === "" ? null : end,
      });
    }
    closeStopDialog();
  }

  const fieldDefs = typeFieldDefs(activityType);
  const primaryFields = fieldDefs.filter((f) => f.line === "primary");
  const secondaryFields = fieldDefs.filter((f) => f.line === "secondary");

  function renderFieldInput(field: (typeof fieldDefs)[number]) {
    const value = fieldBag[field.key] ?? "";
    // by / meal use draft choice-chips on .title-with-meta (renderChoiceChip).
    return (
      <input
        key={field.key}
        className={field.line === "primary" ? "cell-title" : "cell-sub"}
        type="text"
        value={value}
        placeholder={field.placeholder ?? field.label}
        aria-label={field.label}
        autoComplete="off"
        onClick={(e) => e.stopPropagation()}
        onChange={(e) => updateBagKey(field.key, e.target.value)}
        onBlur={(e) => commitBagKey(field.key, e.target.value)}
      />
    );
  }

  function renderChoiceChip(kind: "by" | "meal") {
    const value = fieldBag[kind] ?? "";
    const empty = !value;
    const emptyLabel = kind === "by" ? "By" : "Meal";
    const options = kind === "by" ? BY_OPTIONS : MEAL_OPTIONS;
    const open = choiceMenu === kind;
    const className = [
      "choice-chip",
      kind === "meal" ? "meal" : null,
      empty ? "is-empty" : null,
    ]
      .filter(Boolean)
      .join(" ");
    const triggerProps =
      kind === "by"
        ? ({ "data-by-trigger": "" } as const)
        : ({ "data-meal-trigger": "" } as const);

    return (
      <>
        <button
          type="button"
          className={className}
          {...triggerProps}
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-label={emptyLabel}
          onClick={(e) => {
            e.stopPropagation();
            if (!canPatch) return;
            setTypeMenuOpen(false);
            setChoiceMenu((cur) => (cur === kind ? null : kind));
          }}
        >
          <span className="choice-chip-label">
            {empty ? emptyLabel : value}
          </span>
          {CHOICE_CHIP_CHEVRON}
        </button>
        {open ? (
          <ul
            className="choice-menu"
            role="listbox"
            aria-label={kind === "by" ? "Travel by" : "Meal"}
          >
            {options.map((opt) => (
              <li key={opt || "empty"} role="none">
                <button
                  type="button"
                  role="option"
                  aria-selected={opt === value}
                  onClick={(e) => {
                    e.stopPropagation();
                    setChoiceMenu(null);
                    updateBagKey(kind, opt);
                    commitBagKey(kind, opt);
                  }}
                >
                  {opt || "Not set"}
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </>
    );
  }

  const stopClass = [
    "stop-row",
    selected ? "selected" : null,
    bodyHidden ? "day-body-hidden" : null,
  ]
    .filter(Boolean)
    .join(" ");

  const subCount = children.length;
  const toggleTitle = subsOpen
    ? "Hide sub-activities"
    : subCount
      ? `Show ${subCount} sub-activities`
      : "Add sub-activities";

  return (
    <tr
      className={stopClass}
      data-id={item.id}
      data-day={dayLabel}
      {...(hasSubplan
        ? { "data-subs-open": subsOpen ? "true" : "false" }
        : {})}
      onClick={() =>
        onSelect?.({
          activity: activitySummaryFromBag(activityType, fieldBag) || item.activity,
          activityType,
          fieldBag,
        })
      }
      onDragOver={
        showDragGrip && onDropReorder
          ? (e) => {
              e.preventDefault();
              e.dataTransfer.dropEffect = "move";
            }
          : undefined
      }
      onDrop={
        showDragGrip && onDropReorder
          ? (e) => {
              e.preventDefault();
              e.stopPropagation();
              const draggedId = e.dataTransfer.getData("text/plain").trim();
              if (!draggedId || draggedId === item.id) return;
              onDropReorder(draggedId, item.id);
            }
          : undefined
      }
    >
      <td
        className="col-stop"
        style={
          selected
            ? undefined
            : { background: zebraBg, backgroundColor: zebraBg }
        }
      >
        <div className="stop-stack">
          <div className="stop-block">
            {showDragGrip ? (
              <button
                type="button"
                className="stop-drag"
                data-stop-drag=""
                title="Drag to reorder"
                aria-label="Drag activity to reorder"
                draggable
                onClick={(e) => e.stopPropagation()}
                onDragStart={(e) => {
                  e.stopPropagation();
                  e.dataTransfer.setData("text/plain", item.id);
                  e.dataTransfer.effectAllowed = "move";
                }}
              >
                <i />
                <i />
                <i />
              </button>
            ) : null}
            <div className="stop-when">
              <div className="time-range">
                <input
                  className="cell-time"
                  type="text"
                  inputMode="numeric"
                  data-time="start"
                  placeholder="--"
                  maxLength={5}
                  defaultValue={item.startTime}
                  aria-label="Start time"
                  autoComplete="off"
                  onBlur={(e) =>
                    commitField("startTime", item.startTime)(e.target.value)
                  }
                />
                <span className="time-dash" aria-hidden="true">
                  –
                </span>
                <input
                  className="cell-time"
                  type="text"
                  inputMode="numeric"
                  data-time="end"
                  placeholder="--"
                  maxLength={5}
                  defaultValue={endTime}
                  aria-label="End time"
                  autoComplete="off"
                  onBlur={(e) =>
                    commitField("endTime", endTime)(e.target.value)
                  }
                />
              </div>
              <div className="time-duration" data-duration aria-label="Duration">
                <span className="time-duration-text" data-duration-text>
                  {durationLabel(item.startTime, endTime)}
                </span>
                <button
                  type="button"
                  className="time-setup"
                  data-time-setup=""
                  title="Set time"
                  aria-label="Set time"
                  onClick={(e) => {
                    e.stopPropagation();
                    openTimeSetupDialog();
                  }}
                >
                  {TIME_SETUP_ICON}
                </button>
              </div>
            </div>
            <div className="stop-body">
              <div className="type-picker">
                <button
                  type="button"
                  className={`type-trigger ${typeClass}`}
                  data-type-trigger=""
                  title={typeLabel}
                  aria-label={typeLabel}
                  aria-haspopup="menu"
                  aria-expanded={typeMenuOpen}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!canPatch) return;
                    setChoiceMenu(null);
                    setTypeMenuOpen((open) => !open);
                  }}
                >
                  <span className="type-ico" aria-hidden="true">
                    {typeIcon(typeClass)}
                  </span>
                </button>
                {typeMenuOpen ? (
                  <ul
                    className="type-menu"
                    role="menu"
                    aria-label="Activity type"
                  >
                    {PICKER_TYPE_LIST.map((type) => (
                      <li key={type} role="none">
                        <button
                          type="button"
                          role="menuitem"
                          onClick={(e) => {
                            e.stopPropagation();
                            setTypeMenuOpen(false);
                            if (type === activityType) return;
                            setActivityType(type);
                            emitInspect(type, fieldBag);
                            onPatch({ activityType: type });
                          }}
                        >
                          {TYPE_LABEL[type]}
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
              <div
                className="fields-host"
                data-fields-host=""
                data-values={JSON.stringify(fieldBag)}
              >
                <div className="line-primary">
                  {activityType === "travel" ? (
                    <div className="title-with-meta">
                      <div className="route-line">
                        {primaryFields
                          .filter((f) => f.key === "from" || f.key === "to")
                          .flatMap((f, i) =>
                            i === 0
                              ? [renderFieldInput(f)]
                              : [
                                  <span
                                    key="route-arrow"
                                    className="route-arrow"
                                    aria-hidden="true"
                                  >
                                    →
                                  </span>,
                                  renderFieldInput(f),
                                ],
                          )}
                      </div>
                      {renderChoiceChip("by")}
                    </div>
                  ) : activityType === "food" ? (
                    <div className="title-with-meta">
                      {primaryFields
                        .filter((f) => f.key !== "meal")
                        .map((f) => renderFieldInput(f))}
                      {renderChoiceChip("meal")}
                    </div>
                  ) : (
                    primaryFields.map((f) => renderFieldInput(f))
                  )}
                  <span hidden>{item.activity}</span>
                </div>
                <div className="line-secondary">
                  {secondaryFields.map((f) => renderFieldInput(f))}
                  <span hidden>{item.place}</span>
                </div>
              </div>
              <div className="activity-actions" data-activity-actions="">
                <select
                  aria-label="Status"
                  defaultValue={item.status}
                  onClick={(e) => e.stopPropagation()}
                  onChange={(e) => {
                    if (!canPatch) return;
                    const next = e.target.value;
                    if (next === item.status) return;
                    onPatch({ status: next });
                  }}
                >
                  {STATUS_OPTIONS.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  className="activity-action"
                  data-act="note"
                  title="Note"
                  aria-label="Edit note"
                  onClick={(e) => {
                    e.stopPropagation();
                    openStopDialog("note");
                  }}
                >
                  {NOTE_ACTION_ICON}
                </button>
                <button
                  type="button"
                  className="activity-action"
                  data-act="link"
                  title="Link"
                  aria-label="Edit link"
                  onClick={(e) => {
                    e.stopPropagation();
                    openStopDialog("link");
                  }}
                >
                  {LINK_ACTION_ICON}
                </button>
                {hasSubplan ? (
                  <button
                    type="button"
                    className="activity-action subplan-toggle"
                    data-subplan-toggle=""
                    data-count={String(subCount)}
                    aria-expanded={subsOpen ? "true" : "false"}
                    title={toggleTitle}
                    aria-label={toggleTitle}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSubsOpen((open) => !open);
                    }}
                  >
                    {SUBPLAN_CHEVRON}
                    <span className="subplan-toggle-count" aria-hidden="true">
                      {subCount || ""}
                    </span>
                  </button>
                ) : null}
              </div>
            </div>
          </div>
          {hasSubplan ? (
            <div className="subplan" data-subplan="" hidden={!subsOpen}>
              <div className="subplan-list" data-subplan-list="">
                {children.map((child) => (
                  <div
                    key={child.id}
                    className="subplan-row"
                    data-subplan-row=""
                  >
                    <div className="sub-fields" data-sub-fields="">
                      <input
                        className="sub-field"
                        data-sub-field="place"
                        type="text"
                        defaultValue={child.place}
                        placeholder="Place"
                        aria-label="Place"
                        autoComplete="off"
                        readOnly
                      />
                      <span hidden>{child.place}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>
        {dialogMode ? (
          <div
            className="stop-dlg open"
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="stop-dlg-backdrop"
              onClick={closeStopDialog}
            />
            <div
              className="stop-dlg-card"
              role="dialog"
              aria-modal="true"
              aria-labelledby={`stop-dlg-title-${item.id}`}
            >
              <h3 id={`stop-dlg-title-${item.id}`}>
                {STOP_DIALOG_TITLE[dialogMode]}
              </h3>
              <div className="stop-dlg-body">
                {dialogMode === "note" ? (
                  <label>
                    <span>Note</span>
                    <textarea
                      rows={4}
                      placeholder="Add a note…"
                      aria-label="Note"
                      value={dlgNote}
                      onChange={(e) => setDlgNote(e.target.value)}
                    />
                  </label>
                ) : null}
                {dialogMode === "link" ? (
                  <label>
                    <span>URL</span>
                    <input
                      type="url"
                      placeholder="https://"
                      aria-label="URL"
                      value={dlgLink}
                      onChange={(e) => setDlgLink(e.target.value)}
                    />
                  </label>
                ) : null}
                {dialogMode === "time-setup" ? (
                  <div className="time-setup-grid">
                    <label>
                      Start
                      <input
                        type="text"
                        inputMode="numeric"
                        placeholder="HH:MM"
                        maxLength={5}
                        autoComplete="off"
                        aria-label="Start"
                        value={dlgStart}
                        onChange={(e) => setDlgStart(e.target.value)}
                      />
                    </label>
                    <label>
                      End
                      <input
                        type="text"
                        inputMode="numeric"
                        placeholder="HH:MM"
                        maxLength={5}
                        autoComplete="off"
                        aria-label="End"
                        value={dlgEnd}
                        onChange={(e) => setDlgEnd(e.target.value)}
                      />
                    </label>
                  </div>
                ) : null}
              </div>
              <div className="stop-dlg-foot">
                <button type="button" onClick={closeStopDialog}>
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn-primary"
                  onClick={saveStopDialog}
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </td>
    </tr>
  );
}

/** Resolve DESIGN zebra token to a concrete color for inline styles (happy-dom). */
function resolveToken(
  name: "--color-surface" | "--color-surface-subtle",
  fallback: string,
): string {
  if (typeof document === "undefined") return fallback;
  const value = getComputedStyle(document.documentElement)
    .getPropertyValue(name)
    .trim();
  return value || fallback;
}

/** Collapsed + Add activity trigger (Quick only — no Smart/AI paste chrome). */
function AddRow({
  dayLabel,
  open,
  onOpen,
}: {
  dayLabel: string;
  open: boolean;
  onOpen: () => void;
}) {
  return (
    <tr
      className="add-row"
      data-day={dayLabel}
      data-open={open ? "true" : "false"}
      hidden={open}
    >
      <td colSpan={1} className="add-collapsed-cell">
        <div className="add-bar">
          <button
            type="button"
            className="add-trigger"
            aria-expanded={open ? "true" : "false"}
            onClick={onOpen}
          >
            <span className="add-trigger-label">Add activity</span>
          </button>
        </div>
      </td>
    </tr>
  );
}

/** Inline draft stop row (empty normal row shape). Visible when add is open. */
function AddDraftRow({
  dayLabel,
  open,
  title,
  error,
  onTitleChange,
  onCancel,
  onCommit,
}: {
  dayLabel: string;
  open: boolean;
  title: string;
  error: string | null;
  onTitleChange: (value: string) => void;
  onCancel: () => void;
  onCommit: () => void;
}) {
  return (
    <tr
      className="add-draft-row"
      data-day={dayLabel}
      hidden={!open}
    >
      <td className="col-stop">
        <div className="stop-block">
          <div className="stop-when">
            <div className="time-range">
              <input
                className="cell-time"
                type="text"
                inputMode="numeric"
                data-time="start"
                placeholder="--"
                maxLength={5}
                defaultValue=""
                aria-label="Start time"
                autoComplete="off"
              />
              <span className="time-dash" aria-hidden="true">
                –
              </span>
              <input
                className="cell-time"
                type="text"
                inputMode="numeric"
                data-time="end"
                placeholder="--"
                maxLength={5}
                defaultValue=""
                aria-label="End time"
                autoComplete="off"
              />
            </div>
            <div className="time-duration" data-duration aria-label="Duration">
              <span className="time-duration-text" data-duration-text>
                —
              </span>
            </div>
          </div>
          <div className="stop-body">
            <button
              type="button"
              className="type-trigger unset"
              data-type-trigger=""
              title="Type"
              aria-label="Type"
            >
              <span className="type-ico" aria-hidden="true">
                {typeIcon("unset")}
              </span>
            </button>
            <div className="fields-host" data-fields-host="">
              <input
                className="sub-field"
                type="text"
                placeholder="Title"
                value={title}
                onChange={(e) => onTitleChange(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    onCommit();
                  }
                }}
                aria-label="Title"
                autoComplete="off"
              />
              {error ? (
                <p className="add-error" role="alert">
                  {error}
                </p>
              ) : null}
            </div>
            <button
              type="button"
              className="add-cancel"
              data-add-cancel=""
              title="Cancel"
              aria-label="Cancel"
              onClick={onCancel}
            >
              ×
            </button>
          </div>
        </div>
      </td>
    </tr>
  );
}

export function SmartItineraryTable({
  model,
  tripId,
  sessionToken,
  apiBaseUrl = "",
  fetch: fetchImpl = fetch,
  onCockpitReload,
  selectedId = null,
  onSelect,
  onInspectChange,
  fieldBagById,
  reorderEnabled = false,
}: SmartItineraryTableProps) {
  const surface = resolveToken("--color-surface", "#ffffff");
  const surfaceSubtle = resolveToken("--color-surface-subtle", "#f8fafc");
  const tableRef = useRef<HTMLTableElement>(null);
  const [openDay, setOpenDay] = useState<string | null>(null);
  const [draftTitle, setDraftTitle] = useState("");
  const [createError, setCreateError] = useState<string | null>(null);
  /** Calm inline reorder failure — never keeps a silent local-only order (T5 #3). */
  const [reorderError, setReorderError] = useState<string | null>(null);
  /** Items created via Quick-add in this session (T4 #3). */
  const [createdItems, setCreatedItems] = useState<TripCockpitItineraryItem[]>(
    [],
  );
  /** After version_conflict, block patches until parent reloads (T5 #2). */
  const [awaitingCockpitReload, setAwaitingCockpitReload] = useState(false);
  /** Collapsed Plan Days keyed by ISO day — persisted per tripId (T4 #1). */
  const [collapsedDays, setCollapsedDays] = useState<Set<string>>(() =>
    readCollapsedDays(tripId),
  );
  let stopIndex = 0;

  useEffect(() => {
    setCollapsedDays(readCollapsedDays(tripId));
  }, [tripId]);

  const toggleDayCollapsed = (isoDay: string) => {
    setCollapsedDays((prev) => {
      const next = new Set(prev);
      if (next.has(isoDay)) next.delete(isoDay);
      else next.add(isoDay);
      writeCollapsedDays(tripId, next);
      return next;
    });
  };

  const closeDraft = () => {
    setOpenDay(null);
    setDraftTitle("");
    setCreateError(null);
  };

  useEffect(() => {
    if (!openDay) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        setOpenDay(null);
        setDraftTitle("");
        setCreateError(null);
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [openDay]);

  const commitDraft = (isoDay: string) => {
    if (!tripId || !sessionToken) return;
    const activity = draftTitle.trim() || "Untitled activity";
    setCreateError(null);
    void createItineraryItem(
      {
        tripId,
        sessionToken,
        planVariantId: model.planVariantId,
        day: isoDay,
        activity,
        activityType: "default",
        place: "",
      },
      { fetch: fetchImpl, apiBaseUrl },
    ).then((outcome) => {
      if (outcome.ok) {
        setCreatedItems((prev) => [...prev, outcome.item]);
        setOpenDay(null);
        setDraftTitle("");
        setCreateError(null);
        return;
      }
      setCreateError(outcome.error);
    });
  };

  const canPatch =
    Boolean(tripId && sessionToken) && !awaitingCockpitReload;

  const commitPatch = (
    item: TripCockpitItineraryItem,
    patch: ItineraryItemPatchFields,
  ) => {
    if (!tripId || !sessionToken || awaitingCockpitReload) return;
    void patchItineraryItem(
      {
        tripId,
        itemId: item.id,
        sessionToken,
        expectedVersion: item.version,
        patch,
      },
      { fetch: fetchImpl, apiBaseUrl },
    ).then((outcome) => {
      if (!outcome.ok && outcome.code === "version_conflict") {
        setAwaitingCockpitReload(true);
        onCockpitReload?.();
      }
    });
  };

  const commitPlanDayReorder = (day: string, itemIds: string[]) => {
    if (!tripId || !sessionToken || itemIds.length === 0) return;
    void reorderItineraryItems(
      {
        tripId,
        sessionToken,
        planVariantId: model.planVariantId,
        day,
        itemIds,
      },
      { fetch: fetchImpl, apiBaseUrl },
    ).then((outcome) => {
      if (outcome.ok) {
        // Success: leave model order authoritative; clear any prior calm error.
        setReorderError((prev) => (prev == null ? prev : null));
        return;
      }
      // Failure: keep server/model order — no silent local-only reorder.
      setReorderError(outcome.error);
    });
  };

  useEffect(() => {
    const table = tableRef.current;
    if (!table) return;
    const onPlanDayReorder = (event: Event) => {
      const detail = (event as CustomEvent<PlanDayReorderDetail>).detail;
      const day =
        detail && typeof detail.day === "string" ? detail.day.trim() : "";
      const rawIds = detail?.itemIds;
      if (!day || !Array.isArray(rawIds)) return;
      const itemIds = rawIds.filter(
        (id): id is string => typeof id === "string" && id.length > 0,
      );
      if (itemIds.length === 0) return;
      commitPlanDayReorder(day, itemIds);
    };
    table.addEventListener(PLAN_DAY_REORDER_EVENT, onPlanDayReorder);
    return () =>
      table.removeEventListener(PLAN_DAY_REORDER_EVENT, onPlanDayReorder);
    // commitPlanDayReorder closes over trip/session/plan; rebind when they change.
  }, [
    tripId,
    sessionToken,
    model.planVariantId,
    fetchImpl,
    apiBaseUrl,
  ]);

  return (
    <table
      ref={tableRef}
      className="smart"
      aria-label="Smart itinerary table"
    >
      <thead>
        <tr>
          <th className="col-stop" scope="col">
            Activity
          </th>
        </tr>
      </thead>
      <tbody>
        {reorderError ? (
          <tr className="reorder-error-row">
            <td className="col-stop">
              <p className="add-error" role="alert">
                {reorderError}
              </p>
            </td>
          </tr>
        ) : null}
        {model.days.flatMap((day, dayIdx) => {
          const dayNum = dayIdx + 1;
          const dayLabel = `Day ${dayNum}`;
          const open = openDay === dayLabel;
          const dayItems = [
            ...day.items,
            ...createdItems.filter((item) => item.day === day.day),
          ];
          const dayItemIds = dayItems.map((item) => item.id);
          const collapsed = collapsedDays.has(day.day);
          const header = (
            <DayRow
              key={`day-${day.day}`}
              isoDay={day.day}
              dayNum={dayNum}
              collapsed={collapsed}
              activityCount={dayItems.length}
              onToggle={() => toggleDayCollapsed(day.day)}
              showDragGrip={reorderEnabled}
            />
          );
          const stops = dayItems.map((item) => {
            const zebraBg =
              stopIndex % 2 === 0 ? surface : surfaceSubtle;
            stopIndex += 1;
            return (
              <StopRow
                key={item.id}
                item={item}
                dayLabel={dayLabel}
                zebraBg={zebraBg}
                selected={selectedId === item.id}
                bodyHidden={collapsed}
                canPatch={canPatch}
                showDragGrip={reorderEnabled}
                externalBag={fieldBagById?.[item.id]}
                onPatch={(patch) => commitPatch(item, patch)}
                onDropReorder={
                  reorderEnabled
                    ? (draggedId, beforeId) => {
                        const nextIds = moveItemId(
                          dayItemIds,
                          draggedId,
                          beforeId,
                        );
                        if (nextIds === dayItemIds) return;
                        if (nextIds.every((id, i) => id === dayItemIds[i])) {
                          return;
                        }
                        commitPlanDayReorder(day.day, nextIds);
                      }
                    : undefined
                }
                onInspectChange={
                  onInspectChange
                    ? (live) =>
                        onInspectChange({
                          id: item.id,
                          activity: live.activity,
                          activityType: live.activityType,
                          status: item.status,
                          dayLabel,
                          fieldBag: live.fieldBag,
                        })
                    : undefined
                }
                onSelect={
                  onSelect
                    ? (live) =>
                        onSelect({
                          id: item.id,
                          activity: live.activity,
                          activityType: live.activityType,
                          status: item.status,
                          dayLabel,
                          fieldBag: live.fieldBag,
                        })
                    : undefined
                }
              />
            );
          });
          const add = (
            <AddRow
              key={`add-${day.day}`}
              dayLabel={dayLabel}
              open={open}
              onOpen={() => {
                setDraftTitle("");
                setCreateError(null);
                setOpenDay(dayLabel);
              }}
            />
          );
          const draft = (
            <AddDraftRow
              key={`draft-${day.day}`}
              dayLabel={dayLabel}
              open={open}
              title={draftTitle}
              error={open ? createError : null}
              onTitleChange={setDraftTitle}
              onCancel={closeDraft}
              onCommit={() => commitDraft(day.day)}
            />
          );
          return [header, ...stops, add, draft];
        })}
      </tbody>
    </table>
  );
}
