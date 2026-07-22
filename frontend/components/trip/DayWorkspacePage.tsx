"use client";

/**
 * Day workspace — Theme A Calm Travel Ops (M80VKAX5 T1 shell + T2 day tabs).
 * Crumb + Table|Days view switch + Plan Day folder tabs + day-scoped canvas.
 * T11: topbar AI Suggest / Auto route & fill → day-plan-assist + inline chips.
 */

import { useEffect, useState } from "react";
import { defaultApiBaseUrl } from "../../src/auth/email-challenge";
import { loadMemberSession } from "../../src/landing/create-trip";
import {
  requestDayPlanAssist,
  type DayPlanAssistMapPin,
  type DayPlanAssistMode,
  type DayPlanAssistOption,
} from "../../src/trip/day-plan-assist-api";
import {
  buildItineraryTableModel,
  type ItineraryTableStop,
} from "../../src/trip/itinerary-table-model";
import { nextCalendarDay, patchTrip } from "../../src/trip/trip-api";
import {
  loadTripCockpit,
  type TripCockpitItineraryItem,
  type TripCockpitTrip,
} from "../../src/trip/trip-cockpit-load";
import { DayFolderTabs } from "./DayFolderTabs";
import { DayMap } from "./DayMap";
import { DayStopDetails } from "./DayStopDetails";
import {
  DayTimeline,
  type DayTimelineAiSuggestion,
  type DayTimelineStop,
} from "./DayTimeline";

type DayWorkspacePageProps = {
  tripId: string;
};

/** Fields packed for day-plan-assist (matches API contract / T9 client). */
const ASSIST_SELECTED_FIELDS = [
  "activity",
  "activityType",
  "place",
  "startTime",
  "endTime",
  "durationMinutes",
  "transportation",
  "coordinates",
  "mapLink",
  "details",
] as const;

function nextAssistClientMutationId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `day-plan-assist-${Date.now()}`;
}

function mapPinsFromDayStops(stops: ItineraryTableStop[]): DayPlanAssistMapPin[] {
  const pins: DayPlanAssistMapPin[] = [];
  for (const stop of stops) {
    const c = stop.coordinates;
    if (
      c &&
      typeof c.lat === "number" &&
      typeof c.lng === "number" &&
      Number.isFinite(c.lat) &&
      Number.isFinite(c.lng)
    ) {
      pins.push({
        itemId: stop.id,
        lat: c.lat,
        lng: c.lng,
        label: stop.place || stop.activity,
      });
    }
  }
  return pins;
}

function optionsToAiSuggestions(
  batchId: string,
  options: DayPlanAssistOption[],
  fallbackStopId: string | null,
): DayTimelineAiSuggestion[] {
  return options.map((option) => ({
    relatedStopId: option.affectsItemIds[0] ?? fallbackStopId ?? "",
    batchId,
    option,
  }));
}

/**
 * Joii day workspace surface for /trips/{id}/days.
 * Real workspace chrome (not a placeholder) — no Sagittarius copy.
 */
export function DayWorkspacePage({ tripId }: DayWorkspacePageProps) {
  const tableHref = `/trips/${tripId}`;
  const daysHref = `/trips/${tripId}/days`;

  const [trip, setTrip] = useState<TripCockpitTrip | null>(null);
  const [itineraryItems, setItineraryItems] = useState<
    TripCockpitItineraryItem[]
  >([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loadSettled, setLoadSettled] = useState(false);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [selectedStop, setSelectedStop] = useState<DayTimelineStop | null>(
    null,
  );
  const [addingDay, setAddingDay] = useState(false);
  const [assistPending, setAssistPending] = useState(false);
  /** Open day-plan-assist chip batch (T10; Suggest injects in T11). */
  const [aiSuggestions, setAiSuggestions] = useState<DayTimelineAiSuggestion[]>(
    [],
  );

  useEffect(() => {
    let cancelled = false;

    void loadTripCockpit(
      { tripId },
      {
        fetch: globalThis.fetch.bind(globalThis),
        apiBaseUrl: defaultApiBaseUrl(),
        storage: window.sessionStorage,
      },
    ).then((outcome) => {
      if (cancelled) return;
      if (!outcome.ok) {
        setLoadError(outcome.error);
        setTrip(null);
        setItineraryItems([]);
        setLoadSettled(true);
        return;
      }
      setLoadError(null);
      setTrip(outcome.trip);
      setItineraryItems(outcome.itineraryItems);
      setLoadSettled(true);
    });

    return () => {
      cancelled = true;
    };
  }, [tripId]);

  const planVariantId =
    trip?.activePlanVariantId ?? trip?.mainTripPlanId ?? null;
  const itineraryModel =
    trip && planVariantId
      ? buildItineraryTableModel({
          startDate: trip.startDate,
          endDate: trip.endDate,
          planVariantId,
          itineraryItems,
        })
      : null;
  const spineDays = itineraryModel?.days.map((d) => d.day) ?? [];
  const activeDay =
    selectedDay && spineDays.includes(selectedDay)
      ? selectedDay
      : (spineDays[0] ?? null);
  const dayStops =
    itineraryModel && activeDay
      ? (itineraryModel.days.find((d) => d.day === activeDay)?.items ?? [])
      : [];
  const timelineStops: DayTimelineStop[] = dayStops.map((stop) => ({
    id: stop.id,
    activity: stop.activity,
    activityType: stop.activityType,
    place: stop.place,
    version: stop.version,
    startTime: stop.startTime,
    endTime: stop.endTime,
    status: stop.status,
  }));
  const detailsStop =
    selectedStop && timelineStops.some((s) => s.id === selectedStop.id)
      ? (timelineStops.find((s) => s.id === selectedStop.id) ?? selectedStop)
      : null;
  const sessionToken =
    typeof window !== "undefined"
      ? loadMemberSession(window.sessionStorage)?.sessionToken
      : undefined;

  function reloadCockpit() {
    setLoadSettled(false);
    void loadTripCockpit(
      { tripId },
      {
        fetch: globalThis.fetch.bind(globalThis),
        apiBaseUrl: defaultApiBaseUrl(),
        storage: window.sessionStorage,
      },
    ).then((outcome) => {
      if (!outcome.ok) {
        setLoadError(outcome.error);
        setTrip(null);
        setItineraryItems([]);
        setLoadSettled(true);
        return;
      }
      setLoadError(null);
      setTrip(outcome.trip);
      setItineraryItems(outcome.itineraryItems);
      setLoadSettled(true);
    });
  }

  async function handleAddDay() {
    if (!trip || addingDay) return;
    const nextDay = nextCalendarDay(trip.endDate);
    const session = loadMemberSession(window.sessionStorage);
    if (!session?.sessionToken) return;

    setAddingDay(true);
    try {
      const outcome = await patchTrip(
        {
          tripId,
          sessionToken: session.sessionToken,
          expectedVersion: trip.version,
          endDate: nextDay,
        },
        {
          fetch: globalThis.fetch.bind(globalThis),
          apiBaseUrl: defaultApiBaseUrl(),
        },
      );
      if (!outcome.ok) return;
      setTrip(outcome.trip);
      setSelectedDay(outcome.trip.endDate);
    } finally {
      setAddingDay(false);
    }
  }

  const dayMapPins = mapPinsFromDayStops(dayStops);
  const dayMapPinCount = dayMapPins.length;

  async function runDayPlanAssist(mode: DayPlanAssistMode) {
    if (!trip || !activeDay || !planVariantId || assistPending) return;
    if (mode === "autoRoute" && dayMapPinCount < 2) return;

    const session = loadMemberSession(window.sessionStorage);
    if (!session?.sessionToken) return;

    const selectedItemIds = detailsStop
      ? [detailsStop.id]
      : dayStops.map((s) => s.id);
    const otherDays =
      itineraryModel?.days
        .filter((d) => d.day !== activeDay)
        .map((d) => ({
          day: d.day,
          stopCount: d.items.length,
          summary: d.items[0]?.activity ?? "",
        })) ?? [];

    setAssistPending(true);
    try {
      const outcome = await requestDayPlanAssist(
        {
          tripId,
          sessionToken: session.sessionToken,
          clientMutationId: nextAssistClientMutationId(),
          mode,
          day: activeDay,
          planVariantId,
          selectedItemIds,
          selectedFields: [...ASSIST_SELECTED_FIELDS],
          mapPins: dayMapPins,
          context: {
            direct: {
              day: activeDay,
              stops: dayStops.map((stop) => ({
                id: stop.id,
                activity: stop.activity,
                activityType: stop.activityType,
                place: stop.place,
                startTime: stop.startTime,
                endTime: stop.endTime ?? null,
                mapLink: stop.mapLink,
                coordinates: stop.coordinates ?? null,
                selectedFields: {
                  activity: stop.activity,
                  activityType: stop.activityType,
                  place: stop.place,
                },
              })),
              mapPins: dayMapPins,
            },
            indirect: {
              trip: {
                id: trip.id,
                name: trip.name,
                destinationLabel: trip.destinationLabel,
                startDate: trip.startDate,
                endDate: trip.endDate,
              },
              mainPlanId: trip.mainTripPlanId,
              selectedPlanId: planVariantId,
              otherDays,
              members: [],
              constraints: [],
              linkedBookings: [],
              linkedEstimates: [],
              linkedCommitments: [],
              priorOutcomes: [],
            },
          },
        },
        {
          fetch: globalThis.fetch.bind(globalThis),
          apiBaseUrl: defaultApiBaseUrl(),
        },
      );
      if (!outcome.ok) return;
      setAiSuggestions(
        optionsToAiSuggestions(
          outcome.batchId,
          outcome.options,
          dayStops[0]?.id ?? null,
        ),
      );
    } finally {
      setAssistPending(false);
    }
  }

  return (
    <div
      className="shell flex min-h-dvh bg-(--color-page) text-(--color-text)"
      data-trip-id={tripId}
    >
      <aside
        className="rail flex w-[68px] shrink-0 flex-col items-center gap-3 border-r border-(--color-border) bg-(--color-surface) py-4"
        aria-label="Trip nav"
      >
        <div
          className="mark flex size-9 items-center justify-center rounded-lg bg-(--color-primary) text-sm font-bold text-(--color-on-primary)"
          aria-label="Joii"
        >
          J
        </div>
      </aside>

      <div className="main flex min-w-0 flex-1 flex-col">
        <header className="topbar flex items-center justify-between gap-4 border-b border-(--color-border) bg-(--color-surface) px-6 py-3.5">
          <div className="crumb flex flex-col gap-0.5">
            <div className="trip text-[13px] font-medium text-(--color-text-subtle)">
              Trip · Day view
            </div>
            <h1 className="m-0 text-lg font-semibold leading-tight">
              Day workspace
            </h1>
          </div>

          <div className="ai-actions flex flex-wrap items-center gap-2">
            <button
              type="button"
              className="btn btn-ai inline-flex h-9 items-center gap-1.5 rounded-lg border border-[#99f6e4] bg-(--color-primary-soft) px-3 text-[13px] font-semibold text-(--color-primary-strong) disabled:cursor-not-allowed disabled:opacity-50"
              title="Suggest stops, times, and fixes for this day"
              disabled={assistPending || !activeDay || !planVariantId}
              aria-describedby={
                !activeDay ? "ai-suggest-disabled-reason" : undefined
              }
              onClick={() => {
                void runDayPlanAssist("suggest");
              }}
            >
              AI suggest
            </button>
            <button
              type="button"
              className="btn btn-primary inline-flex h-9 items-center gap-1.5 rounded-lg border border-(--color-primary) bg-(--color-primary) px-3 text-[13px] font-semibold text-(--color-on-primary) disabled:cursor-not-allowed disabled:opacity-50"
              title="Proposes route + fill plans when 2+ pins exist; user Accept/Reject"
              disabled={assistPending || !activeDay || !planVariantId}
              onClick={() => {
                void runDayPlanAssist("autoRoute");
              }}
            >
              Auto route & fill
            </button>
            <nav
              className="view-switch inline-flex overflow-hidden rounded-lg border border-(--color-border) bg-(--color-surface-muted)"
              aria-label="Itinerary view"
            >
              <a
                href={tableHref}
                className="px-3.5 py-2 text-[13px] font-medium text-(--color-text-muted) no-underline"
              >
                Table
              </a>
              <a
                href={daysHref}
                aria-current="page"
                className="bg-(--color-surface) px-3.5 py-2 text-[13px] font-medium text-(--color-primary-strong) no-underline shadow-[inset_0_0_0_1px_var(--color-border)]"
              >
                Days
              </a>
            </nav>
          </div>
          {!activeDay ? (
            <p
              id="ai-suggest-disabled-reason"
              className="m-0 mt-1.5 text-[12px] text-(--color-text-muted)"
            >
              Available when a day is active
            </p>
          ) : null}
        </header>

        {loadError ? (
          <div
            role="alert"
            className="flex items-center gap-3 border-b border-(--color-border) px-6 py-3 text-sm text-(--color-text)"
          >
            <span>{loadError}</span>
            <button
              type="button"
              className="rounded-lg border border-(--color-border) bg-(--color-surface) px-3 py-1.5 text-[13px] font-medium"
              onClick={reloadCockpit}
            >
              Retry
            </button>
          </div>
        ) : null}

        {spineDays.length > 0 ? (
          <DayFolderTabs
            days={spineDays}
            selectedDay={activeDay}
            onSelectDay={(day) => {
              setSelectedDay(day);
              setSelectedStop(null);
              setAiSuggestions([]);
            }}
            onAddDay={() => {
              void handleAddDay();
            }}
          />
        ) : null}

        <div className="workspace grid min-h-0 flex-1 grid-cols-1 items-start gap-5 bg-(--color-page) p-6 min-[960px]:grid-cols-[minmax(0,1.15fr)_minmax(280px,0.85fr)]">
          <DayMap
            stops={dayStops.map((stop) => ({
              id: stop.id,
              activity: stop.activity,
              coordinates: stop.coordinates ?? null,
              mapLink: stop.mapLink,
            }))}
            onAutoRoute={() => {
              void runDayPlanAssist("autoRoute");
            }}
          />

          <div className="stack flex min-w-0 flex-col gap-4">
            <section
              className="panel min-w-0 flex-1 rounded-xl border border-(--color-border) bg-(--color-surface) p-4"
              aria-label="Day canvas"
            >
              {activeDay && planVariantId ? (
                <DayTimeline
                  stops={timelineStops}
                  tripId={tripId}
                  planVariantId={planVariantId}
                  day={activeDay}
                  sessionToken={sessionToken}
                  apiBaseUrl={defaultApiBaseUrl()}
                  reorderEnabled
                  selectedStopId={detailsStop?.id ?? null}
                  onSelectStop={setSelectedStop}
                  onCockpitReload={reloadCockpit}
                  aiSuggestions={aiSuggestions}
                  onAiBatchResolved={({ openOptionIds, batchId }) => {
                    setAiSuggestions((prev) =>
                      prev.filter(
                        (s) =>
                          s.batchId !== batchId ||
                          openOptionIds.includes(s.option.id),
                      ),
                    );
                  }}
                />
              ) : loadError ? (
                <div className="flex flex-wrap items-center gap-2">
                  <a
                    href={tableHref}
                    className="inline-flex h-9 items-center rounded-lg border border-(--color-primary) bg-(--color-primary) px-3 text-[13px] font-semibold text-(--color-on-primary) no-underline"
                  >
                    Open Table
                  </a>
                </div>
              ) : !loadSettled ? null : (
                <div className="flex flex-wrap items-center gap-2">
                  <p className="m-0 w-full text-[13px] text-(--color-text-muted)">
                    No Plan Day spine yet — recover from here.
                  </p>
                  <a
                    href={tableHref}
                    className="inline-flex h-9 items-center rounded-lg border border-(--color-primary) bg-(--color-primary) px-3 text-[13px] font-semibold text-(--color-on-primary) no-underline"
                  >
                    Open Table
                  </a>
                  <button
                    type="button"
                    className="inline-flex h-9 items-center rounded-lg border border-(--color-border) bg-(--color-surface) px-3 text-[13px] font-medium"
                    onClick={reloadCockpit}
                  >
                    Retry
                  </button>
                  {trip ? (
                    <button
                      type="button"
                      className="inline-flex h-9 items-center rounded-lg border border-(--color-border) bg-(--color-surface) px-3 text-[13px] font-medium disabled:cursor-not-allowed disabled:opacity-50"
                      disabled={addingDay}
                      onClick={() => {
                        void handleAddDay();
                      }}
                    >
                      Add first day
                    </button>
                  ) : null}
                </div>
              )}
            </section>

            {detailsStop &&
            sessionToken &&
            typeof detailsStop.version === "number" ? (
              <div className="w-full shrink-0">
                <DayStopDetails
                  stop={{
                    id: detailsStop.id,
                    activity: detailsStop.activity,
                    note: detailsStop.note ?? "",
                    status: detailsStop.status ?? "idea",
                    version: detailsStop.version,
                  }}
                  tripId={tripId}
                  sessionToken={sessionToken}
                  apiBaseUrl={defaultApiBaseUrl()}
                  onCockpitReload={reloadCockpit}
                />
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
