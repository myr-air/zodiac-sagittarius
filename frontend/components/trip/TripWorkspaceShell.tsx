"use client";

import { useEffect, useState, type CSSProperties } from "react";
import { defaultApiBaseUrl } from "../../src/auth/email-challenge";
import { loadMemberSession } from "../../src/landing/create-trip";
import { formatDateRange } from "../../src/portal/format-date-range";
import { buildItineraryTableModel } from "../../src/trip/itinerary-table-model";
import {
  loadTripCockpit,
  type TripCockpitItineraryItem,
  type TripCockpitPlan,
  type TripCockpitTrip,
} from "../../src/trip/trip-cockpit-load";
import { ItineraryImportDialog } from "./ItineraryImportDialog";
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
  /** Bumps to request a TripCockpit reload (conflict / import). */
  const [reloadNonce, setReloadNonce] = useState(0);
  /**
   * Bumps after a successful cockpit load — children clear version_conflict
   * locks (awaitingCockpitReload) only when authoritative data is in.
   */
  const [reloadToken, setReloadToken] = useState(0);
  /** Command-bar Reorder (#dnd-toggle) — default off; reveals draft drag grips. */
  const [reorderEnabled, setReorderEnabled] = useState(false);
  /**
   * Trip Plan panel — collapsed by default (draft `#plan-toggle` / `.plan-panel.open`).
   * Toggle only expands/collapses the local filter list — no set-main / navigation.
   */
  const [planPanelOpen, setPlanPanelOpen] = useState(false);
  /**
   * Client-side plan switcher selection (tripPlans row id).
   * null = Main Plan. Filter-only — no set-main / promote-main mutation.
   */
  const [selectedPlanOptionId, setSelectedPlanOptionId] = useState<
    string | null
  >(null);
  /** Command-bar Import (#btn-import) — draft itinerary import dialog. */
  const [importOpen, setImportOpen] = useState(false);
  /** Bumps remount key so ItineraryImportDialog resets via fresh useState. */
  const [importDialogKey, setImportDialogKey] = useState(0);

  /**
   * Reset the plan-switcher selection when the trip changes — adjusted
   * during render (React "storing info from previous renders" pattern)
   * rather than an effect, avoiding a synchronous setState-in-effect
   * cascade (react-hooks/set-state-in-effect) while still landing before
   * this render commits (shell sync behavior preserved).
   */
  const [prevTripId, setPrevTripId] = useState(tripId);
  if (tripId !== prevTripId) {
    setPrevTripId(tripId);
    setSelectedPlanOptionId(null);
  }

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
      setReloadToken((n) => n + 1);
    });

    return () => {
      cancelled = true;
    };
  }, [tripId, reloadNonce]);

  const mainTripPlanId = trip?.mainTripPlanId ?? null;
  const selectedOptionId = selectedPlanOptionId ?? mainTripPlanId;
  const isMainPlanSelected =
    selectedOptionId == null || selectedOptionId === mainTripPlanId;
  /** Visible itinerary filter: Main → active variant; other options → that plan’s id. */
  const planVariantId = isMainPlanSelected
    ? (trip?.activePlanVariantId ?? mainTripPlanId ?? null)
    : selectedOptionId;
  const itineraryModel =
    trip && planVariantId
      ? buildItineraryTableModel({
          startDate: trip.startDate,
          endDate: trip.endDate,
          planVariantId,
          itineraryItems,
        })
      : null;
  /** Draft subtitle “appends to Main” — Main Plan uses short label. */
  const importPlanLabel = isMainPlanSelected
    ? "Main"
    : (tripPlans.find((p) => p.id === selectedOptionId)?.name ?? "plan");
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
              onClick={() => setReloadNonce((n) => n + 1)}
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
                  {trip.destinationLabel} ·{" "}
                  {formatDateRange(trip.startDate, trip.endDate)}
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
                className="view-switch-inactive px-3.5 py-2 text-[13px] font-medium no-underline"
              >
                Days
              </a>
            </nav>
            <label
              className="dnd-toggle"
              htmlFor="dnd-toggle"
              title="Show drag handles to reorder activities"
            >
              <input
                type="checkbox"
                id="dnd-toggle"
                checked={reorderEnabled}
                onChange={(e) => setReorderEnabled(e.target.checked)}
              />
              <span className="dnd-label">Reorder</span>
            </label>
            <button
              type="button"
              id="plan-toggle"
              aria-expanded={planPanelOpen}
              aria-controls="plan-panel"
              onClick={() => setPlanPanelOpen((open) => !open)}
            >
              Trip Plan
            </button>
            <div
              className={`plan-panel${planPanelOpen ? " open" : ""}`}
              id="plan-panel"
              role="listbox"
              aria-label="Trip plans"
              hidden={!planPanelOpen}
            >
              {tripPlans.length > 0 ? (
                tripPlans.map((plan) => (
                  <div
                    key={plan.id}
                    role="option"
                    aria-selected={plan.id === selectedOptionId}
                    tabIndex={0}
                    onClick={() => setSelectedPlanOptionId(plan.id)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        setSelectedPlanOptionId(plan.id);
                      }
                    }}
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
            {/* Draft places-bulk-ingest-v1: #btn-import in command actions. */}
            <button
              type="button"
              className="btn"
              id="btn-import"
              onClick={() => {
                setImportDialogKey((n) => n + 1);
                setImportOpen(true);
              }}
            >
              Import
            </button>
            {/* Draft-v1 Share chrome — calm stub; no share API. */}
            <button type="button" className="btn btn-primary">
              Share
            </button>
          </div>
        </header>
        {itineraryModel && trip ? (
          <ItineraryPlanPage
            model={itineraryModel}
            tripId={tripId}
            tripPlanId={planVariantId ?? undefined}
            sessionToken={sessionToken}
            apiBaseUrl={apiBaseUrl}
            fetch={globalThis.fetch.bind(globalThis)}
            reloadToken={reloadToken}
            onCockpitReload={() => setReloadNonce((n) => n + 1)}
            destinationLabel={trip.destinationLabel}
            countries={trip.countries}
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
      {sessionToken && planVariantId ? (
        <ItineraryImportDialog
          key={importDialogKey}
          open={importOpen}
          tripId={tripId}
          sessionToken={sessionToken}
          apiBaseUrl={apiBaseUrl}
          planVariantId={planVariantId}
          planLabel={importPlanLabel}
          onClose={() => setImportOpen(false)}
          onImported={() => setReloadNonce((n) => n + 1)}
        />
      ) : null}
    </div>
  );
}
