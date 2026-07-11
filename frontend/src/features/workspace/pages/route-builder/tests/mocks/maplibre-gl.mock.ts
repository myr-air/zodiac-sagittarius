import { vi } from "vitest";

export type MapLibreTestMap = {
  addControl: ReturnType<typeof vi.fn>;
  addLayer: ReturnType<typeof vi.fn>;
  addSource: ReturnType<typeof vi.fn>;
  getSource: ReturnType<typeof vi.fn>;
  fitBounds: ReturnType<typeof vi.fn>;
  flyTo: ReturnType<typeof vi.fn>;
  getLayer: ReturnType<typeof vi.fn>;
  project: ReturnType<typeof vi.fn>;
  removeLayer: ReturnType<typeof vi.fn>;
  removeSource: ReturnType<typeof vi.fn>;
  remove: ReturnType<typeof vi.fn>;
  setPaintProperty: ReturnType<typeof vi.fn>;
  setLayoutProperty: ReturnType<typeof vi.fn>;
  trigger: (event: string, data?: unknown) => void;
};

export type MapLibreTestMarker = {
  element: HTMLElement;
  draggable?: boolean;
  addTo: ReturnType<typeof vi.fn>;
  setLngLat: ReturnType<typeof vi.fn>;
  remove: ReturnType<typeof vi.fn>;
  getLngLat: ReturnType<typeof vi.fn>;
  getElement: ReturnType<typeof vi.fn>;
  trigger: (event: string, data?: unknown) => void;
};

export type MapLibreTestSource = {
  type: string;
  setData: ReturnType<typeof vi.fn>;
};

const maplibreMock = vi.hoisted(() => ({
  maps: [] as MapLibreTestMap[],
  markers: [] as MapLibreTestMarker[],
  sources: new Map<string, MapLibreTestSource>(),
  loadDelay: 0,
  throwOnCreate: false,
}));

vi.mock("maplibre-gl", () => ({
  Map: vi.fn().mockImplementation(function (options: { container: HTMLElement }) {
    if (maplibreMock.throwOnCreate) throw new Error("map failed");
    const handlers = new Map<string, (data?: unknown) => void>();
    const sources = maplibreMock.sources;
    const map: MapLibreTestMap = {
      addControl: vi.fn(),
      addLayer: vi.fn(),
      addSource: vi.fn((id: string, spec: { type: string }) => {
        sources.set(id, { type: spec.type, setData: vi.fn() });
      }),
      getSource: vi.fn((id: string) => sources.get(id) ?? null),
      fitBounds: vi.fn(),
      flyTo: vi.fn(),
      getLayer: vi.fn(() => true),
      project: vi.fn(() => ({ x: 0, y: 0 })),
      removeLayer: vi.fn(),
      removeSource: vi.fn((id: string) => {
        sources.delete(id);
      }),
      remove: vi.fn(),
      setPaintProperty: vi.fn(),
      setLayoutProperty: vi.fn(),
      trigger: (event: string, data?: unknown) => handlers.get(event)?.(data),
    };
    Object.assign(map, {
      on: vi.fn((event: string, callback: (data?: unknown) => void) => {
        handlers.set(event, callback);
        if (event === "load") window.setTimeout(callback, maplibreMock.loadDelay);
      }),
    });
    const chromeButton = document.createElement("button");
    options.container.append(chromeButton);
    maplibreMock.maps.push(map);
    return map;
  }),
  Marker: vi.fn().mockImplementation(function ({ element, draggable }: { element: HTMLElement; draggable?: boolean }) {
    const markerHandlers = new Map<string, (data?: unknown) => void>();
    const marker: MapLibreTestMarker = {
      element,
      draggable,
      addTo: vi.fn(() => marker),
      setLngLat: vi.fn(() => marker),
      remove: vi.fn(),
      getLngLat: vi.fn(() => ({ lat: 0, lng: 0 })),
      getElement: vi.fn(() => element),
      trigger: (event: string, data?: unknown) => markerHandlers.get(event)?.(data),
    };
    Object.assign(marker, {
      on: vi.fn((event: string, callback: (data?: unknown) => void) => {
        markerHandlers.set(event, callback);
      }),
    });
    maplibreMock.markers.push(marker);
    return marker;
  }),
  NavigationControl: vi.fn().mockImplementation(function () {
    return {};
  }),
}));

export function resetMaplibreMock() {
  maplibreMock.maps.length = 0;
  maplibreMock.markers.length = 0;
  maplibreMock.sources.clear();
  maplibreMock.loadDelay = 0;
  maplibreMock.throwOnCreate = false;
}

export function getMaplibreMock() {
  return maplibreMock;
}

export function triggerMapEvent(
  map: MapLibreTestMap | undefined,
  event: string,
  data?: unknown,
) {
  map?.trigger(event, data);
}

export function triggerMarkerEvent(
  marker: MapLibreTestMarker | undefined,
  event: string,
  data?: unknown,
) {
  marker?.trigger(event, data);
}
