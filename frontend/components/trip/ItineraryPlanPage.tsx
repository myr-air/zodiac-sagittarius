/**
 * Itinerary plan main: Smart Itinerary Table + context rail (T6 selection).
 * T7 #1: shared per-stop field bag keeps table + rail in sync across type switches.
 * M81DDKSC T4: selection carries version so the rail can PATCH mappable fields.
 * Must-fix: rail PATCH applies returned summary version; conflict reloads cockpit.
 * M82LQRZD T7 #1: loads GET plan-checks/latest once for the visible plan
 * (deps: tripId/sessionToken/apiBaseUrl/fetch/tripPlanId — NOT model, so
 * ordinary itinerary edits and cockpit reloads never auto-rerun a check),
 * derives planCheckFindingsByStop (groupFindingsByStop) + planCheckMode for
 * SmartItineraryTable + ItineraryContextRail, and wires rail Run check
 * (POST plan-checks) and suggestion triage (PATCH plan-suggestions/{id}).
 */

"use client";

import { useEffect, useState } from "react";
import type { StopFieldBag } from "../../src/trip/itinerary-type-fields";
import type { ItineraryTableModel } from "../../src/trip/itinerary-table-model";
import type { TripCockpitItineraryItem } from "../../src/trip/trip-cockpit-load";
import {
  loadLatestPlanCheck,
  patchPlanSuggestion,
  runPlanCheck,
  type PatchPlanSuggestionOutcome,
  type PlanCheckSummary,
  type PlanSuggestionSummary,
} from "../../src/trip/plan-check-api";
import { groupFindingsByStop, planPendingTotal } from "../../src/trip/plan-check-model";
import {
  ItineraryContextRail,
  type ItineraryContextSelectedItem,
} from "./ItineraryContextRail";
import { SmartItineraryTable } from "./SmartItineraryTable";

export type ItineraryPlanPageProps = {
  model: ItineraryTableModel;
  tripId?: string;
  /** Visible trip plan (variant) id — scopes plan-check GET/POST when set. */
  tripPlanId?: string;
  sessionToken?: string;
  apiBaseUrl?: string;
  fetch?: typeof fetch;
  /**
   * Bumps when parent finishes TripCockpit reload — clears conflict lock
   * so inline PATCH can resume with authoritative versions.
   */
  reloadToken?: number;
  onCockpitReload?: () => void;
  /** Trip destination label for place resolve context. */
  destinationLabel?: string;
  /** Trip countries for place resolve context. */
  countries?: string[];
  /** Command-bar Reorder — when true, show draft day/stop drag grips. */
  reorderEnabled?: boolean;
};

function versionForItem(
  model: ItineraryTableModel,
  itemId: string,
): number | undefined {
  for (const day of model.days) {
    for (const item of day.items) {
      if (item.id === itemId) return item.version;
      for (const child of item.children ?? []) {
        if (child.id === itemId) return child.version;
      }
    }
  }
  return undefined;
}

export function ItineraryPlanPage({
  model,
  tripId,
  tripPlanId,
  sessionToken,
  apiBaseUrl,
  fetch: fetchImpl,
  reloadToken = 0,
  onCockpitReload,
  destinationLabel,
  countries,
  reorderEnabled = false,
}: ItineraryPlanPageProps) {
  const [selectedItem, setSelectedItem] =
    useState<ItineraryContextSelectedItem | null>(null);
  /** Calm local bags keyed by stop id (T7 #1 soft assumption — draft keys). */
  const [fieldBagById, setFieldBagById] = useState<
    Record<string, StopFieldBag>
  >({});
  /** Successful rail DELETEs — table drops locally without cockpit round-trip. */
  const [removedItemIds, setRemovedItemIds] = useState<Set<string>>(
    () => new Set(),
  );
  /**
   * Successful rail PATCH summaries — prefer over model so next edit uses the
   * returned expectedVersion (and table stays aligned).
   */
  const [itemOverrides, setItemOverrides] = useState<
    Record<string, TripCockpitItineraryItem>
  >({});
  const selectedId = selectedItem?.id ?? null;

  /** Latest plan-check summary for the visible plan (null = never checked). */
  const [planCheckSummary, setPlanCheckSummary] =
    useState<PlanCheckSummary | null>(null);
  /** Distinguishes "not loaded yet" from a loaded-but-null (never-checked) summary. */
  const [planCheckLoaded, setPlanCheckLoaded] = useState(false);

  const planCheckDepsReady = Boolean(
    tripId && sessionToken && apiBaseUrl && fetchImpl,
  );

  async function reloadLatestPlanCheck() {
    if (!(tripId && sessionToken && apiBaseUrl && fetchImpl)) return;
    const outcome = await loadLatestPlanCheck(
      { tripId, sessionToken, tripPlanId },
      { fetch: fetchImpl, apiBaseUrl },
    );
    if (outcome.ok) {
      setPlanCheckSummary(outcome.planCheck);
      setPlanCheckLoaded(true);
    }
    // Failed load: leave unloaded — do not claim "never checked".
  }

  /**
   * Load-once-on-active — deps intentionally exclude `model` so ordinary
   * itinerary edits and TripCockpit reloads never re-trigger the GET or an
   * implicit re-check (M82LQRZD T7 #1).
   */
  useEffect(() => {
    if (!planCheckDepsReady) return;
    let cancelled = false;
    void (async () => {
      if (!(tripId && sessionToken && apiBaseUrl && fetchImpl)) return;
      const outcome = await loadLatestPlanCheck(
        { tripId, sessionToken, tripPlanId },
        { fetch: fetchImpl, apiBaseUrl },
      );
      if (cancelled) return;
      if (outcome.ok) {
        setPlanCheckSummary(outcome.planCheck);
        setPlanCheckLoaded(true);
      }
      // Failed load: leave unloaded — do not claim "never checked".
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tripId, sessionToken, apiBaseUrl, fetchImpl, tripPlanId]);

  const planCheckFindingsByStop = planCheckSummary
    ? groupFindingsByStop(planCheckSummary)
    : undefined;
  const planPendingCount = planCheckSummary
    ? planPendingTotal(planCheckSummary)
    : undefined;
  const planCheckMode = !planCheckLoaded
    ? undefined
    : planCheckSummary === null
      ? "never"
      : planCheckSummary.stale
        ? "stale"
        : (planPendingCount ?? 0) === 0
          ? "clean"
          : "idle";

  async function handleRunPlanCheck() {
    if (!(tripId && sessionToken && apiBaseUrl && fetchImpl)) return;
    const outcome = await runPlanCheck(
      { tripId, sessionToken, tripPlanId },
      { fetch: fetchImpl, apiBaseUrl },
    );
    if (outcome.ok) {
      setPlanCheckSummary(outcome.planCheck);
      setPlanCheckLoaded(true);
    }
  }

  function mergePlanSuggestion(suggestion: PlanSuggestionSummary) {
    setPlanCheckSummary((prev) =>
      prev
        ? {
            ...prev,
            suggestions: prev.suggestions.map((s) =>
              s.id === suggestion.id ? suggestion : s,
            ),
          }
        : prev,
    );
  }

  function handlePlanSuggestionTriage(args: {
    suggestionId: string;
    status: "accepted" | "dismissed" | "snoozed";
    expectedVersion: number;
    snoozedUntil?: string;
  }): Promise<PatchPlanSuggestionOutcome> | void {
    if (!(tripId && sessionToken && apiBaseUrl && fetchImpl)) return;
    return (async () => {
      const outcome = await patchPlanSuggestion(
        {
          tripId,
          suggestionId: args.suggestionId,
          sessionToken,
          expectedVersion: args.expectedVersion,
          status: args.status,
          ...(args.snoozedUntil !== undefined
            ? { snoozedUntil: args.snoozedUntil }
            : {}),
        },
        { fetch: fetchImpl, apiBaseUrl },
      );
      if (outcome.ok) {
        mergePlanSuggestion(outcome.suggestion);
      }
      return outcome;
    })();
  }

  function mergeBag(itemId: string, bag: StopFieldBag) {
    setFieldBagById((prev) => ({ ...prev, [itemId]: bag }));
  }

  function resolveVersion(itemId: string): number | undefined {
    return itemOverrides[itemId]?.version ?? versionForItem(model, itemId);
  }

  function toSelected(
    next: {
      id: string;
      activity: string;
      activityType: string;
      status: string;
      dayLabel: string;
      fieldBag: StopFieldBag;
    },
  ): ItineraryContextSelectedItem {
    return {
      id: next.id,
      activity: next.activity,
      activityType: next.activityType,
      status: next.status,
      dayLabel: next.dayLabel,
      fieldBag: next.fieldBag,
      version: resolveVersion(next.id),
    };
  }

  return (
    <div className="itinerary-plan-page flex min-w-0 flex-1">
      <div className="itinerary-plan-main min-w-0 flex-1">
        <SmartItineraryTable
          model={model}
          tripId={tripId}
          sessionToken={sessionToken}
          apiBaseUrl={apiBaseUrl}
          fetch={fetchImpl}
          reloadToken={reloadToken}
          onCockpitReload={onCockpitReload}
          destinationLabel={destinationLabel}
          countries={countries}
          selectedId={selectedId}
          reorderEnabled={reorderEnabled}
          fieldBagById={fieldBagById}
          removedItemIds={removedItemIds}
          externalItemOverrides={itemOverrides}
          planCheckFindingsByStop={planCheckFindingsByStop}
          onSelect={(next) => {
            mergeBag(next.id, next.fieldBag);
            // Draft selectStop toggle: second click on the same stop unselects.
            setSelectedItem((prev) =>
              prev?.id === next.id ? null : toSelected(next),
            );
          }}
          onInspectChange={(next) => {
            mergeBag(next.id, next.fieldBag);
            setSelectedItem((prev) =>
              prev?.id === next.id ? toSelected(next) : prev,
            );
          }}
        />
      </div>
      <ItineraryContextRail
        selectedItem={
          selectedItem
            ? {
                ...selectedItem,
                version: resolveVersion(selectedItem.id),
                fieldBag:
                  fieldBagById[selectedItem.id] ?? selectedItem.fieldBag,
              }
            : null
        }
        tripId={tripId}
        sessionToken={sessionToken}
        apiBaseUrl={apiBaseUrl}
        fetch={fetchImpl}
        reloadToken={reloadToken}
        onCockpitReload={onCockpitReload}
        planCheckMode={planCheckMode}
        planPendingCount={planPendingCount}
        onRunPlanCheck={handleRunPlanCheck}
        planCheckFindingsByStop={planCheckFindingsByStop}
        onPlanSuggestionTriage={handlePlanSuggestionTriage}
        onPlanCheckReload={reloadLatestPlanCheck}
        onPlanSuggestionResolved={mergePlanSuggestion}
        onFieldBagChange={(itemId, bag) => {
          mergeBag(itemId, bag);
          setSelectedItem((prev) =>
            prev?.id === itemId ? { ...prev, fieldBag: bag } : prev,
          );
        }}
        onPatched={(item) => {
          setItemOverrides((prev) => ({ ...prev, [item.id]: item }));
          setSelectedItem((prev) =>
            prev?.id === item.id
              ? {
                  ...prev,
                  activity: item.activity,
                  activityType: item.activityType,
                  status: item.status,
                  version: item.version,
                }
              : prev,
          );
        }}
        onRemoved={(itemId) => {
          setRemovedItemIds((prev) => {
            const next = new Set(prev);
            next.add(itemId);
            return next;
          });
          setSelectedItem((prev) => (prev?.id === itemId ? null : prev));
          setFieldBagById((prev) => {
            const next = { ...prev };
            delete next[itemId];
            return next;
          });
          setItemOverrides((prev) => {
            const next = { ...prev };
            delete next[itemId];
            return next;
          });
          onCockpitReload?.();
        }}
      />
    </div>
  );
}
