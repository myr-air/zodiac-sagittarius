"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { MapLoadState } from "@/src/shared/map-load-state";
import type { TripCity } from "@/src/trip/types";
import { cn } from "@/src/lib/cn";
import {
  fitPreviewMap,
  previewMapCenter,
  type PreviewMapCoordinate,
} from "./trip-preview-map-geometry";
import { TripPreviewMapFallback, TripPreviewMapSourceBadge } from "./trip-preview-map-fallback";

const tripPreviewMapClassName =
  "trip-preview-map relative min-h-[168px] overflow-hidden rounded-[18px] border border-[color-mix(in_srgb,var(--color-route-border)_82%,white)] bg-[linear-gradient(90deg,rgb(37_99_235_/_0.07)_1px,transparent_1px),linear-gradient(0deg,rgb(37_99_235_/_0.07)_1px,transparent_1px),radial-gradient(circle_at_24%_32%,rgb(194_79_22_/_0.18),transparent_25%),radial-gradient(circle_at_76%_62%,rgb(37_99_235_/_0.18),transparent_28%),linear-gradient(160deg,rgb(255_247_237_/_0.96),rgb(239_246_255_/_0.94))] [background-size:34px_34px,34px_34px,auto,auto,auto] max-[767px]:min-h-[138px]";
const tripPreviewMapLiveClassName = "trip-preview-map--live isolate";
const tripPreviewMapReadyClassName = "trip-preview-map--ready bg-[#eef8ff]";
const tripPreviewMapCanvasClassName = "trip-preview-map-canvas absolute inset-0 z-[1]";
const tripPreviewLiveMarkerClassName =
  "trip-preview-live-marker grid size-7 place-items-center rounded-full border-2 border-white bg-(--color-primary) text-xs font-black text-white shadow-[0_10px_20px_rgb(15_23_42_/_0.22)]";

export function TripPreviewLiveMap({ originCity, destinationCities }: { originCity: TripCity; destinationCities: TripCity[] }) {
  const routeCities = useMemo(() => [originCity, ...destinationCities], [destinationCities, originCity]);
  const coordinates = useMemo(() => routeCities.map((city) => [city.longitude, city.latitude] as PreviewMapCoordinate), [routeCities]);
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<import("maplibre-gl").Map | null>(null);
  const markersRef = useRef<Array<import("maplibre-gl").Marker>>([]);
  const [mapState, setMapState] = useState<MapLoadState>("idle");
  const liveMapEnabled = process.env.NODE_ENV !== "test";

  useEffect(() => {
    if (!liveMapEnabled || destinationCities.length === 0 || !mapContainerRef.current) return undefined;
    let disposed = false;
    const markers = markersRef.current;

    async function mountMap() {
      setMapState("loading");

      try {
        const maplibregl = await import("maplibre-gl");
        const container = mapContainerRef.current;
        if (!container || disposed) return;
        container.inert = true;
        container.tabIndex = -1;

        const map = new maplibregl.Map({
          attributionControl: { compact: true },
          center: previewMapCenter(coordinates),
          container,
          interactive: false,
          style: "https://tiles.openfreemap.org/styles/positron",
          zoom: coordinates.length > 1 ? 2.4 : 3.2,
        });
        mapRef.current = map;

        coordinates.forEach((coordinate, index) => {
          const markerElement = document.createElement("span");
          markerElement.className = tripPreviewLiveMarkerClassName;
          markerElement.textContent = String(index + 1);
          markerElement.setAttribute("aria-hidden", "true");
          const marker = new maplibregl.Marker({ element: markerElement })
            .setLngLat(coordinate)
            .addTo(map);
          markers.push(marker);
        });

        map.on("load", () => {
          if (disposed) return;
          fitPreviewMap(map, coordinates);
          container.inert = false;
          setMapState("ready");
        });
        map.on("error", () => {
          if (!disposed) setMapState("error");
        });
      } catch {
        if (!disposed) setMapState("error");
      }
    }

    void mountMap();

    return () => {
      disposed = true;
      markers.forEach((marker) => marker.remove());
      markers.length = 0;
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, [coordinates, destinationCities.length, liveMapEnabled]);

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
