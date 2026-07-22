"use client";

/**
 * DayMap — MapLibre GL day map (M80VKAX5 T6).
 * Theme A left pane: auto-pins from stop coordinates; ordered polyline when ≥2 pins.
 */

import { useEffect, useRef, type CSSProperties } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

/** Calm Travel Ops route blue (DESIGN.md). */
export const DAY_MAP_ROUTE_COLOR = "#2563eb";

/** Light Calm Travel Ops basemap — OpenFreeMap Positron (OSM libre, not purple). */
export const DAY_MAP_STYLE_URL =
  "https://tiles.openfreemap.org/styles/positron";

const ROUTE_SOURCE_ID = "day-route";
const ROUTE_LAYER_ID = "day-route-line";
const ROUTE_LAYER_SOFT_ID = "day-route-line-soft";

export type DayMapStopCoordinates = {
  lat: number;
  lng: number;
};

export type DayMapStop = {
  id: string;
  activity: string;
  /** API shape { lat, lng }. */
  coordinates?: DayMapStopCoordinates | null;
  /** Alternate geo seam. */
  lat?: number;
  lng?: number;
  mapLink?: string;
};

export type DayMapProps = {
  stops?: DayMapStop[];
  /** Called when Auto route is clicked (≥2 pins). */
  onAutoRoute?: () => void;
};

type Pin = {
  id: string;
  activity: string;
  lat: number;
  lng: number;
};

function resolvePin(stop: DayMapStop): Pin | null {
  const fromCoords = stop.coordinates;
  if (
    fromCoords &&
    typeof fromCoords.lat === "number" &&
    typeof fromCoords.lng === "number" &&
    Number.isFinite(fromCoords.lat) &&
    Number.isFinite(fromCoords.lng)
  ) {
    return {
      id: stop.id,
      activity: stop.activity,
      lat: fromCoords.lat,
      lng: fromCoords.lng,
    };
  }
  if (
    typeof stop.lat === "number" &&
    typeof stop.lng === "number" &&
    Number.isFinite(stop.lat) &&
    Number.isFinite(stop.lng)
  ) {
    return {
      id: stop.id,
      activity: stop.activity,
      lat: stop.lat,
      lng: stop.lng,
    };
  }
  return null;
}

function pinsFromStops(stops: DayMapStop[]): Pin[] {
  const pins: Pin[] = [];
  for (const stop of stops) {
    const pin = resolvePin(stop);
    if (pin) pins.push(pin);
  }
  return pins;
}

function routeFeature(pins: Pin[]) {
  return {
    type: "Feature" as const,
    properties: {},
    geometry: {
      type: "LineString" as const,
      coordinates: pins.map((p) => [p.lng, p.lat]),
    },
  };
}

function syncRouteLayers(map: maplibregl.Map, pins: Pin[]): void {
  const hasRoute = pins.length >= 2;
  const existing = map.getSource?.(ROUTE_SOURCE_ID) as
    | maplibregl.GeoJSONSource
    | undefined;

  if (!hasRoute) {
    if (map.getLayer?.(ROUTE_LAYER_ID)) map.removeLayer(ROUTE_LAYER_ID);
    if (map.getLayer?.(ROUTE_LAYER_SOFT_ID)) {
      map.removeLayer(ROUTE_LAYER_SOFT_ID);
    }
    if (existing) map.removeSource(ROUTE_SOURCE_ID);
    return;
  }

  const data = routeFeature(pins);
  if (existing && typeof existing.setData === "function") {
    existing.setData(data);
    return;
  }

  map.addSource(ROUTE_SOURCE_ID, {
    type: "geojson",
    data,
  });
  map.addLayer({
    id: ROUTE_LAYER_SOFT_ID,
    type: "line",
    source: ROUTE_SOURCE_ID,
    layout: {
      "line-join": "round",
      "line-cap": "round",
    },
    paint: {
      "line-color": DAY_MAP_ROUTE_COLOR,
      "line-opacity": 0.22,
      "line-width": 8,
    },
  });
  map.addLayer({
    id: ROUTE_LAYER_ID,
    type: "line",
    source: ROUTE_SOURCE_ID,
    layout: {
      "line-join": "round",
      "line-cap": "round",
    },
    paint: {
      "line-color": DAY_MAP_ROUTE_COLOR,
      "line-width": 2.5,
    },
  });
}

function fitPins(map: maplibregl.Map, pins: Pin[]): void {
  if (pins.length === 0) return;
  try {
    if (pins.length === 1) {
      const pin = pins[0]!;
      if (typeof map.jumpTo === "function") {
        map.jumpTo({ center: [pin.lng, pin.lat], zoom: 13 });
      }
      return;
    }
    if (typeof maplibregl.LngLatBounds !== "function") return;
    if (typeof map.fitBounds !== "function") return;
    const bounds = new maplibregl.LngLatBounds(
      [pins[0]!.lng, pins[0]!.lat],
      [pins[0]!.lng, pins[0]!.lat],
    );
    for (const pin of pins) {
      bounds.extend([pin.lng, pin.lat]);
    }
    map.fitBounds(bounds, { padding: 48, maxZoom: 14 });
  } catch {
    // Mock MapLibre may omit bounds helpers.
  }
}

function makePinElement(pin: Pin, index: number): HTMLDivElement {
  const el = document.createElement("div");
  el.className = "day-map-pin pin";
  el.setAttribute("data-pin", pin.id);
  el.setAttribute("data-map-pin", String(index + 1));
  el.title = `${index + 1} · ${pin.activity}`;
  el.textContent = String(index + 1);
  Object.assign(el.style, {
    display: "grid",
    placeItems: "center",
    width: "22px",
    height: "22px",
    borderRadius: "999px",
    background: DAY_MAP_ROUTE_COLOR,
    color: "#fff",
    fontSize: "11px",
    fontWeight: "700",
    boxShadow: "0 1px 4px rgba(15, 23, 42, 0.25)",
    border: "2px solid #fff",
  });
  return el;
}

function replaceMarkers(map: maplibregl.Map, pins: Pin[]): maplibregl.Marker[] {
  return pins.map((pin, index) =>
    new maplibregl.Marker({ element: makePinElement(pin, index) })
      .setLngLat([pin.lng, pin.lat])
      .addTo(map),
  );
}

/**
 * Interactive MapLibre day map with Calm Travel Ops light basemap and route blue.
 */
export function DayMap({ stops = [], onAutoRoute }: DayMapProps) {
  const pins = pinsFromStops(stops);
  const pinCount = pins.length;
  const hasRoute = pinCount >= 2;
  const pinsKey = pins.map((p) => `${p.id}:${p.lat}:${p.lng}`).join("|");

  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);
  const pinsRef = useRef(pins);
  pinsRef.current = pins;

  useEffect(() => {
    const container = containerRef.current;
    if (!container || mapRef.current) return;

    const map = new maplibregl.Map({
      container,
      style: DAY_MAP_STYLE_URL,
      center: [98.986, 18.787],
      zoom: 11,
    });
    map.addControl(
      new maplibregl.NavigationControl({ showCompass: false }),
      "top-right",
    );
    mapRef.current = map;

    const applyOverlays = () => {
      const current = pinsRef.current;
      for (const marker of markersRef.current) {
        marker.remove();
      }
      markersRef.current = replaceMarkers(map, current);
      try {
        syncRouteLayers(map, current);
        fitPins(map, current);
      } catch {
        // Style may not be ready yet; load handler retries.
      }
    };

    map.on("load", applyOverlays);
    // Mocks never fire load — sync immediately so Marker / addSource are exercised.
    applyOverlays();

    return () => {
      for (const marker of markersRef.current) {
        marker.remove();
      }
      markersRef.current = [];
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const current = pinsRef.current;

    for (const marker of markersRef.current) {
      marker.remove();
    }
    markersRef.current = replaceMarkers(map, current);

    try {
      syncRouteLayers(map, current);
      fitPins(map, current);
    } catch {
      // Wait for style load.
    }
  }, [pinsKey]);

  function handleAutoRoute() {
    if (pinCount < 2) return;
    onAutoRoute?.();
  }

  const routeTokenStyle = {
    "--color-route": DAY_MAP_ROUTE_COLOR,
  } as CSSProperties;

  return (
    <section
      className="panel flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-xl border border-(--color-border) bg-(--color-surface)"
      aria-label="Day map"
      data-map-engine="maplibre"
      data-route-color={DAY_MAP_ROUTE_COLOR}
      data-pin-count={String(pinCount)}
      data-has-route={hasRoute ? "true" : "false"}
      style={routeTokenStyle}
    >
      <div className="panel-head flex items-center justify-between gap-3 border-b border-(--color-border) px-4 py-3">
        <h2 className="m-0 text-[13px] font-semibold text-(--color-text)">
          Map
        </h2>
        <div className="ai-actions flex items-center gap-2">
          <span className="chip rounded-full bg-(--color-route-soft) px-2 py-1 text-[11px] font-semibold text-(--color-route)">
            {pinCount} {pinCount === 1 ? "stop" : "stops"}
          </span>
          <button
            type="button"
            className="btn btn-ai h-7 rounded-lg border border-[#99f6e4] bg-(--color-primary-soft) px-2.5 text-[11px] font-medium text-(--color-primary-strong) disabled:cursor-not-allowed disabled:opacity-50"
            disabled={pinCount < 2}
            title={
              pinCount < 2
                ? "Enabled when 2+ stops have coordinates"
                : "Auto route"
            }
            onClick={handleAutoRoute}
          >
            Auto route
          </button>
        </div>
      </div>

      <div
        ref={containerRef}
        className="map relative min-h-[280px] flex-1 bg-[linear-gradient(180deg,#f8fafc_0%,#eef2f7_100%)]"
        aria-label="Day route map"
      />

      <p className="route-hint m-0 border-t border-(--color-border) px-4 py-2 text-[11px] leading-snug text-(--color-text-muted)">
        Path follows stop order (1→2→…). Auto route needs 2+ pinned stops — one
        stop stays pin-only.
      </p>
    </section>
  );
}
