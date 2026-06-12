import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import type { ItineraryItem } from "@/src/trip/types";
import { useI18n } from "@/src/i18n/I18nProvider";
import { cn } from "@/src/lib/cn";
import { formatDayLabel, groupItemsByDay, type ItineraryView } from "@/src/trip/itinerary";
import { Icon } from "./icons";
import { TravelMotif } from "./motifs";
import { formatTripRange, PageHeader } from "./PageHeader";

interface RouteMapViewProps {
  countries?: string[];
  destinationLabel?: string;
  endDate: string;
  items: ItineraryItem[];
  itineraryView?: ItineraryView;
  liveMapAvailability?: "auto" | "loading" | "error";
  liveMapEnabled?: boolean;
  startDate: string;
  tripName: string;
}

interface RoutePoint {
  item: ItineraryItem;
  x: number;
  y: number;
}

interface RouteDayGroup {
  color: string;
  day: string;
  label: string;
  points: RoutePoint[];
}

type MarkerStyle = CSSProperties & {
  "--day-color": string;
  "--route-marker-text-color": string;
  "--x": string;
  "--y": string;
  "--marker-delay": string;
};

type DayColorStyle = CSSProperties & {
  "--day-color": string;
};

type DayFilter = "all" | string;

interface RouteViewport {
  center: [number, number];
  zoom: number;
}

const routeDayColors = ["#c24f16", "#2563eb", "#b45309", "#15803d", "#be123c", "#0369a1"];
const thailandRouteViewport: RouteViewport = { center: [100.9925, 15.8700], zoom: 5 };
const hongKongShenzhenRouteViewport: RouteViewport = { center: [114.1800, 22.3900], zoom: 9.8 };
const routeCountryViewports: Record<string, RouteViewport> = {
  cn: { center: [104.1954, 35.8617], zoom: 3.4 },
  china: { center: [104.1954, 35.8617], zoom: 3.4 },
  hk: { center: [114.1694, 22.3193], zoom: 10 },
  "hong kong": { center: [114.1694, 22.3193], zoom: 10 },
  id: { center: [113.9213, -0.7893], zoom: 4.1 },
  indonesia: { center: [113.9213, -0.7893], zoom: 4.1 },
  jp: { center: [138.2529, 36.2048], zoom: 4.7 },
  japan: { center: [138.2529, 36.2048], zoom: 4.7 },
  kr: { center: [127.7669, 35.9078], zoom: 6 },
  korea: { center: [127.7669, 35.9078], zoom: 6 },
  la: { center: [102.4955, 19.8563], zoom: 5.5 },
  laos: { center: [102.4955, 19.8563], zoom: 5.5 },
  mo: { center: [113.5439, 22.1987], zoom: 9.2 },
  macau: { center: [113.5439, 22.1987], zoom: 9.2 },
  malaysia: { center: [101.9758, 4.2105], zoom: 5 },
  my: { center: [101.9758, 4.2105], zoom: 5 },
  sg: { center: [103.8198, 1.3521], zoom: 9.2 },
  singapore: { center: [103.8198, 1.3521], zoom: 9.2 },
  th: thailandRouteViewport,
  thailand: thailandRouteViewport,
  tw: { center: [120.9605, 23.6978], zoom: 6 },
  taiwan: { center: [120.9605, 23.6978], zoom: 6 },
  vietnam: { center: [108.2772, 14.0583], zoom: 5 },
  vn: { center: [108.2772, 14.0583], zoom: 5 },
};
const routeMapThemeRules: Array<{ layerId: string; property: string; value: unknown }> = [
  { layerId: "background", property: "background-color", value: "#f6fbfd" },
  { layerId: "park", property: "fill-color", value: "#dff3ea" },
  { layerId: "water", property: "fill-color", value: "#c9dfe7" },
  { layerId: "landcover_ice_shelf", property: "fill-color", value: "#eff8fb" },
  { layerId: "landcover_glacier", property: "fill-color", value: "#e6f3f6" },
  { layerId: "landuse_residential", property: "fill-color", value: "#f8fbfb" },
  { layerId: "landcover_wood", property: "fill-color", value: "#d7eadf" },
  { layerId: "building", property: "fill-color", value: "#e6ecee" },
  { layerId: "waterway", property: "line-color", value: "#b9d6df" },
  { layerId: "highway_path", property: "line-color", value: "#eef5f6" },
  { layerId: "highway_minor", property: "line-color", value: "#f7fbfb" },
  { layerId: "highway_major_casing", property: "line-color", value: "#d8e5e7" },
  { layerId: "highway_major_inner", property: "line-color", value: "#ffffff" },
  { layerId: "highway_major_subtle", property: "line-color", value: "#d2e0e3" },
  { layerId: "highway_motorway_casing", property: "line-color", value: "#d9e3e6" },
  { layerId: "highway_motorway_inner", property: "line-color", value: "#fde7b2" },
  { layerId: "highway_motorway_subtle", property: "line-color", value: "#edc96d" },
  { layerId: "railway", property: "line-color", value: "#9eb6bd" },
  { layerId: "railway_transit", property: "line-color", value: "#84a5ad" },
  { layerId: "boundary_3", property: "line-color", value: "#92adb5" },
  { layerId: "boundary_2", property: "line-color", value: "#527f88" },
  { layerId: "boundary_disputed", property: "line-color", value: "#f59e0b" },
  { layerId: "water_name_point_label", property: "text-color", value: "#2f7080" },
  { layerId: "water_name_line_label", property: "text-color", value: "#2f7080" },
  { layerId: "waterway_line_label", property: "text-color", value: "#2f7080" },
  { layerId: "label_other", property: "text-color", value: "#52636a" },
  { layerId: "label_village", property: "text-color", value: "#43545b" },
  { layerId: "label_town", property: "text-color", value: "#33464d" },
  { layerId: "label_state", property: "text-color", value: "#26444b" },
  { layerId: "label_city", property: "text-color", value: "#0f2f38" },
  { layerId: "label_city_capital", property: "text-color", value: "#0f2f38" },
  { layerId: "label_country_3", property: "text-color", value: "#0f3f46" },
  { layerId: "label_country_2", property: "text-color", value: "#0f3f46" },
  { layerId: "label_country_1", property: "text-color", value: "#0f3f46" },
];
const routeMapPanelClassName = "route-map-panel grid h-full min-h-0 min-w-0 grid-rows-[auto_minmax(0,1fr)] bg-transparent px-6 py-[22px] pb-7 max-[767px]:px-3 max-[767px]:py-4";
const routeMapLayoutClassName = "route-map-layout mb-7 block h-full min-h-0 w-full rounded-(--radius-lg) border border-[color-mix(in_srgb,var(--color-route)_18%,var(--color-border))] bg-[linear-gradient(135deg,var(--color-surface)_0%,var(--color-route-soft)_100%)] p-2 shadow-[0_1px_0_rgb(15_23_42_/_0.04)] max-[1199px]:w-full max-[1199px]:px-2 max-[767px]:mb-2 max-[767px]:p-1.5";
const routeMapCanvasClassName = "route-map-canvas relative h-full min-h-[560px] overflow-hidden rounded-(--radius-lg) border border-[color-mix(in_srgb,var(--color-route)_18%,var(--color-border))] bg-[linear-gradient(135deg,var(--color-surface)_0%,var(--color-route-soft)_100%)] max-[767px]:h-[58vh] max-[767px]:min-h-[390px]";
const mapDayFilterClassName = "map-day-filter absolute left-3 top-3 z-[8] flex max-w-[min(760px,calc(100%_-_104px))] flex-wrap gap-2 rounded-(--radius-lg) border border-[color-mix(in_srgb,var(--color-route)_18%,white)] bg-[rgb(255_255_255_/_0.86)] p-1.5 shadow-[0_1px_0_rgb(15_23_42_/_0.04)] max-[767px]:left-2 max-[767px]:right-2 max-[767px]:max-w-none";
const mapDayFilterButtonClassName = "map-day-filter-button inline-flex min-h-8 items-center gap-1.5 rounded-full border border-[color-mix(in_srgb,var(--color-route)_14%,var(--color-border))] bg-[rgb(255_255_255_/_0.78)] px-2.5 py-1.5 text-[11px] font-extrabold leading-4 text-(--color-text-muted) transition-[background,border-color,color,box-shadow] duration-150 hover:border-[var(--day-color,var(--color-route))] hover:bg-(--color-route-soft) hover:text-(--color-text) focus-visible:border-[var(--day-color,var(--color-route))] focus-visible:bg-(--color-route-soft) focus-visible:text-(--color-text)";
const activeMapDayFilterButtonClassName = "map-day-filter-button--active border-[var(--day-color,var(--color-primary))] bg-(--color-primary-soft) text-(--color-text) shadow-[0_2px_6px_rgb(194_79_22_/_0.12)]";
const mapDaySwatchClassName = "map-day-swatch size-[9px] rounded-full bg-[var(--day-color,var(--color-route))] shadow-[0_0_0_2px_rgb(255_255_255_/_0.94)]";
const routeLiveMapClassName = "route-live-map absolute inset-0 z-[4] bg-(--color-route-soft) transition-opacity duration-200";
const routeLiveMapPendingClassName = "route-live-map--pending pointer-events-none opacity-0";
const routeMapStatusClassName = "route-map-status absolute left-1/2 top-1/2 z-[7] m-0 grid min-w-[220px] -translate-x-1/2 -translate-y-1/2 gap-1 rounded-(--radius-md) border border-(--color-route-border) bg-[rgb(255_255_255_/_0.9)] px-3 py-2.5 text-xs font-extrabold text-(--color-route) shadow-[0_4px_8px_rgb(37_99_235_/_0.08)]";
const routeMapFallbackClassName = "route-map-fallback absolute inset-0 z-[2]";
const routeMapRetryButtonClassName = "route-map-retry mt-2 inline-flex min-h-9 items-center gap-1.5 rounded-(--radius-sm) border border-(--color-route-border) bg-(--color-surface) px-3 py-1.5 text-xs font-extrabold text-(--color-route) transition-[background,border-color,box-shadow] duration-150 hover:bg-(--color-route-soft) focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-primary) [&_.icon]:size-3.5";
const mapZoneClassName = "map-zone absolute z-[1] rounded-full border border-[color-mix(in_srgb,var(--color-route)_14%,var(--color-border))] bg-[rgb(255_255_255_/_0.82)] px-2 py-1 text-[11px] font-extrabold uppercase leading-[15px] text-(--color-text-muted) shadow-[0_1px_0_rgb(15_23_42_/_0.05)]";
const mapZoneHongKongClassName = "map-zone--hk left-[17px] top-[76px] max-[767px]:top-[88px]";
const mapZoneShenzhenClassName = "map-zone--sz right-[18px] top-[78px] max-[767px]:top-[126px]";
const mapZoneBayClassName = "map-zone--bay bottom-5 right-6 text-(--color-route)";
const routeMapSvgClassName = "route-map-svg absolute inset-0 z-[2] size-full overflow-visible";
const routeMapPathShadowClassName = "route-map-path route-map-path--shadow fill-none stroke-white stroke-[7.2] opacity-[0.92] [stroke-linecap:round] [stroke-linejoin:round]";
const routeMapPathClassName = "route-map-path fill-none stroke-[var(--day-color,var(--color-route))] stroke-[3.2] [stroke-linecap:round] [stroke-linejoin:round]";
const routeMarkerClassName = "route-marker absolute left-[var(--x)] top-[var(--y)] z-[3] grid size-[34px] -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border-[3px] border-white bg-[var(--day-color,var(--color-route))] text-[11px] font-extrabold tabular-nums text-[var(--route-marker-text-color)] shadow-[0_6px_12px_rgb(15_23_42_/_0.18)] transition-[background,box-shadow,transform] duration-150 [animation:route-marker-in_180ms_ease-out_both] [animation-delay:var(--marker-delay)]";
const routeStopListClassName = "route-stop-list absolute right-3 top-[78px] z-[6] grid max-h-[min(292px,52%)] w-[min(282px,calc(100%_-_24px))] gap-1.5 overflow-y-auto rounded-(--radius-md) border border-(--color-route-border) bg-[rgb(255_255_255_/_0.9)] p-2.5 text-[11px] font-bold leading-4 text-(--color-text-muted) shadow-[0_4px_8px_rgb(37_99_235_/_0.08)] max-[767px]:hidden";
const routeStopListItemClassName = "route-stop-list-item grid grid-cols-[auto_minmax(0,1fr)] gap-2 rounded-(--radius-sm) border border-(--color-border) bg-(--color-surface-subtle) px-1.5 py-1.5";
const routeStopListIndexClassName = "grid size-5 place-items-center rounded-full bg-[var(--day-color,var(--color-route))] text-[10px] font-black text-white";
const routeStopListCopyClassName = "min-w-0 truncate";
const mapSourceNoteClassName = "map-source-note absolute bottom-2 right-2.5 z-[6] m-0 rounded-full border border-(--color-route-border) bg-[rgb(255_255_255_/_0.86)] px-2 py-1 text-[10px] font-extrabold leading-[14px] text-(--color-route)";
const unresolvedPanelClassName = "map-unresolved-panel absolute bottom-10 left-3 z-[7] grid max-h-[min(220px,42%)] w-[min(380px,calc(100%_-_24px))] gap-2 overflow-hidden rounded-(--radius-md) border border-(--color-warning-border) bg-[linear-gradient(135deg,var(--color-surface)_0%,var(--color-warning-soft)_100%)] p-3 text-(--color-warning-strong) shadow-[0_4px_8px_rgb(249_115_22_/_0.08)]";
const unresolvedPanelHeaderClassName = "map-unresolved-header flex items-start gap-2 text-[12px] font-extrabold leading-5 text-(--color-warning-strong)";
const unresolvedPanelListClassName = "map-unresolved-list m-0 grid gap-1.5 overflow-y-auto p-0";
const unresolvedPanelItemClassName = "map-unresolved-item grid gap-0.5 rounded-(--radius-sm) bg-(--color-surface) px-2 py-1.5 text-[11px] leading-4 text-(--color-warning-strong)";
const unresolvedPanelItemTitleClassName = "font-extrabold text-(--color-text)";
const DARK_TEXT = "#0f172a";
const MINIMUM_A11Y_CONTRAST = 4.5;

function hexToLinear(component: string): number {
  const value = Number.parseInt(component, 16) / 255;
  return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
}

function luminance(color: string): number {
  if (color.length !== 7 || !/^#[0-9a-fA-F]{6}$/.test(color)) return 0;
  const red = hexToLinear(color.slice(1, 3));
  const green = hexToLinear(color.slice(3, 5));
  const blue = hexToLinear(color.slice(5, 7));
  return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
}

function contrastRatio(foreground: string, background: string): number {
  const foregroundLuminance = luminance(foreground);
  const backgroundLuminance = luminance(background);
  const brightest = Math.max(foregroundLuminance, backgroundLuminance);
  const darkest = Math.min(foregroundLuminance, backgroundLuminance);
  return (brightest + 0.05) / (darkest + 0.05);
}

function markerTextColor(color: string): string {
  if (contrastRatio("#ffffff", color) >= MINIMUM_A11Y_CONTRAST) return "#ffffff";
  return DARK_TEXT;
}

export function RouteMapView({
  countries = [],
  destinationLabel = "",
  endDate,
  itineraryView,
  items,
  liveMapAvailability = "auto",
  liveMapEnabled = process.env.NODE_ENV !== "test",
  startDate,
  tripName,
}: RouteMapViewProps) {
  const { locale, t } = useI18n();
  const groups = useMemo(() => itineraryView?.dayGroups ?? groupItemsByDay(items), [items, itineraryView]);
  const routePoints = useMemo(() => buildRoutePoints(items), [items]);
  const coordinateRoutePoints = useMemo(() => routePoints.filter((point) => hasCoordinates(point.item.coordinates)), [routePoints]);
  const unresolvedItems = useMemo(() => items.filter((item) => !hasCoordinates(item.coordinates)), [items]);
  const routeDayGroups = useMemo(() => buildRouteDayGroups(groups, coordinateRoutePoints, startDate, locale), [coordinateRoutePoints, groups, locale, startDate]);
  const [activeDay, setActiveDay] = useState<DayFilter>("all");
  const visibleRouteDayGroups = useMemo(
    () => routeDayGroups.filter((group) => activeDay === "all" || group.day === activeDay),
    [activeDay, routeDayGroups],
  );
  const visibleRoutePoints = useMemo(
    () => (activeDay === "all" ? coordinateRoutePoints : coordinateRoutePoints.filter((point) => point.item.day === activeDay)),
    [activeDay, coordinateRoutePoints],
  );
  const visibleUnresolvedItems = useMemo(
    () => (activeDay === "all" ? unresolvedItems : unresolvedItems.filter((item) => item.day === activeDay)),
    [activeDay, unresolvedItems],
  );
  const liveRoutePoints = coordinateRoutePoints;
  const visibleLiveRoutePoints = useMemo(
    () => (activeDay === "all" ? liveRoutePoints : liveRoutePoints.filter((point) => point.item.day === activeDay)),
    [activeDay, liveRoutePoints],
  );
  const fallbackViewport = useMemo(() => fallbackRouteViewport(destinationLabel, countries), [countries, destinationLabel]);
  const warningCount = itineraryView?.warningCount ?? items.reduce((total, item) => total + (item.advisories?.length ?? 0), 0);
  const [autoLiveMapState, setAutoLiveMapState] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const liveMapState = liveMapAvailability === "auto" ? autoLiveMapState : liveMapAvailability;
  const [liveMapRetryKey, setLiveMapRetryKey] = useState(0);
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<import("maplibre-gl").Map | null>(null);
  const maplibreModuleRef = useRef<typeof import("maplibre-gl") | null>(null);
  const markersRef = useRef<Map<string, { marker: import("maplibre-gl").Marker; day: string }>>(new Map());
  const sourceIdsRef = useRef<string[]>([]);
  const liveRoutePointsRef = useRef(liveRoutePoints);

  const markerItems = useMemo(() => new Set(liveRoutePoints.map((point) => point.item.id)), [liveRoutePoints]);

  useEffect(() => {
    liveRoutePointsRef.current = liveRoutePoints;
  }, [liveRoutePoints]);

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current || !liveMapEnabled || liveMapAvailability !== "auto") return undefined;

    let disposed = false;
    const liveMapContainer = mapContainerRef.current;
    const mountedMarkers = markersRef.current;

    async function mountLiveMap() {
      setAutoLiveMapState("loading");

      try {
        const maplibregl = await import("maplibre-gl");
        if (!mapContainerRef.current || disposed) return;
        maplibreModuleRef.current = maplibregl;
        const container = mapContainerRef.current;
        container.inert = true;

        const map = new maplibregl.Map({
          attributionControl: { compact: true },
          center: getRouteCenter(liveRoutePointsRef.current, fallbackViewport.center),
          container,
          cooperativeGestures: true,
          style: "https://tiles.openfreemap.org/styles/positron",
          zoom: liveRoutePointsRef.current.length > 0 ? 10 : fallbackViewport.zoom,
        });

        mapRef.current = map;
        map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");
        removeMapChromeFromTabOrder(container);

        map.on("load", () => {
          if (disposed) return;
          applyRouteMapTheme(map);
          container.inert = false;
          setAutoLiveMapState("ready");
        });

        map.on("error", () => {
          if (disposed) return;
          setAutoLiveMapState("error");
        });
      } catch {
        /* v8 ignore next */
        if (!disposed) setAutoLiveMapState("error");
      }
    }

    void mountLiveMap();

    return () => {
      disposed = true;
      const map = mapRef.current;
      mountedMarkers.forEach((entry) => entry.marker.remove());
      mountedMarkers.clear();
      if (map) cleanupRouteLayers(map, sourceIdsRef.current);
      sourceIdsRef.current = [];
      map?.remove();
      mapRef.current = null;
      if (liveMapContainer) {
        liveMapContainer.inert = false;
      }
    };
  }, [fallbackViewport.center, fallbackViewport.zoom, liveMapAvailability, liveMapEnabled, liveMapRetryKey]);

  useEffect(() => {
    const map = mapRef.current;
    const maplibregl = maplibreModuleRef.current;
    if (!map || liveMapState !== "ready" || !maplibregl) return;

    const visibleCoordinates = new Map<string, number>(
      visibleLiveRoutePoints
        .map((point, index) => [point.item.id, index + 1]),
    );

    markersRef.current.forEach((entry, itemId) => {
      if (!markerItems.has(itemId)) {
        entry.marker.remove();
        markersRef.current.delete(itemId);
      }
    });

    liveRoutePoints.forEach((point) => {
      const coordinates = point.item.coordinates;
      if (!coordinates) return;
      const markerLabel = String(visibleCoordinates.get(point.item.id) ?? 1);
      const markerColor = dayColorFor(point.item.day, routeDayGroups);
      const markerDisplay = activeDay === "all" || point.item.day === activeDay ? "" : "none";
      const existing = markersRef.current.get(point.item.id);
      if (existing) {
        existing.day = point.item.day;
        existing.marker.setLngLat([coordinates.lng, coordinates.lat]);
        existing.marker.getElement().style.setProperty("--day-color", markerColor);
        existing.marker.getElement().textContent = markerLabel;
        existing.marker.getElement().style.display = markerDisplay;
        return;
      }

      const markerElement = document.createElement("span");
      markerElement.className = "ofm-marker";
      markerElement.dataset.day = point.item.day;
      markerElement.setAttribute("aria-hidden", "true");
      markerElement.style.setProperty("--day-color", markerColor);
      markerElement.style.display = markerDisplay;
      markerElement.textContent = markerLabel;

      const marker = new maplibregl.Marker({ element: markerElement })
        .setLngLat([coordinates.lng, coordinates.lat])
        .addTo(map);

      markersRef.current.set(point.item.id, { marker, day: point.item.day });
    });

    markersRef.current.forEach((entry) => {
      entry.marker.getElement().style.display = activeDay === "all" || entry.day === activeDay ? "" : "none";
    });

    sourceIdsRef.current = synchronizeRouteLayers(map, sourceIdsRef.current, routeDayGroups, activeDay);
    fitLiveRoute(map, visibleLiveRoutePoints, fallbackViewport);
  }, [activeDay, fallbackViewport, liveMapState, liveRoutePoints, visibleLiveRoutePoints, routeDayGroups, markerItems]);

  function handleRetryLiveMap() {
    markersRef.current.forEach((entry) => entry.marker.remove());
    markersRef.current.clear();
    if (mapRef.current) {
      cleanupRouteLayers(mapRef.current, sourceIdsRef.current);
      mapRef.current.remove();
    }
    sourceIdsRef.current = [];
    mapRef.current = null;
    if (mapContainerRef.current) {
      mapContainerRef.current.inert = false;
    }
    setAutoLiveMapState("idle");
    setLiveMapRetryKey((key) => key + 1);
  }

  return (
    <section className={routeMapPanelClassName} id="map" aria-labelledby="route-map-heading" aria-label={t.map.pageLabel}>
      <PageHeader
        title={t.map.title}
        subtitle={tripName}
        meta={(
          <>
            <span><Icon name="calendar" /> {formatTripRange(startDate, endDate, locale)}</span>
            <span><Icon name="location" /> {t.map.locationStatus({ mapped: visibleRoutePoints.length, total: items.length, unresolved: visibleUnresolvedItems.length })}</span>
            <span><Icon name="warning" /> {t.dates.warningCount({ count: warningCount })}</span>
            <span><Icon name="route" /> {activeDayLabel(activeDay, routeDayGroups, t.map.allDays, t.map.chooseDay)}</span>
          </>
        )}
        motif={<TravelMotif tone="route" />}
      />

      <div className={routeMapLayoutClassName}>
        <div className={routeMapCanvasClassName} data-live-map-state={liveMapState} aria-label={t.map.canvasLabel}>
          <div className={mapDayFilterClassName} aria-label={t.map.filterLabel}>
            <button
              type="button"
              className={cn(mapDayFilterButtonClassName, activeDay === "all" && activeMapDayFilterButtonClassName)}
              aria-pressed={activeDay === "all"}
              onClick={() => setActiveDay("all")}
            >
              {t.map.allDays}
            </button>
            {routeDayGroups.map((group) => (
              <button
                type="button"
                className={cn(mapDayFilterButtonClassName, activeDay === group.day && activeMapDayFilterButtonClassName)}
                aria-pressed={activeDay === group.day}
                key={group.day}
                style={dayFilterStyle(group.color)}
                onClick={() => setActiveDay(group.day)}
              >
                <span className={mapDaySwatchClassName} aria-hidden="true" />
                {group.label}
              </button>
            ))}
          </div>

          {liveMapState !== "ready" ? (
            <StaticRouteFallback
              routeDayGroups={visibleRouteDayGroups}
              routePoints={visibleRoutePoints}
              stopListLabel={t.map.visibleStopsLabel}
            />
          ) : null}

          {liveMapState !== "error" ? (
            <>
              <div className={cn(routeLiveMapClassName, liveMapState !== "ready" && routeLiveMapPendingClassName)} ref={mapContainerRef} aria-hidden="true" />
              {liveMapState !== "ready" ? <p className={routeMapStatusClassName}>{liveMapStatusText(liveMapState, t.map.liveLoading, t.map.liveError)}</p> : null}
            </>
          ) : (
            <>
              <div className={routeMapStatusClassName} role="status">
                <p className="m-0">{liveMapStatusText(liveMapState, t.map.liveLoading, t.map.liveError)}</p>
                {liveMapEnabled && liveMapAvailability === "auto" ? (
                  <button className={routeMapRetryButtonClassName} type="button" onClick={handleRetryLiveMap}>
                    <Icon name="redo" />
                    {t.map.retryLiveMap}
                  </button>
                ) : null}
              </div>
            </>
          )}
          {visibleUnresolvedItems.length > 0 ? (
            <div className={unresolvedPanelClassName} role="region" aria-label={t.map.unresolvedLabel}>
              <div className={unresolvedPanelHeaderClassName}>
                <Icon name="warning" />
                <span>{t.map.unresolvedTitle({ count: visibleUnresolvedItems.length })}</span>
              </div>
              <ol className={unresolvedPanelListClassName}>
                {visibleUnresolvedItems.slice(0, 6).map((item) => (
                  <li className={unresolvedPanelItemClassName} key={item.id}>
                    <span className={unresolvedPanelItemTitleClassName}>{item.activity}</span>
                    <span>{item.place}</span>
                  </li>
                ))}
              </ol>
            </div>
          ) : null}
          {liveMapState === "error" || !liveMapEnabled ? <p className={mapSourceNoteClassName}>{t.map.sourceNote}</p> : null}
        </div>
      </div>
    </section>
  );
}

export function liveMapStatusText(state: "idle" | "loading" | "ready" | "error", loadingLabel = "Loading map from OpenFreeMap", errorLabel = "Could not load the live map. Showing the fallback route diagram."): string {
  if (state === "error") return errorLabel;
  return loadingLabel;
}

export function activeDayLabel(activeDay: DayFilter, groups: RouteDayGroup[], allDays = "All days", chooseDay = "Choose day"): string {
  if (activeDay === "all") return allDays;
  return groups.find((group) => group.day === activeDay)?.label ?? chooseDay;
}

function StaticRouteFallback({
  routeDayGroups,
  routePoints,
  stopListLabel,
}: {
  routeDayGroups: RouteDayGroup[];
  routePoints: RoutePoint[];
  stopListLabel: string;
}) {
  return (
    <div className={routeMapFallbackClassName}>
      <span className={cn(mapZoneClassName, mapZoneHongKongClassName)}>Hong Kong</span>
      <span className={cn(mapZoneClassName, mapZoneShenzhenClassName)}>Shenzhen</span>
      <span className={cn(mapZoneClassName, mapZoneBayClassName)}>Victoria Harbour</span>
      <svg className={routeMapSvgClassName} viewBox="0 0 100 100" aria-hidden="true" focusable="false">
        {routeDayGroups.map((group) => {
          const pathPoints = group.points.map((point) => `${point.x},${point.y}`).join(" ");
          return (
            <g key={group.day} style={routeLineStyle(group.color)}>
              <polyline className={routeMapPathShadowClassName} pathLength={1} points={pathPoints} />
              <polyline className={routeMapPathClassName} pathLength={1} points={pathPoints} />
            </g>
          );
        })}
      </svg>
      {routePoints.map((point, index) => (
        <span
          className={routeMarkerClassName}
          style={markerStyle(point, index, dayColorFor(point.item.day, routeDayGroups))}
          aria-hidden="true"
          key={point.item.id}
        >
          <span>{index + 1}</span>
        </span>
      ))}
      {routePoints.length > 0 ? (
        <ol className={routeStopListClassName} aria-label={stopListLabel} tabIndex={0}>
          {routePoints.slice(0, 8).map((point, index) => (
            <li className={routeStopListItemClassName} key={point.item.id}>
              <span
                className={routeStopListIndexClassName}
                style={routeLineStyle(dayColorFor(point.item.day, routeDayGroups))}
                aria-hidden="true"
              >
                {index + 1}
              </span>
              <span className={routeStopListCopyClassName}>{point.item.activity}</span>
            </li>
          ))}
        </ol>
      ) : null}
    </div>
  );
}

function buildRouteDayGroups(groups: ReturnType<typeof groupItemsByDay>, routePoints: RoutePoint[], startDate: string, locale: "en" | "th"): RouteDayGroup[] {
  return groups
    .map((group, index) => ({
      color: routeDayColors[index % routeDayColors.length],
      day: group.day,
      label: formatDayLabel(group.day, startDate, locale),
      points: routePoints.filter((point) => point.item.day === group.day),
    }))
    .filter((group) => group.points.length > 0);
}

export function dayColorFor(day: string, groups: RouteDayGroup[]): string {
  return groups.find((group) => group.day === day)?.color ?? routeDayColors[0];
}

function dayFilterStyle(color: string): DayColorStyle {
  return { "--day-color": color };
}

function routeLineStyle(color: string): DayColorStyle {
  return { "--day-color": color };
}

function routeSourceId(index: number): string {
  return `trip-route-day-${index}`;
}

function routeShadowLayerId(index: number): string {
  return `trip-route-day-${index}-shadow`;
}

function routeLineLayerId(index: number): string {
  return `trip-route-day-${index}-line`;
}

function routeOpacity(activeDay: DayFilter, day: string, visibleOpacity: number, hiddenOpacity: number): number {
  return activeDay === "all" || activeDay === day ? visibleOpacity : hiddenOpacity;
}

function cleanupRouteLayers(map: import("maplibre-gl").Map, sourceIds: string[]) {
  sourceIds.forEach((sourceId) => {
    const lineId = `${sourceId}-line`;
    const layerId = `${sourceId}-shadow`;

    if (map.getLayer(lineId)) {
      map.removeLayer(lineId);
    }

    if (map.getLayer(layerId)) {
      map.removeLayer(layerId);
    }

    if (map.getSource(sourceId)) {
      map.removeSource(sourceId);
    }
  });
}

function synchronizeRouteLayers(map: import("maplibre-gl").Map, sourceIds: string[], dayGroups: RouteDayGroup[], activeDay: DayFilter) {
  const nextSourceIds: string[] = [];
  cleanupRouteLayers(map, sourceIds);

  dayGroups.forEach((group, index) => {
    const coordinates = group.points.flatMap((point) => {
      const coordinate = point.item.coordinates;
      return hasCoordinates(coordinate) ? [[coordinate.lng, coordinate.lat]] : [];
    });

    if (coordinates.length < 2) return;

    const sourceId = routeSourceId(index);
    const shadowId = routeShadowLayerId(index);
    const lineId = routeLineLayerId(index);

    map.addSource(sourceId, {
      type: "geojson",
      data: {
        type: "Feature",
        properties: {},
        geometry: {
          type: "LineString",
          coordinates,
        },
      } as GeoJSON.Feature<GeoJSON.LineString>,
    });

    map.addLayer({
      id: shadowId,
      type: "line",
      source: sourceId,
      paint: {
        "line-color": "#ffffff",
        "line-opacity": routeOpacity(activeDay, group.day, 0.82, 0),
        "line-width": 9,
      },
    });

    map.addLayer({
      id: lineId,
      type: "line",
      source: sourceId,
      paint: {
        "line-color": group.color,
        "line-opacity": routeOpacity(activeDay, group.day, 0.94, 0),
        "line-width": 4.5,
      },
    });

    nextSourceIds.push(sourceId);
  });

  return nextSourceIds;
}

export function fitLiveRoute(map: import("maplibre-gl").Map, points: RoutePoint[], fallbackViewport = thailandRouteViewport) {
  const pointsWithCoordinates = points.filter((point) => point.item.coordinates && hasCoordinates(point.item.coordinates));
  if (pointsWithCoordinates.length > 1) {
    map.fitBounds(getRouteBounds(pointsWithCoordinates), { padding: 80, maxZoom: 13 });
    return;
  }

  const coordinate = pointsWithCoordinates[0]?.item.coordinates;
  if (!coordinate) {
    map.flyTo({ center: fallbackViewport.center, essential: false, zoom: fallbackViewport.zoom });
    return;
  }
  map.flyTo({ center: [coordinate.lng, coordinate.lat], essential: false, zoom: 13 });
}

function removeMapChromeFromTabOrder(container: HTMLElement) {
  container.querySelectorAll<HTMLElement>("a, button, input, select, textarea, [tabindex]").forEach((element) => {
    element.tabIndex = -1;
  });
}

function hasCoordinates(coordinate: ItineraryItem["coordinates"]): coordinate is NonNullable<ItineraryItem["coordinates"]> {
  return Boolean(
    coordinate
    && Number.isFinite(coordinate.lat)
    && Number.isFinite(coordinate.lng)
    && coordinate.lat >= -90
    && coordinate.lat <= 90
    && coordinate.lng >= -180
    && coordinate.lng <= 180,
  );
}

export function getRouteCenter(points: RoutePoint[], fallbackCenter: [number, number] = thailandRouteViewport.center): [number, number] {
  const coordinates = points.map((point) => point.item.coordinates).filter(hasCoordinates);
  const lng = coordinates.reduce((total, coordinate) => total + coordinate.lng, 0) / Math.max(1, coordinates.length);
  const lat = coordinates.reduce((total, coordinate) => total + coordinate.lat, 0) / Math.max(1, coordinates.length);
  return coordinates.length ? [lng, lat] : fallbackCenter;
}

export function fallbackRouteViewport(destinationLabel: string, countries: string[] = []): RouteViewport {
  const candidates = [...countries, destinationLabel]
    .flatMap((value) => value.split(/[,+/|]/))
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);
  const destination = destinationLabel.toLowerCase();

  if (destination.includes("hong kong") && destination.includes("shenzhen")) {
    return hongKongShenzhenRouteViewport;
  }

  for (const candidate of candidates) {
    const viewport = routeCountryViewports[candidate];
    if (viewport) return viewport;
  }

  for (const [keyword, viewport] of Object.entries(routeCountryViewports)) {
    if (keyword.length > 2 && destination.includes(keyword)) return viewport;
  }

  if (destination.includes("shenzhen")) return routeCountryViewports.hk ?? thailandRouteViewport;

  return thailandRouteViewport;
}

export function applyRouteMapTheme(map: import("maplibre-gl").Map) {
  routeMapThemeRules.forEach(({ layerId, property, value }) => {
    if (!map.getLayer(layerId)) return;
    map.setPaintProperty(layerId, property, value);
  });
}

function getRouteBounds(points: RoutePoint[]): [[number, number], [number, number]] {
  const coordinates = points.map((point) => point.item.coordinates).filter(hasCoordinates);
  const longitudes = coordinates.map((coordinate) => coordinate.lng);
  const latitudes = coordinates.map((coordinate) => coordinate.lat);
  return [
    [Math.min(...longitudes), Math.min(...latitudes)],
    [Math.max(...longitudes), Math.max(...latitudes)],
  ];
}

function markerStyle(point: RoutePoint, index: number, color: string): MarkerStyle {
  return {
    "--day-color": color,
    "--route-marker-text-color": markerTextColor(color),
    "--x": `${point.x}%`,
    "--y": `${point.y}%`,
    "--marker-delay": `${index * 18}ms`,
  };
}

function buildRoutePoints(items: ItineraryItem[]): RoutePoint[] {
  const regionalItems = items.filter(isRegionalMapStop);
  const coordinateItems = regionalItems.filter((item) => hasCoordinates(item.coordinates));
  const bounds = getBounds(coordinateItems);

  return regionalItems.map((item, index) => {
    const point = item.coordinates && bounds ? projectCoordinate(item.coordinates, bounds) : fallbackPoint(item, regionalItems, index);
    return { item, ...point };
  });
}

function isRegionalMapStop(item: ItineraryItem): boolean {
  if (!item.coordinates) return true;
  return hasCoordinates(item.coordinates);
}

function getBounds(items: ItineraryItem[]) {
  if (items.length < 2) return null;
  const latitudes = items.map((item) => item.coordinates!.lat);
  const longitudes = items.map((item) => item.coordinates!.lng);
  return {
    minLat: Math.min(...latitudes),
    maxLat: Math.max(...latitudes),
    minLng: Math.min(...longitudes),
    maxLng: Math.max(...longitudes),
  };
}

function projectCoordinate(
  coordinate: NonNullable<ItineraryItem["coordinates"]>,
  bounds: NonNullable<ReturnType<typeof getBounds>>,
): { x: number; y: number } {
  const lngRange = Math.max(bounds.maxLng - bounds.minLng, 0.01);
  const latRange = Math.max(bounds.maxLat - bounds.minLat, 0.01);
  const x = 12 + ((coordinate.lng - bounds.minLng) / lngRange) * 76;
  const y = 86 - ((coordinate.lat - bounds.minLat) / latRange) * 72;
  return { x: clamp(x, 9, 91), y: clamp(y, 9, 91) };
}

function fallbackPoint(item: ItineraryItem, items: ItineraryItem[], index: number): { x: number; y: number } {
  const dayIndex = Array.from(new Set(items.map((candidate) => candidate.day))).indexOf(item.day);
  const dayItems = items.filter((candidate) => candidate.day === item.day);
  const indexInDay = Math.max(0, dayItems.findIndex((candidate) => candidate.id === item.id));
  const x = 14 + (indexInDay / Math.max(1, dayItems.length - 1)) * 72;
  const y = 22 + dayIndex * 27 + (index % 2) * 5;
  return { x: clamp(x, 10, 90), y: clamp(y, 12, 88) };
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, Math.round(value * 10) / 10));
}
