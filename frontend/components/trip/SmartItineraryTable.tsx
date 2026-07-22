/**
 * Smart Itinerary Table — day spine + stop rows (time rail | body).
 * Phase-1 composition matches itinerary-plan-draft-v1 landmarks (T3 #2–#3).
 * T4 #1–#3: Quick-only add → POST create → append summary / calm draft error.
 * T5 #1: inline blur/commit → PATCH itinerary-items/{itemId} + expectedVersion.
 * T5 #2: version_conflict → onCockpitReload; block patches until model reloads.
 */

"use client";

import { useEffect, useState } from "react";
import {
  createItineraryItem,
  patchItineraryItem,
  type ItineraryItemPatchFields,
} from "../../src/trip/itinerary-api";
import type { TripCockpitItineraryItem } from "../../src/trip/trip-cockpit-load";
import type { ItineraryTableModel } from "../../src/trip/itinerary-table-model";

/** Stop summary handed to the parent for context-rail selection (T6 #1). */
export type SmartItinerarySelectPayload = {
  id: string;
  activity: string;
  activityType: string;
  status: string;
  dayLabel: string;
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

const TYPE_LABEL: Record<string, string> = {
  travel: "Travel",
  food: "Food",
  stay: "Stay",
  attraction: "Attraction",
  experience: "Experience",
  shopping: "Shopping",
  unset: "Type",
};

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
}: {
  isoDay: string;
  dayNum: number;
}) {
  const { dow, dom, mon, dowLabel } = prettyDayParts(isoDay);

  return (
    <tr className="day-row" data-day-block="" data-collapsed="false">
      <td colSpan={1}>
        <div className="day-head">
          <div className="day-rail">
            <button
              type="button"
              className="day-id"
              data-day-toggle=""
              data-dow={dow}
              aria-expanded="true"
              title="Collapse day"
              aria-label="Collapse day"
            >
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
          <DayWx isoDay={isoDay} dayNum={dayNum} />
        </div>
      </td>
    </tr>
  );
}

function StopRow({
  item,
  dayLabel,
  zebraBg,
  selected,
  canPatch,
  onPatch,
  onSelect,
}: {
  item: TripCockpitItineraryItem;
  dayLabel: string;
  zebraBg: string;
  selected: boolean;
  canPatch: boolean;
  onPatch: (patch: ItineraryItemPatchFields) => void;
  onSelect?: () => void;
}) {
  const endTime = readEndTime(item);
  const [activityType, setActivityType] = useState(item.activityType);
  const [typeMenuOpen, setTypeMenuOpen] = useState(false);
  const { className: typeClass, label: typeLabel } = typeTriggerMeta(activityType);

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

  return (
    <tr
      className={selected ? "stop-row selected" : "stop-row"}
      data-id={item.id}
      data-day={dayLabel}
      onClick={onSelect}
    >
      <td
        className="col-stop"
        style={
          // Omit zebra inline when selected so draft tonal CSS can paint.
          selected
            ? undefined
            : { background: zebraBg, backgroundColor: zebraBg }
        }
      >
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
                onBlur={(e) => commitField("endTime", endTime)(e.target.value)}
              />
            </div>
            <div className="time-duration" data-duration aria-label="Duration">
              <span className="time-duration-text" data-duration-text>
                {durationLabel(item.startTime, endTime)}
              </span>
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
                onClick={() => {
                  if (!canPatch) return;
                  setTypeMenuOpen((open) => !open);
                }}
              >
                <span className="type-ico" aria-hidden="true" />
              </button>
              {typeMenuOpen ? (
                <ul className="type-menu" role="menu" aria-label="Activity type">
                  {PICKER_TYPE_LIST.map((type) => (
                    <li key={type} role="none">
                      <button
                        type="button"
                        role="menuitem"
                        onClick={() => {
                          setTypeMenuOpen(false);
                          if (type === activityType) return;
                          setActivityType(type);
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
            <div className="line-primary">
              <input
                className="cell-title"
                type="text"
                defaultValue={item.activity}
                aria-label="Title"
                autoComplete="off"
                onBlur={(e) =>
                  commitField("activity", item.activity)(e.target.value)
                }
              />
              {/* Landmark textContent for composition assertions (input value ≠ textContent). */}
              <span hidden>{item.activity}</span>
            </div>
            <div className="line-secondary">
              <input
                className="cell-sub"
                type="text"
                defaultValue={item.place}
                aria-label="Place"
                autoComplete="off"
                onBlur={(e) => commitField("place", item.place)(e.target.value)}
              />
              <span hidden>{item.place}</span>
            </div>
            <div className="activity-actions" data-activity-actions="">
              <select
                aria-label="Status"
                defaultValue={item.status}
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
            </div>
          </div>
        </div>
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
              <span className="type-ico" aria-hidden="true" />
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
}: SmartItineraryTableProps) {
  const surface = resolveToken("--color-surface", "#ffffff");
  const surfaceSubtle = resolveToken("--color-surface-subtle", "#f8fafc");
  const [openDay, setOpenDay] = useState<string | null>(null);
  const [draftTitle, setDraftTitle] = useState("");
  const [createError, setCreateError] = useState<string | null>(null);
  /** Items created via Quick-add in this session (T4 #3). */
  const [createdItems, setCreatedItems] = useState<TripCockpitItineraryItem[]>(
    [],
  );
  /** After version_conflict, block patches until parent reloads (T5 #2). */
  const [awaitingCockpitReload, setAwaitingCockpitReload] = useState(false);
  let stopIndex = 0;

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

  return (
    <table className="smart" aria-label="Smart itinerary table">
      <thead>
        <tr>
          <th className="col-stop" scope="col">
            Activity
          </th>
        </tr>
      </thead>
      <tbody>
        {model.days.flatMap((day, dayIdx) => {
          const dayNum = dayIdx + 1;
          const dayLabel = `Day ${dayNum}`;
          const open = openDay === dayLabel;
          const dayItems = [
            ...day.items,
            ...createdItems.filter((item) => item.day === day.day),
          ];
          const header = (
            <DayRow key={`day-${day.day}`} isoDay={day.day} dayNum={dayNum} />
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
                canPatch={canPatch}
                onPatch={(patch) => commitPatch(item, patch)}
                onSelect={
                  onSelect
                    ? () =>
                        onSelect({
                          id: item.id,
                          activity: item.activity,
                          activityType: item.activityType,
                          status: item.status,
                          dayLabel,
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
