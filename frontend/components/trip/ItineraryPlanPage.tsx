/**
 * Itinerary plan main: Smart Itinerary Table + context rail (T6 selection).
 * T7 #1: shared per-stop field bag keeps table + rail in sync across type switches.
 */

"use client";

import { useState } from "react";
import type { StopFieldBag } from "../../src/trip/itinerary-type-fields";
import type { ItineraryTableModel } from "../../src/trip/itinerary-table-model";
import {
  ItineraryContextRail,
  type ItineraryContextSelectedItem,
} from "./ItineraryContextRail";
import { SmartItineraryTable } from "./SmartItineraryTable";

export type ItineraryPlanPageProps = {
  model: ItineraryTableModel;
  tripId?: string;
  sessionToken?: string;
  apiBaseUrl?: string;
  fetch?: typeof fetch;
  onCockpitReload?: () => void;
  /** Command-bar Reorder — when true, show draft day/stop drag grips. */
  reorderEnabled?: boolean;
};

export function ItineraryPlanPage({
  model,
  tripId,
  sessionToken,
  apiBaseUrl,
  fetch: fetchImpl,
  onCockpitReload,
  reorderEnabled = false,
}: ItineraryPlanPageProps) {
  const [selectedItem, setSelectedItem] =
    useState<ItineraryContextSelectedItem | null>(null);
  /** Calm local bags keyed by stop id (T7 #1 soft assumption — draft keys). */
  const [fieldBagById, setFieldBagById] = useState<
    Record<string, StopFieldBag>
  >({});
  const selectedId = selectedItem?.id ?? null;

  function mergeBag(itemId: string, bag: StopFieldBag) {
    setFieldBagById((prev) => ({ ...prev, [itemId]: bag }));
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
          onCockpitReload={onCockpitReload}
          selectedId={selectedId}
          reorderEnabled={reorderEnabled}
          fieldBagById={fieldBagById}
          onSelect={(next) => {
            mergeBag(next.id, next.fieldBag);
            // Draft selectStop toggle: second click on the same stop unselects.
            setSelectedItem((prev) =>
              prev?.id === next.id
                ? null
                : {
                    id: next.id,
                    activity: next.activity,
                    activityType: next.activityType,
                    status: next.status,
                    dayLabel: next.dayLabel,
                    fieldBag: next.fieldBag,
                  },
            );
          }}
          onInspectChange={(next) => {
            mergeBag(next.id, next.fieldBag);
            setSelectedItem((prev) =>
              prev?.id === next.id
                ? {
                    id: next.id,
                    activity: next.activity,
                    activityType: next.activityType,
                    status: next.status,
                    dayLabel: next.dayLabel,
                    fieldBag: next.fieldBag,
                  }
                : prev,
            );
          }}
        />
      </div>
      <ItineraryContextRail
        selectedItem={
          selectedItem
            ? {
                ...selectedItem,
                fieldBag:
                  fieldBagById[selectedItem.id] ?? selectedItem.fieldBag,
              }
            : null
        }
        tripId={tripId}
        sessionToken={sessionToken}
        apiBaseUrl={apiBaseUrl}
        fetch={fetchImpl}
        onFieldBagChange={(itemId, bag) => {
          mergeBag(itemId, bag);
          setSelectedItem((prev) =>
            prev?.id === itemId ? { ...prev, fieldBag: bag } : prev,
          );
        }}
        onRemoved={(itemId) => {
          setSelectedItem((prev) => (prev?.id === itemId ? null : prev));
          setFieldBagById((prev) => {
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
