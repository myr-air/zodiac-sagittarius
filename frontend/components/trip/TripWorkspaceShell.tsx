"use client";

import { useEffect, useState, type CSSProperties } from "react";
import { defaultApiBaseUrl } from "../../src/auth/email-challenge";
import { loadMemberSession } from "../../src/landing/create-trip";
import { buildItineraryTableModel } from "../../src/trip/itinerary-table-model";
import {
  loadTripCockpit,
  type TripCockpitItineraryItem,
  type TripCockpitPlan,
  type TripCockpitTrip,
} from "../../src/trip/trip-cockpit-load";
import { ItineraryPlanPage } from "./ItineraryPlanPage";

type TripWorkspaceShellProps = {
  tripId: string;
};

/** Draft-v1 this-trip destinations — chrome placeholders until wired. */
const PLACEHOLDER_NAV = ["Map", "Members", "Expenses", "Plans"] as const;

const shellStyle = {
  display: "grid",
  gridTemplateColumns: "var(--rail) minmax(0, 1fr) var(--context)",
  "--rail": "240px",
  "--context": "320px",
  minHeight: "100dvh",
  background: "var(--color-page)",
} as CSSProperties;

const commandStyle = {
  background: "var(--color-primary)",
  color: "var(--color-on-primary)",
  borderBottom: "1px solid var(--color-primary-strong)",
} as CSSProperties;

/** Main Plan row label — id match to trip.mainTripPlanId, not API name. */
function planOptionLabel(
  plan: TripCockpitPlan,
  mainTripPlanId: string | null,
): string {
  if (plan.id === mainTripPlanId) return "Main Plan";
  return plan.name;
}

/**
 * Calm Travel Ops cockpit shell — draft-v1 grid, left-rail nav, command chrome.
 * Loads TripCockpit so create-trip seed fills the command bar on first open;
 * empty itineraryItems still materialize the day spine via ItineraryPlanPage.
 */
export function TripWorkspaceShell({ tripId }: TripWorkspaceShellProps) {
  const [trip, setTrip] = useState<TripCockpitTrip | null>(null);
  const [tripPlans, setTripPlans] = useState<TripCockpitPlan[]>([]);
  const [itineraryItems, setItineraryItems] = useState<
    TripCockpitItineraryItem[]
  >([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);
  /** Command-bar Reorder (#dnd-toggle) — default off; reveals draft drag grips. */
  const [reorderEnabled, setReorderEnabled] = useState(false);

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
        setTripPlans([]);
        setItineraryItems([]);
        return;
      }
      setLoadError(null);
      setTrip(outcome.trip);
      setTripPlans(outcome.tripPlans);
      setItineraryItems(outcome.itineraryItems);
    });

    return () => {
      cancelled = true;
    };
  }, [tripId, reloadToken]);

  const mainTripPlanId = trip?.mainTripPlanId ?? null;
  const planVariantId =
    trip?.activePlanVariantId ?? mainTripPlanId ?? null;
  const itineraryModel =
    trip && planVariantId
      ? buildItineraryTableModel({
          startDate: trip.startDate,
          endDate: trip.endDate,
          planVariantId,
          itineraryItems,
        })
      : null;
  const sessionToken = loadMemberSession(
    typeof window !== "undefined" ? window.sessionStorage : null,
  )?.sessionToken;
  const apiBaseUrl = defaultApiBaseUrl();

  return (
    <div
      id="shell"
      className="shell"
      data-trip-id={tripId}
      data-rail="expanded"
      data-dnd={reorderEnabled ? "on" : "off"}
      style={shellStyle}
    >
      <aside
        className="trip-rail border-r border-(--color-border) bg-(--color-surface)"
        aria-label="Workspace navigation"
        id="trip-rail"
      >
        <nav aria-label="This trip" className="flex flex-col gap-1 p-3">
          <a
            href={`/trips/${tripId}`}
            aria-current="page"
            className="rounded px-2 py-1.5 text-sm font-medium text-(--color-text)"
          >
            Itinerary
          </a>
          {PLACEHOLDER_NAV.map((label) => (
            <button
              key={label}
              type="button"
              className="rounded px-2 py-1.5 text-left text-sm text-(--color-text-muted)"
            >
              {label}
            </button>
          ))}
        </nav>
      </aside>
      <div
        className="main flex min-w-0 flex-col bg-(--color-page)"
        style={
          itineraryModel
            ? ({ gridColumn: "2 / 4" } as CSSProperties)
            : undefined
        }
      >
        {loadError ? (
          <div
            role="alert"
            className="flex items-center gap-3 border-b border-(--color-border) px-3 py-2 text-sm text-(--color-text)"
          >
            <span>{loadError}</span>
            <button
              type="button"
              className="rounded-lg border border-(--color-border) bg-(--color-surface) px-3 py-1.5 text-[13px] font-medium"
              onClick={() => setReloadToken((n) => n + 1)}
            >
              Retry
            </button>
          </div>
        ) : null}
        <header className="command" style={commandStyle}>
          <div className="trip-id">
            {trip ? (
              <>
                <strong>{trip.name}</strong>
                <span>
                  {trip.destinationLabel} · {trip.startDate}–{trip.endDate}
                </span>
              </>
            ) : null}
          </div>
          <div className="header-actions flex items-center gap-2">
            <nav
              className="view-switch inline-flex overflow-hidden rounded-lg border border-(--color-primary-border) bg-(--color-primary-soft)"
              aria-label="Itinerary view"
            >
              <a
                href={`/trips/${tripId}`}
                aria-current="page"
                className="bg-(--color-surface) px-3.5 py-2 text-[13px] font-medium text-(--color-primary-strong) no-underline"
              >
                Table
              </a>
              <a
                href={`/trips/${tripId}/days`}
                className="px-3.5 py-2 text-[13px] font-medium text-(--color-on-primary) no-underline opacity-90"
              >
                Days
              </a>
            </nav>
            <label className="dnd-toggle" htmlFor="dnd-toggle" title="Show drag handles to reorder days and activities">
              <input
                type="checkbox"
                id="dnd-toggle"
                checked={reorderEnabled}
                onChange={(e) => setReorderEnabled(e.target.checked)}
              />
              <span className="dnd-label">Reorder</span>
            </label>
            <button type="button" id="plan-toggle" aria-expanded="false">
              Trip Plan
            </button>
            <div
              className="plan-panel"
              id="plan-panel"
              role="listbox"
              aria-label="Trip plans"
            >
              {tripPlans.length > 0 ? (
                tripPlans.map((plan) => (
                  <div
                    key={plan.id}
                    role="option"
                    aria-selected={plan.id === mainTripPlanId}
                  >
                    {planOptionLabel(plan, mainTripPlanId)}
                  </div>
                ))
              ) : (
                <div role="option" aria-selected="true">
                  Main Plan
                </div>
              )}
            </div>
            {/* Draft-v1 Share chrome — calm stub; no share API. */}
            <button type="button" className="btn btn-primary">
              Share
            </button>
          </div>
        </header>
        {itineraryModel ? (
          <ItineraryPlanPage
            model={itineraryModel}
            tripId={tripId}
            sessionToken={sessionToken}
            apiBaseUrl={apiBaseUrl}
            fetch={fetch}
            onCockpitReload={() => setReloadToken((n) => n + 1)}
            reorderEnabled={reorderEnabled}
          />
        ) : null}
      </div>
      {itineraryModel ? null : (
        <aside
          className="context border-l border-(--color-border) bg-(--color-surface)"
          aria-label="Context inspector"
        />
      )}
    </div>
  );
}
