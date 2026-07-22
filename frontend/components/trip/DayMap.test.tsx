/**
 * @vitest-environment happy-dom
 *
 * DayMap — MapLibre GL day map (M80VKAX5 T6).
 * Landmarks from day-workspace-theme-a-draft-v9.html:
 *   <section aria-label="Day map"> … Auto route …
 *   <div class="map" aria-label="Day route map"> pins + ordered polyline
 *
 * No real WebGL: maplibre-gl is mocked at the module boundary.
 * Pins from stop coordinates (API shape { lat, lng }) or lat/lng props.
 * Ordered route / Auto route only when ≥2 geo pins.
 * DOM: bunfig.toml preloads test/happy-dom-setup.ts for RTL under bun test.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  cleanup,
  render,
  screen,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom/vitest";

/** Calm Travel Ops route blue — independent DESIGN.md / draft literal. */
const ROUTE_BLUE = "#2563eb";
const DAY_MAP_LABEL = /Day map/i;
const AUTO_ROUTE_LABEL = /^Auto route$/i;

/** Chiang Mai stop literals with geo (independent of production helpers). */
const STOP_A_ID = "item-wat-chedi";
const STOP_A_TITLE = "Wat Chedi Luang";
const STOP_A_LAT = 18.787;
const STOP_A_LNG = 98.986;

const STOP_B_ID = "item-khao-soi";
const STOP_B_TITLE = "Khao Soi lunch";
const STOP_B_LAT = 18.8;
const STOP_B_LNG = 98.968;

const STOP_C_ID = "item-doi-suthep";
const STOP_C_TITLE = "Doi Suthep";
const STOP_C_LAT = 18.805;
const STOP_C_LNG = 98.921;

type MapInstance = {
  addSource: ReturnType<typeof vi.fn>;
  addLayer: ReturnType<typeof vi.fn>;
  addControl: ReturnType<typeof vi.fn>;
  on: ReturnType<typeof vi.fn>;
  remove: ReturnType<typeof vi.fn>;
  fitBounds: ReturnType<typeof vi.fn>;
  getSource: ReturnType<typeof vi.fn>;
};

const maplibreMocks = vi.hoisted(() => {
  const mapInstances: MapInstance[] = [];
  const Map = vi.fn(function MockMap(this: MapInstance) {
    const instance: MapInstance = {
      addSource: vi.fn(),
      addLayer: vi.fn(),
      addControl: vi.fn(),
      on: vi.fn(),
      remove: vi.fn(),
      fitBounds: vi.fn(),
      getSource: vi.fn(),
    };
    mapInstances.push(instance);
    Object.assign(this, instance);
    return this;
  });
  const Marker = vi.fn(function MockMarker(this: {
    setLngLat: ReturnType<typeof vi.fn>;
    addTo: ReturnType<typeof vi.fn>;
    remove: ReturnType<typeof vi.fn>;
  }) {
    const api = {
      setLngLat: vi.fn().mockReturnThis(),
      addTo: vi.fn().mockReturnThis(),
      remove: vi.fn(),
    };
    Object.assign(this, api);
    return this;
  });
  return { Map, Marker, mapInstances };
});

vi.mock("maplibre-gl", () => ({
  Map: maplibreMocks.Map,
  Marker: maplibreMocks.Marker,
  NavigationControl: vi.fn(),
  default: {
    Map: maplibreMocks.Map,
    Marker: maplibreMocks.Marker,
    NavigationControl: vi.fn(),
  },
}));

// Production component under T6 — intentionally absent at RED.
import { DayMap } from "./DayMap";

afterEach(() => {
  cleanup();
  maplibreMocks.Map.mockClear();
  maplibreMocks.Marker.mockClear();
  maplibreMocks.mapInstances.length = 0;
});

beforeEach(() => {
  maplibreMocks.mapInstances.length = 0;
});

function latestMap(): MapInstance {
  expect(maplibreMocks.mapInstances.length).toBeGreaterThan(0);
  return maplibreMocks.mapInstances[maplibreMocks.mapInstances.length - 1]!;
}

function hasRouteSignal(mapRegion: HTMLElement, map: MapInstance): boolean {
  if (mapRegion.getAttribute("data-has-route") === "true") return true;
  if (mapRegion.querySelector("[data-has-route='true']")) return true;

  const sourcePayloads = map.addSource.mock.calls.map((call) => call[1]);
  const layerIds = map.addLayer.mock.calls.map((call) => {
    const spec = call[0] as { type?: string; id?: string };
    return spec;
  });

  const geoHasLine = sourcePayloads.some((payload) => {
    if (!payload || typeof payload !== "object") return false;
    const data = (payload as { data?: { type?: string; geometry?: { type?: string } } })
      .data;
    if (!data) return false;
    if (data.type === "Feature" && data.geometry?.type === "LineString") {
      return true;
    }
    if (
      data.type === "FeatureCollection" &&
      Array.isArray((data as { features?: unknown[] }).features)
    ) {
      return ((data as { features: Array<{ geometry?: { type?: string } }> }).features).some(
        (f) => f.geometry?.type === "LineString",
      );
    }
    return false;
  });
  if (geoHasLine) return true;

  return layerIds.some(
    (spec) =>
      spec?.type === "line" ||
      (typeof spec?.id === "string" && /route|line|polyline/i.test(spec.id)),
  );
}

describe("DayMap MapLibre shell (T6 #1)", () => {
  it("mounts a Day map region, uses MapLibre engine, and auto-pins stops with coordinates", () => {
    render(
      <DayMap
        stops={[
          {
            id: STOP_A_ID,
            activity: STOP_A_TITLE,
            coordinates: { lat: STOP_A_LAT, lng: STOP_A_LNG },
          },
          {
            id: STOP_B_ID,
            activity: STOP_B_TITLE,
            // lat/lng props accepted as an alternate geo seam
            lat: STOP_B_LAT,
            lng: STOP_B_LNG,
          },
          {
            id: STOP_C_ID,
            activity: STOP_C_TITLE,
            mapLink: "https://maps.google.com/?q=no-geo-here",
          },
        ]}
      />,
    );

    const mapRegion = screen.getByRole("region", { name: DAY_MAP_LABEL });
    expect(mapRegion).toBeInTheDocument();

    const engineHost =
      mapRegion.matches("[data-map-engine]")
        ? mapRegion
        : mapRegion.querySelector("[data-map-engine]");
    const engineAttr = engineHost?.getAttribute("data-map-engine");
    const mapConstructed = maplibreMocks.Map.mock.calls.length > 0;
    expect(mapConstructed || engineAttr === "maplibre").toBe(true);

    // Light Calm Travel Ops basemap — route blue token present on map chrome.
    const routeTokenHost =
      mapRegion.querySelector("[data-route-color]") ?? mapRegion;
    const routeColor =
      routeTokenHost.getAttribute("data-route-color") ??
      getComputedStyle(routeTokenHost).getPropertyValue("--color-route").trim();
    expect(routeColor.toLowerCase()).toBe(ROUTE_BLUE);

    const pinCountAttr =
      mapRegion.getAttribute("data-pin-count") ??
      mapRegion.querySelector("[data-pin-count]")?.getAttribute("data-pin-count");
    const pinNodes = mapRegion.querySelectorAll(
      "[data-pin], .pin, [data-map-pin]",
    );
    const markerCalls = maplibreMocks.Marker.mock.calls.length;

    // Two geo stops pin; mapLink-only without parseable geo does not.
    const observedPins = Number(
      pinCountAttr ??
        (pinNodes.length > 0 ? pinNodes.length : markerCalls),
    );
    expect(observedPins).toBe(2);
  });
});

describe("DayMap ordered polyline + Auto route gate (T6 #2)", () => {
  it("draws an ordered polyline only when ≥2 pins; Auto route no-ops below that", async () => {
    const user = userEvent.setup();
    const onAutoRoute = vi.fn();

    const { rerender } = render(
      <DayMap
        stops={[
          {
            id: STOP_A_ID,
            activity: STOP_A_TITLE,
            coordinates: { lat: STOP_A_LAT, lng: STOP_A_LNG },
          },
        ]}
        onAutoRoute={onAutoRoute}
      />,
    );

    const mapRegion = screen.getByRole("region", { name: DAY_MAP_LABEL });
    const autoRoute = within(mapRegion).getByRole("button", {
      name: AUTO_ROUTE_LABEL,
    });

    // Single pin: pin only — no ordered route; Auto route disabled or no-op.
    const pinCountOne =
      mapRegion.getAttribute("data-pin-count") ??
      mapRegion
        .querySelector("[data-pin-count]")
        ?.getAttribute("data-pin-count") ??
      String(maplibreMocks.Marker.mock.calls.length || 1);
    expect(Number(pinCountOne)).toBe(1);

    if (maplibreMocks.mapInstances.length > 0) {
      expect(hasRouteSignal(mapRegion, latestMap())).toBe(false);
    } else {
      expect(mapRegion.getAttribute("data-has-route")).not.toBe("true");
    }

    const disabledWhenSparse = autoRoute.hasAttribute("disabled");
    await user.click(autoRoute);
    if (!disabledWhenSparse) {
      expect(onAutoRoute).not.toHaveBeenCalled();
    } else {
      expect(onAutoRoute).not.toHaveBeenCalled();
    }

    // ≥2 pins: ordered polyline / route signal; Auto route callable.
    maplibreMocks.Map.mockClear();
    maplibreMocks.Marker.mockClear();
    maplibreMocks.mapInstances.length = 0;
    onAutoRoute.mockClear();

    rerender(
      <DayMap
        stops={[
          {
            id: STOP_A_ID,
            activity: STOP_A_TITLE,
            coordinates: { lat: STOP_A_LAT, lng: STOP_A_LNG },
          },
          {
            id: STOP_B_ID,
            activity: STOP_B_TITLE,
            coordinates: { lat: STOP_B_LAT, lng: STOP_B_LNG },
          },
        ]}
        onAutoRoute={onAutoRoute}
      />,
    );

    const mapRegion2 = screen.getByRole("region", { name: DAY_MAP_LABEL });
    const pinCountTwo =
      mapRegion2.getAttribute("data-pin-count") ??
      mapRegion2
        .querySelector("[data-pin-count]")
        ?.getAttribute("data-pin-count");
    if (pinCountTwo != null) {
      expect(Number(pinCountTwo)).toBe(2);
    } else {
      expect(maplibreMocks.Marker.mock.calls.length).toBeGreaterThanOrEqual(2);
    }

    if (maplibreMocks.mapInstances.length > 0) {
      expect(hasRouteSignal(mapRegion2, latestMap())).toBe(true);
    } else {
      expect(mapRegion2.getAttribute("data-has-route")).toBe("true");
    }

    const autoRouteReady = within(mapRegion2).getByRole("button", {
      name: AUTO_ROUTE_LABEL,
    });
    expect(autoRouteReady).not.toBeDisabled();
    await user.click(autoRouteReady);
    expect(onAutoRoute).toHaveBeenCalledTimes(1);
  });
});

/** Purple AI chrome must not appear (Theme A — teal Calm Travel Ops). */
const PURPLE_CLASS = /purple|violet|indigo|fuchsia/i;
const PURPLE_HEX = /#(?:7c3aed|8b5cf6|a855f7|9333ea|6d28d9)\b/i;
/** DESIGN.md primary teal — draft .btn-ai on map Auto route. */
const TEAL_TOKEN =
  /--color-primary|--color-primary-soft|--color-primary-strong|#0f766e|#115e59|#ecfeff|#99f6e4/i;

/**
 * T11 #2 (map half): Auto route stays a no-op below 2 pins (no routing assist
 * seam fired); Calm Travel Ops teal chrome only — no purple AI styling.
 */
describe("DayMap Auto route pin gate + teal chrome (T11 #2)", () => {
  it("Auto route uses teal Calm Travel Ops chrome (no purple) and does not fire onAutoRoute with fewer than 2 pins", async () => {
    const user = userEvent.setup();
    const onAutoRoute = vi.fn();

    render(
      <DayMap
        stops={[
          {
            id: STOP_A_ID,
            activity: STOP_A_TITLE,
            coordinates: { lat: STOP_A_LAT, lng: STOP_A_LNG },
          },
        ]}
        onAutoRoute={onAutoRoute}
      />,
    );

    const mapRegion = screen.getByRole("region", { name: DAY_MAP_LABEL });
    const autoRoute = within(mapRegion).getByRole("button", {
      name: AUTO_ROUTE_LABEL,
    });

    // Theme A — teal primary tokens on Auto route / ai-actions; no purple.
    const aiActions =
      mapRegion.querySelector(".ai-actions") ??
      (autoRoute.parentElement as HTMLElement);
    for (const el of [
      aiActions,
      autoRoute,
      ...aiActions.querySelectorAll("*"),
    ]) {
      const className = typeof el.className === "string" ? el.className : "";
      expect(className).not.toMatch(PURPLE_CLASS);
      const styleAttr = el.getAttribute?.("style") ?? "";
      expect(styleAttr).not.toMatch(PURPLE_HEX);
      expect(styleAttr).not.toMatch(PURPLE_CLASS);
    }
    const chromeBlob = `${autoRoute.className} ${autoRoute.getAttribute("style") ?? ""} ${aiActions.className}`;
    expect(chromeBlob).toMatch(TEAL_TOKEN);

    const pinCount =
      mapRegion.getAttribute("data-pin-count") ??
      mapRegion
        .querySelector("[data-pin-count]")
        ?.getAttribute("data-pin-count") ??
      "1";
    expect(Number(pinCount)).toBe(1);

    // Pin gate: <2 pins → no routing callback (page must not POST autoRoute).
    if (!autoRoute.hasAttribute("disabled")) {
      await user.click(autoRoute);
    }
    expect(onAutoRoute).not.toHaveBeenCalled();
  });
});
