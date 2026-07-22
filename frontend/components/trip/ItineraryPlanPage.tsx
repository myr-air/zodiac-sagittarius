/**
 * Itinerary plan main: Smart Itinerary Table + context rail (T6 selection).
 */

"use client";

import { useState } from "react";
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
};

export function ItineraryPlanPage({
  model,
  tripId,
  sessionToken,
  apiBaseUrl,
  fetch: fetchImpl,
  onCockpitReload,
}: ItineraryPlanPageProps) {
  const [selectedItem, setSelectedItem] =
    useState<ItineraryContextSelectedItem | null>(null);
  const selectedId = selectedItem?.id ?? null;

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
          onSelect={(next) => {
            // Draft selectStop toggle: second click on the same stop unselects.
            setSelectedItem((prev) =>
              prev?.id === next.id ? null : next,
            );
          }}
        />
      </div>
      <ItineraryContextRail
        selectedItem={selectedItem}
        tripId={tripId}
        sessionToken={sessionToken}
        apiBaseUrl={apiBaseUrl}
        fetch={fetchImpl}
        onRemoved={(itemId) => {
          setSelectedItem((prev) => (prev?.id === itemId ? null : prev));
          onCockpitReload?.();
        }}
      />
    </div>
  );
}
