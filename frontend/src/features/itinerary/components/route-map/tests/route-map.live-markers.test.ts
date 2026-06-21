import { describe, expect, it, vi } from "vitest";
import { routeMapCoordinateItems } from "../testing/route-map-test-support";
import { allDaysFilter, type RouteDayGroup, type RoutePoint } from "../route-map.types";
import {
  type LiveRouteMarkerRegistry,
  synchronizeLiveRouteMarkers,
} from "../route-map.live-markers";

describe("route map live marker utilities", () => {
  it("creates, filters, updates, and removes live route markers", () => {
    const markerInstances: FakeMarker[] = [];
    const maplibregl = {
      Marker: class extends FakeMarker {
        constructor({ element }: { element: HTMLElement }) {
          super(element);
          markerInstances.push(this);
        }
      },
    } as unknown as typeof import("maplibre-gl");
    const [baseA, baseB] = routeMapCoordinateItems();
    const itemA = {
      ...baseA!,
      id: "marker-a",
      day: "2026-06-18",
    };
    const itemB = {
      ...baseB!,
      id: "marker-b",
      day: "2026-06-19",
    };
    const pointA = { item: itemA, x: 0, y: 0 } satisfies RoutePoint;
    const pointB = { item: itemB, x: 1, y: 1 } satisfies RoutePoint;
    const routeDayGroups: RouteDayGroup[] = [
      { color: "#a11", day: itemA.day, label: "Day 1", points: [pointA] },
      { color: "#1a1", day: itemB.day, label: "Day 2", points: [pointB] },
    ];
    const markers: LiveRouteMarkerRegistry = new Map();

    synchronizeLiveRouteMarkers({
      activeDay: itemB.day,
      liveRoutePoints: [pointA, pointB],
      map: {} as never,
      maplibregl,
      markerItems: new Set([itemA.id, itemB.id]),
      markers,
      routeDayGroups,
      visibleLiveRoutePoints: [pointB],
    });

    expect(markers.size).toBe(2);
    expect(markerInstances).toHaveLength(2);
    expect(markers.get(itemA.id)?.marker.getElement()).toHaveTextContent("1");
    expect(markers.get(itemA.id)?.marker.getElement()).toHaveStyle({
      display: "none",
    });
    expect(markers.get(itemB.id)?.marker.getElement()).toHaveTextContent("1");
    expect(markers.get(itemB.id)?.marker.getElement().style.display).toBe("");
    expect(markers.get(itemB.id)?.marker.getElement().style.getPropertyValue("--day-color")).toBe("#1a1");

    synchronizeLiveRouteMarkers({
      activeDay: allDaysFilter,
      liveRoutePoints: [
        {
          ...pointB,
          item: {
            ...itemB,
            coordinates: { lat: itemB.coordinates!.lat + 1, lng: itemB.coordinates!.lng + 1 },
          },
        },
      ],
      map: {} as never,
      maplibregl,
      markerItems: new Set([itemB.id]),
      markers,
      routeDayGroups,
      visibleLiveRoutePoints: [pointB],
    });

    expect(markers.has(itemA.id)).toBe(false);
    expect(markerInstances[0]?.remove).toHaveBeenCalled();
    expect(markers.get(itemB.id)?.marker.setLngLat).toHaveBeenCalledWith([
      itemB.coordinates!.lng + 1,
      itemB.coordinates!.lat + 1,
    ]);
    expect(markers.get(itemB.id)?.marker.getElement().style.display).toBe("");
  });
});

class FakeMarker {
  readonly addTo = vi.fn(() => this);
  readonly remove = vi.fn();
  readonly setLngLat = vi.fn(() => this);

  constructor(private readonly element: HTMLElement) {}

  getElement() {
    return this.element;
  }
}
