"use client";

import { useMemo } from "react";
import type { TripCity } from "@/src/trip/types";
import { cn } from "@/src/lib/cn";
import type { PreviewMapCoordinate } from "./trip-preview-map-geometry";
import { TripPreviewMapFallback, TripPreviewMapSourceBadge } from "./trip-preview-map-fallback";
import { useTripPreviewLiveMap } from "./use-trip-preview-live-map";

const tripPreviewMapClassName =
  "trip-preview-map relative min-h-[168px] overflow-hidden rounded-[18px] border border-[color-mix(in_srgb,var(--color-route-border)_82%,white)] bg-[linear-gradient(90deg,rgb(37_99_235_/_0.07)_1px,transparent_1px),linear-gradient(0deg,rgb(37_99_235_/_0.07)_1px,transparent_1px),radial-gradient(circle_at_24%_32%,rgb(194_79_22_/_0.18),transparent_25%),radial-gradient(circle_at_76%_62%,rgb(37_99_235_/_0.18),transparent_28%),linear-gradient(160deg,rgb(255_247_237_/_0.96),rgb(239_246_255_/_0.94))] [background-size:34px_34px,34px_34px,auto,auto,auto] max-[767px]:min-h-[138px]";
const tripPreviewMapLiveClassName = "trip-preview-map--live isolate";
const tripPreviewMapReadyClassName = "trip-preview-map--ready bg-[#eef8ff]";
const tripPreviewMapCanvasClassName = "trip-preview-map-canvas absolute inset-0 z-[1]";

export function TripPreviewLiveMap({ originCity, destinationCities }: { originCity: TripCity; destinationCities: TripCity[] }) {
  const routeCities = useMemo(() => [originCity, ...destinationCities], [destinationCities, originCity]);
  const coordinates = useMemo(() => routeCities.map((city) => [city.longitude, city.latitude] as PreviewMapCoordinate), [routeCities]);
  const { mapContainerRef, mapState } = useTripPreviewLiveMap({
    coordinates,
    destinationCount: destinationCities.length,
  });

  return (
    <div className={cn(tripPreviewMapClassName, tripPreviewMapLiveClassName, mapState === "ready" ? tripPreviewMapReadyClassName : "")}>
      <div className={tripPreviewMapCanvasClassName} ref={mapContainerRef} aria-hidden="true" />
      {mapState !== "ready" ? (
        <TripPreviewMapFallback originCity={originCity} destinationCity={destinationCities[0]} />
      ) : null}
      <TripPreviewMapSourceBadge />
    </div>
  );
}
