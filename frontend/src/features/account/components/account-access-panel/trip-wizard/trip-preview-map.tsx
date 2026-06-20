"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { MapLoadState } from "@/src/shared/map-load-state";
import type { TripCity } from "@/src/trip/types";
import { cn } from "@/src/lib/cn";
import { Icon } from "@/src/ui/icons";
import { customTripCity } from "./account-trip-destinations";
import {
  fitPreviewMap,
  previewMapCenter,
  type PreviewMapCoordinate,
} from "./trip-preview-map-geometry";

const tripPreviewMapClassName =
  "trip-preview-map relative min-h-[168px] overflow-hidden rounded-[18px] border border-[color-mix(in_srgb,var(--color-route-border)_82%,white)] bg-[linear-gradient(90deg,rgb(37_99_235_/_0.07)_1px,transparent_1px),linear-gradient(0deg,rgb(37_99_235_/_0.07)_1px,transparent_1px),radial-gradient(circle_at_24%_32%,rgb(194_79_22_/_0.18),transparent_25%),radial-gradient(circle_at_76%_62%,rgb(37_99_235_/_0.18),transparent_28%),linear-gradient(160deg,rgb(255_247_237_/_0.96),rgb(239_246_255_/_0.94))] [background-size:34px_34px,34px_34px,auto,auto,auto] max-[767px]:min-h-[138px]";
const tripPreviewMapLiveClassName = "trip-preview-map--live isolate";
const tripPreviewMapReadyClassName = "trip-preview-map--ready bg-[#eef8ff]";
const tripPreviewMapCanvasClassName = "trip-preview-map-canvas absolute inset-0 z-[1]";
const tripPreviewMapFallbackClassName = "trip-preview-map-fallback absolute inset-0 z-[2]";
const tripCountrySvgFallbackClassName =
  "trip-country-svg-fallback absolute inset-3 z-[2] grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-[10px] border border-[rgb(37_99_235_/_0.14)] bg-[linear-gradient(135deg,rgb(255_255_255_/_0.76),rgb(239_246_255_/_0.58))] px-3 [&_svg]:h-[112px] [&_svg]:w-full [&_svg]:min-w-0 [&_path]:fill-[rgb(194_79_22_/_0.18)] [&_path]:stroke-[rgb(194_79_22_/_0.62)] [&_path]:stroke-[1.2px] [&_strong]:grid [&_strong]:size-11 [&_strong]:place-items-center [&_strong]:rounded-[8px] [&_strong]:bg-white [&_strong]:text-sm [&_strong]:font-black [&_strong]:text-(--color-route) [&_strong]:shadow-[0_10px_20px_rgb(15_23_42_/_0.08)]";
const tripPreviewMapSourceClassName =
  "trip-preview-map-source absolute left-2.5 top-2.5 z-[4] inline-flex min-h-7 max-w-[calc(100%_-_20px)] items-center gap-1.5 rounded-full border border-(--color-primary-border) bg-[rgb(255_255_255_/_0.9)] px-[9px] text-[11px] font-black text-(--color-primary-strong) shadow-[0_10px_18px_rgb(15_23_42_/_0.12)] [&_.icon]:size-[13px]";
const tripPreviewLiveMarkerClassName =
  "trip-preview-live-marker grid size-7 place-items-center rounded-full border-2 border-white bg-(--color-primary) text-xs font-black text-white shadow-[0_10px_20px_rgb(15_23_42_/_0.22)]";
const tripPreviewRouteLineClassName =
  "trip-preview-route-line absolute left-[28%] top-[52%] w-[44%] -rotate-[13deg] border-t-2 border-dashed border-[color-mix(in_srgb,var(--color-primary)_58%,transparent)]";
const tripPreviewPinClassName =
  "trip-preview-pin absolute z-[1] grid size-[38px] place-items-center rounded-full border border-(--color-primary-border) bg-[rgb(255_255_255_/_0.94)] text-(--color-primary-strong) shadow-[0_12px_24px_rgb(15_23_42_/_0.12)] [&_.icon]:size-[18px]";
const tripPreviewPinOriginClassName = "trip-preview-pin--origin left-[18%] top-[54%]";
const tripPreviewPinDestinationClassName = "trip-preview-pin--destination right-[18%] top-[32%] border-(--color-route-border) text-(--color-route)";

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
        <div className={tripPreviewMapFallbackClassName}>
          <FlightRouteFallback originCity={originCity} destinationCity={destinationCities[0]} />
          <span className={cn(tripPreviewPinClassName, tripPreviewPinOriginClassName)}><Icon name="location" /></span>
          <span className={cn(tripPreviewPinClassName, tripPreviewPinDestinationClassName)}><Icon name="map" /></span>
          <span className={tripPreviewRouteLineClassName} />
        </div>
      ) : null}
      <span className={tripPreviewMapSourceClassName}>
        <Icon name="map" />
        OpenFreeMap live map
      </span>
    </div>
  );
}

function FlightRouteFallback({ originCity, destinationCity }: { originCity: TripCity; destinationCity?: TripCity }) {
  const destination = destinationCity ?? customTripCity("Destination", originCity);
  return (
    <div className={tripCountrySvgFallbackClassName} aria-label={`Flight route from ${originCity.city} to ${destination.city}`}>
      <div>
        <strong>{originCity.countryCode}</strong>
        <span>{originCity.city}</span>
      </div>
      <Icon name="route" />
      <div>
        <strong>{destination.countryCode}</strong>
        <span>{destination.city}</span>
      </div>
    </div>
  );
}
