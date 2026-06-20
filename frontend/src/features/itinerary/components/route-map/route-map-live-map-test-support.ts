import { vi } from "vitest";

export type MapLibreTestMap = {
  addControl: ReturnType<typeof vi.fn>;
  addLayer: ReturnType<typeof vi.fn>;
  addSource: ReturnType<typeof vi.fn>;
  getSource: ReturnType<typeof vi.fn>;
  fitBounds: ReturnType<typeof vi.fn>;
  flyTo: ReturnType<typeof vi.fn>;
  getLayer: ReturnType<typeof vi.fn>;
  removeLayer: ReturnType<typeof vi.fn>;
  removeSource: ReturnType<typeof vi.fn>;
  remove: ReturnType<typeof vi.fn>;
  setPaintProperty: ReturnType<typeof vi.fn>;
  trigger: (event: string) => void;
};

const maplibreMock = vi.hoisted(() => ({
  maps: [] as MapLibreTestMap[],
  markers: [] as Array<{ element: HTMLElement; remove: ReturnType<typeof vi.fn> }>,
  loadDelay: 0,
  throwOnCreate: false,
}));

vi.mock("maplibre-gl", () => ({
  Map: vi.fn().mockImplementation(function (options: { container: HTMLElement }) {
    if (maplibreMock.throwOnCreate) throw new Error("map failed");
    const handlers = new Map<string, () => void>();
    const map: MapLibreTestMap = {
      addControl: vi.fn(),
      addLayer: vi.fn(),
      addSource: vi.fn(),
      getSource: vi.fn(() => ({ type: "geojson" })),
      fitBounds: vi.fn(),
      flyTo: vi.fn(),
      getLayer: vi.fn(() => true),
      removeLayer: vi.fn(),
      removeSource: vi.fn(),
      remove: vi.fn(),
      setPaintProperty: vi.fn(),
      trigger: (event: string) => handlers.get(event)?.(),
    };
    Object.assign(map, {
      on: vi.fn((event: string, callback: () => void) => {
        handlers.set(event, callback);
        if (event === "load") window.setTimeout(callback, maplibreMock.loadDelay);
      }),
    });
    const chromeButton = document.createElement("button");
    options.container.append(chromeButton);
    maplibreMock.maps.push(map);
    return map;
  }),
  Marker: vi.fn().mockImplementation(function ({ element }: { element: HTMLElement }) {
    const marker = {
      element,
      addTo: vi.fn(() => marker),
      getElement: () => element,
      remove: vi.fn(),
      setLngLat: vi.fn(() => marker),
    };
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
  maplibreMock.loadDelay = 0;
  maplibreMock.throwOnCreate = false;
}

export function getMaplibreMock() {
  return maplibreMock;
}

export function triggerLiveMapEvent(map: MapLibreTestMap | undefined, event: string) {
  map?.trigger(event);
}
