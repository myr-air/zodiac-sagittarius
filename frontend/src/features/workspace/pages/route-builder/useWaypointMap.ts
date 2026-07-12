import { useCallback, useEffect, useRef, useState } from "react";
import type {
  GeoJSONSource,
  LngLat,
  Map as MapLibreMap,
  MapMouseEvent,
  Marker as MapLibreMarker,
} from "maplibre-gl";
import type { Waypoint } from "@/src/trip/waypoints/waypoint-types";
import type { MapLoadState } from "@/src/shared/map-load-state";
import {
  routeLineColor,
  routeLineLayerId,
  routeLineWidth,
  routeSourceId,
  waypointMarkerClassName,
} from "./RouteBuilderPage.styles";
import { sortWaypoints } from "./route-builder.utils";

interface UseWaypointMapInput {
  waypoints: Waypoint[];
  tripDestination?: { lat: number; lng: number; label: string };
  liveMapEnabled?: boolean;
  onMapClick?: (lngLat: [number, number]) => void;
  onWaypointMove?: (id: string, lat: number, lng: number) => void;
}

interface UseWaypointMapOutput {
  mapState: MapLoadState;
  mapContainerRef: React.RefObject<HTMLDivElement | null>;
}

export function useWaypointMap({
  waypoints,
  tripDestination,
  liveMapEnabled = process.env.NODE_ENV !== "test",
  onMapClick,
  onWaypointMove,
}: UseWaypointMapInput): UseWaypointMapOutput {
  const [mapState, setMapState] = useState<MapLoadState>("loading");
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const moduleRef = useRef<typeof import("maplibre-gl") | null>(null);
  const markersRef = useRef<Map<string, MapLibreMarker>>(new Map());
  const tileLoadTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onMapClickRef = useRef(onMapClick);
  const onWaypointMoveRef = useRef(onWaypointMove);
  const waypointsRef = useRef(waypoints);
  const tripDestinationRef = useRef(tripDestination);

  useEffect(() => {
    onMapClickRef.current = onMapClick;
  }, [onMapClick]);

  useEffect(() => {
    onWaypointMoveRef.current = onWaypointMove;
  }, [onWaypointMove]);

  useEffect(() => {
    waypointsRef.current = waypoints;
  }, [waypoints]);

  useEffect(() => {
    tripDestinationRef.current = tripDestination;
  }, [tripDestination]);

  const syncRouteLine = useCallback(
    (map: MapLibreMap, sorted: Waypoint[]) => {
      const coordinates = sorted.map((waypoint) => [waypoint.lng, waypoint.lat]);

      if (coordinates.length < 2) {
        if (map.getLayer(routeLineLayerId)) {
          map.setLayoutProperty(routeLineLayerId, "visibility", "none");
        }
        return;
      }

      if (!map.getSource(routeSourceId)) {
        map.addSource(routeSourceId, {
          type: "geojson",
          data: {
            type: "Feature",
            properties: {},
            geometry: {
              type: "LineString",
              coordinates,
            },
          },
        });
        map.addLayer({
          id: routeLineLayerId,
          type: "line",
          source: routeSourceId,
          layout: {
            "line-cap": "round",
            "line-join": "round",
          },
          paint: {
            "line-color": routeLineColor,
            "line-width": routeLineWidth,
            "line-opacity": 1,
          },
        });
      } else {
        const source = map.getSource(routeSourceId) as GeoJSONSource;
        source.setData({
          type: "Feature",
          properties: {},
          geometry: {
            type: "LineString",
            coordinates,
          },
        });
      }

      if (map.getLayer(routeLineLayerId)) {
        map.setLayoutProperty(routeLineLayerId, "visibility", "visible");
      }

      const prefersReducedMotion =
        typeof window !== "undefined" &&
        window.matchMedia?.("(prefers-reduced-motion: reduce)").matches === true;

      if (!prefersReducedMotion) {
        map.setPaintProperty(routeLineLayerId, "line-opacity", 0);
        window.setTimeout(() => {
          map.setPaintProperty(routeLineLayerId, "line-opacity", 1);
        }, 50);
      } else {
        map.setPaintProperty(routeLineLayerId, "line-opacity", 1);
      }
    },
    [],
  );

  const syncMarkers = useCallback(
    (map: MapLibreMap, maplibregl: typeof import("maplibre-gl"), sorted: Waypoint[]) => {
      const activeIds = new Set<string>();

      sorted.forEach((waypoint) => {
        activeIds.add(waypoint.id);
        const existing = markersRef.current.get(waypoint.id);

        if (existing) {
          existing.setLngLat([waypoint.lng, waypoint.lat]);
          const element = existing.getElement();
          if (element) {
            element.textContent = String(waypoint.sortOrder);
          }
          return;
        }

        const element = document.createElement("div");
        element.className = waypointMarkerClassName;
        element.textContent = String(waypoint.sortOrder);

        const marker = new maplibregl.Marker({
          element,
          draggable: true,
        })
          .setLngLat([waypoint.lng, waypoint.lat])
          .addTo(map);

        marker.on("dragend", () => {
          const lngLat: LngLat = marker.getLngLat();
          onWaypointMoveRef.current?.(waypoint.id, lngLat.lat, lngLat.lng);
        });

        markersRef.current.set(waypoint.id, marker);

        window.setTimeout(() => {
          element.style.opacity = "1";
        }, 0);
      });

      markersRef.current.forEach((marker, id) => {
        if (!activeIds.has(id)) {
          marker.remove();
          markersRef.current.delete(id);
        }
      });
    },
    [],
  );

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current || !liveMapEnabled) {
      return undefined;
    }

    let disposed = false;
    const container = mapContainerRef.current;

    async function mountMap() {
      setMapState("loading");

      try {
        const maplibregl = await import("maplibre-gl");
        if (!mapContainerRef.current || disposed) return;

        moduleRef.current = maplibregl;

        const sorted = sortWaypoints(waypointsRef.current);
        const destination = tripDestinationRef.current;
        const center: [number, number] =
          sorted.length > 0
            ? [sorted[0].lng, sorted[0].lat]
            : destination
              ? [destination.lng, destination.lat]
              : [100.9925, 15.87];
        const zoom = sorted.length > 0 ? 10 : destination ? 9 : 5;

        const map = new maplibregl.Map({
          container,
          style: "https://tiles.openfreemap.org/styles/positron",
          center,
          zoom,
          attributionControl: { compact: true },
        });

        mapRef.current = map;
        map.addControl(
          new maplibregl.NavigationControl({ showCompass: false }),
          "top-right",
        );

        const rect = container.getBoundingClientRect();
        console.log(
          "[useWaypointMap] container dimensions:",
          `${Math.round(rect.width)}×${Math.round(rect.height)}`,
        );

        map.on("sourcedata", (event: {
          isSourceLoaded: boolean;
          sourceId: string;
          source?: { type: string };
        }) => {
          if (disposed) return;
          console.log(
            "[useWaypointMap] sourcedata:",
            event.sourceId,
            "isSourceLoaded:",
            event.isSourceLoaded,
            "source type:",
            event.source?.type,
          );
          if (
            event.isSourceLoaded &&
            event.sourceId &&
            event.source?.type !== "geojson"
          ) {
            if (tileLoadTimerRef.current) {
              clearTimeout(tileLoadTimerRef.current);
              tileLoadTimerRef.current = null;
              console.log(
                "[useWaypointMap] tile source loaded, timeout cleared",
              );
            }
          }
        });

        map.on("styleimagemissing", (event: { id: string }) => {
          if (disposed) return;
          console.log(
            "[useWaypointMap] style image missing:",
            event.id,
          );
        });

        map.on("load", () => {
          if (disposed) return;
          syncMarkers(map, maplibregl, sorted);
          syncRouteLine(map, sorted);
          setMapState("ready");
          console.log(
            "[useWaypointMap] map load fired, starting tile-load timeout (4s)",
          );
          tileLoadTimerRef.current = setTimeout(() => {
            if (disposed) return;
            console.log(
              "[useWaypointMap] tile-load timeout expired, transitioning to error",
            );
            setMapState("error");
          }, 4000);
        });

        map.on("error", () => {
          if (!disposed) setMapState("error");
        });

        map.on("click", (event: MapMouseEvent) => {
          onMapClickRef.current?.([event.lngLat.lng, event.lngLat.lat]);
        });
      } catch {
        if (!disposed) setMapState("error");
      }
    }

    void mountMap();

    const markers = markersRef.current;

    return () => {
      disposed = true;
      if (tileLoadTimerRef.current) {
        clearTimeout(tileLoadTimerRef.current);
        tileLoadTimerRef.current = null;
      }
      const map = mapRef.current;
      if (map) {
        try {
          map.remove();
        } catch {
          // Ignore cleanup errors from the test environment.
        }
        mapRef.current = null;
        moduleRef.current = null;
        Array.from(markers.values()).forEach((marker) => marker.remove());
        markers.clear();
      }
    };
  }, [liveMapEnabled, syncMarkers, syncRouteLine]);

  useEffect(() => {
    const map = mapRef.current;
    const maplibregl = moduleRef.current;
    if (!map || !maplibregl || mapState !== "ready") return;

    const sorted = sortWaypoints(waypointsRef.current);
    syncMarkers(map, maplibregl, sorted);
    syncRouteLine(map, sorted);
  }, [waypoints, mapState, syncMarkers, syncRouteLine]);

  return { mapState, mapContainerRef };
}
