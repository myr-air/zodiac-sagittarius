import { useEffect, useRef, useState } from "react";
import type { MapLoadState } from "@/src/shared/map-load-state";
import {
  fitPreviewMap,
  previewMapCenter,
  type PreviewMapCoordinate,
} from "./trip-preview-map-geometry";

const tripPreviewLiveMarkerClassName =
  "trip-preview-live-marker grid size-7 place-items-center rounded-full border-2 border-white bg-(--color-primary) text-xs font-black text-white shadow-[0_10px_20px_rgb(15_23_42_/_0.22)]";

interface UseTripPreviewLiveMapParams {
  coordinates: PreviewMapCoordinate[];
  destinationCount: number;
}

export function useTripPreviewLiveMap({
  coordinates,
  destinationCount,
}: UseTripPreviewLiveMapParams) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<import("maplibre-gl").Map | null>(null);
  const markersRef = useRef<Array<import("maplibre-gl").Marker>>([]);
  const [mapState, setMapState] = useState<MapLoadState>("idle");
  const liveMapEnabled = process.env.NODE_ENV !== "test";

  useEffect(() => {
    if (!liveMapEnabled || destinationCount === 0 || !mapContainerRef.current) return undefined;
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
  }, [coordinates, destinationCount, liveMapEnabled]);

  return {
    mapContainerRef,
    mapState,
  };
}
