export type RouteViewport = {
  center: [number, number];
  zoom: number;
};

export const maxAllDaysCoordinateResolutionBatch = 8;

export const routeDayColors = [
  "#c24f16",
  "#2563eb",
  "#b45309",
  "#15803d",
  "#be123c",
  "#0369a1",
];

export const thailandRouteViewport: RouteViewport = { center: [100.9925, 15.8700], zoom: 5 };

export const hongKongShenzhenRouteViewport: RouteViewport = { center: [114.1800, 22.3900], zoom: 9.8 };

export const routeCountryViewports: Record<string, RouteViewport> = {
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

export const routeMapThemeRules = [
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
] as const;

export const routeMapPanelClassName =
  "route-map-panel grid h-full min-h-0 min-w-0 grid-rows-[auto_minmax(0,1fr)] bg-transparent px-6 py-[22px] pb-7 max-[1199px]:h-auto max-[1199px]:min-h-[calc(100dvh-48px)] max-[1199px]:px-0 max-[1199px]:py-0 max-[1199px]:pb-0 max-[767px]:h-[calc(100dvh-48px)] max-[767px]:overflow-hidden max-[767px]:[&_.page-header]:mb-0 max-[767px]:[&_.page-header]:min-h-0 max-[767px]:[&_.page-header]:px-3 max-[767px]:[&_.page-header]:py-2 max-[767px]:[&_.page-header-copy]:gap-0.5 max-[767px]:[&_.page-header-meta]:mt-1 max-[767px]:[&_.page-header-meta]:flex-nowrap max-[767px]:[&_.page-header-meta]:gap-1.5 max-[767px]:[&_.page-header-meta]:overflow-x-auto max-[767px]:[&_.page-header-meta]:pb-0.5 max-[767px]:[&_.page-header-meta]:[scrollbar-width:none] max-[767px]:[&_.page-header-meta::-webkit-scrollbar]:hidden max-[767px]:[&_.page-header-meta>span]:min-h-6 max-[767px]:[&_.page-header-meta>span]:shrink-0 max-[767px]:[&_.page-header-meta>span]:px-2 max-[767px]:[&_.page-header-meta>span]:text-[10px] max-[767px]:[&_h1]:text-[18px] max-[767px]:[&_h1]:leading-6 max-[767px]:[&_h2]:truncate max-[767px]:[&_h2]:text-[12px] max-[767px]:[&_h2]:leading-4";

export const routeMapLayoutClassName =
  "route-map-layout mb-7 block h-full min-h-0 w-full rounded-(--radius-lg) border border-[color-mix(in_srgb,var(--color-route)_18%,var(--color-border))] bg-[linear-gradient(135deg,var(--color-surface)_0%,var(--color-route-soft)_100%)] p-2 shadow-[0_1px_0_rgb(15_23_42_/_0.04)] max-[1199px]:mb-0 max-[1199px]:w-full max-[1199px]:rounded-none max-[1199px]:border-0 max-[1199px]:bg-transparent max-[1199px]:p-0 max-[1199px]:shadow-none";

export const routeMapCanvasClassName =
  "route-map-canvas relative h-full min-h-[560px] overflow-hidden rounded-(--radius-lg) border border-[color-mix(in_srgb,var(--color-route)_18%,var(--color-border))] bg-[linear-gradient(135deg,var(--color-surface)_0%,var(--color-route-soft)_100%)] max-[1199px]:min-h-[calc(100dvh-168px)] max-[1199px]:rounded-none max-[1199px]:border-x-0 max-[1199px]:border-b-0 max-[767px]:h-[calc(100dvh-48px)] max-[767px]:min-h-0";

export const mapDayFilterClassName =
  "map-day-filter absolute left-3 top-3 z-[8] flex max-w-[min(760px,calc(100%_-_104px))] flex-wrap gap-2 rounded-(--radius-lg) border border-[color-mix(in_srgb,var(--color-route)_18%,white)] bg-[rgb(255_255_255_/_0.86)] p-1.5 shadow-[0_1px_0_rgb(15_23_42_/_0.04)] max-[767px]:left-2 max-[767px]:right-auto max-[767px]:top-2 max-[767px]:w-[calc(100%_-_82px)] max-[767px]:max-w-[calc(100%_-_82px)] max-[767px]:flex-nowrap max-[767px]:gap-1 max-[767px]:overflow-x-auto max-[767px]:rounded-(--radius-md) max-[767px]:bg-[rgb(255_255_255_/_0.92)] max-[767px]:p-1 max-[767px]:[scrollbar-width:none] max-[767px]:[&::-webkit-scrollbar]:hidden";

export const mapDayFilterButtonClassName =
  "map-day-filter-button inline-flex min-h-8 shrink-0 items-center gap-1.5 rounded-full border border-[color-mix(in_srgb,var(--color-route)_14%,var(--color-border))] bg-[rgb(255_255_255_/_0.78)] px-2.5 py-1.5 text-[11px] font-extrabold leading-4 text-(--color-text-muted) transition-[background,border-color,color,box-shadow] duration-150 hover:border-[var(--day-color,var(--color-route))] hover:bg-(--color-route-soft) hover:text-(--color-text) focus-visible:border-[var(--day-color,var(--color-route))] focus-visible:bg-(--color-route-soft) focus-visible:text-(--color-text) max-[767px]:min-h-7 max-[767px]:px-2 max-[767px]:py-1 max-[767px]:text-[10px]";

export const activeMapDayFilterButtonClassName =
  "map-day-filter-button--active border-[var(--day-color,var(--color-primary))] bg-(--color-primary-soft) text-(--color-text) shadow-[0_2px_6px_rgb(194_79_22_/_0.12)]";

export const mapDaySwatchClassName = "map-day-swatch size-[9px] rounded-full bg-[var(--day-color,var(--color-route))] shadow-[0_0_0_2px_rgb(255_255_255_/_0.94)]";
export const routeLiveMapClassName = "route-live-map absolute inset-0 z-[4] bg-(--color-route-soft) transition-opacity duration-200";
export const routeLiveMapPendingClassName = "route-live-map--pending pointer-events-none opacity-0";
export const routeMapStatusClassName =
  "route-map-status absolute left-1/2 top-1/2 z-[7] m-0 grid min-w-[220px] -translate-x-1/2 -translate-y-1/2 gap-1 rounded-(--radius-md) border border-(--color-route-border) bg-[rgb(255_255_255_/_0.9)] px-3 py-2.5 text-xs font-extrabold text-(--color-route) shadow-[0_4px_8px_rgb(37_99_235_/_0.08)]";
export const routeMapFallbackClassName = "route-map-fallback absolute inset-0 z-[2]";
export const routeMapRetryButtonClassName =
  "route-map-retry mt-2 inline-flex min-h-9 items-center gap-1.5 rounded-(--radius-sm) border border-(--color-route-border) bg-(--color-surface) px-3 py-1.5 text-xs font-extrabold text-(--color-route) transition-[background,border-color,box-shadow] duration-150 hover:bg-(--color-route-soft) focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-primary) [&_.icon]:size-3.5";
export const mapZoneClassName =
  "map-zone absolute z-[1] rounded-full border border-[color-mix(in_srgb,var(--color-route)_14%,var(--color-border))] bg-[rgb(255_255_255_/_0.82)] px-2 py-1 text-[11px] font-extrabold uppercase leading-[15px] text-(--color-text-muted) shadow-[0_1px_0_rgb(15_23_42_/_0.05)]";
export const mapZoneHongKongClassName = "map-zone--hk left-[17px] top-[76px] max-[767px]:top-[88px]";
export const mapZoneShenzhenClassName = "map-zone--sz right-[18px] top-[78px] max-[767px]:top-[126px]";
export const mapZoneBayClassName = "map-zone--bay bottom-5 right-6 text-(--color-route)";
export const routeMapSvgClassName = "route-map-svg absolute inset-0 z-[2] size-full overflow-visible";
export const routeMapPathShadowClassName =
  "route-map-path route-map-path--shadow fill-none stroke-white stroke-[7.2] opacity-[0.92] [stroke-linecap:round] [stroke-linejoin:round]";
export const routeMapPathClassName =
  "route-map-path fill-none stroke-[var(--day-color,var(--color-route))] stroke-[3.2] [stroke-linecap:round] [stroke-linejoin:round]";
export const routeMarkerClassName =
  "route-marker absolute left-[var(--x)] top-[var(--y)] z-[3] grid size-[34px] -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border-[3px] border-white bg-[var(--day-color,var(--color-route))] text-[11px] font-extrabold tabular-nums text-[var(--route-marker-text-color)] shadow-[0_6px_12px_rgb(15_23_42_/_0.18)] transition-[background,box-shadow,transform] duration-150 [animation:route-marker-in_180ms_ease-out_both] [animation-delay:var(--marker-delay)]";
export const routeStopListClassName =
  "route-stop-list absolute right-3 top-[78px] z-[6] grid max-h-[min(292px,52%)] w-[min(282px,calc(100%_-_24px))] gap-1.5 overflow-y-auto rounded-(--radius-md) border border-(--color-route-border) bg-[rgb(255_255_255_/_0.9)] p-2.5 text-[11px] font-bold leading-4 text-(--color-text-muted) shadow-[0_4px_8px_rgb(37_99_235_/_0.08)] max-[767px]:hidden";
export const routeStopListItemClassName = "route-stop-list-item grid grid-cols-[auto_minmax(0,1fr)] gap-2 rounded-(--radius-sm) border border-(--color-border) bg-(--color-surface-subtle) px-1.5 py-1.5";
export const routeStopListIndexClassName = "grid size-5 place-items-center rounded-full bg-[var(--day-color,var(--color-route))] text-[10px] font-black text-white";
export const routeStopListCopyClassName = "min-w-0 truncate";
export const mapSourceNoteClassName = "map-source-note absolute bottom-2 right-2.5 z-[6] m-0 rounded-full border border-(--color-route-border) bg-[rgb(255_255_255_/_0.86)] px-2 py-1 text-[10px] font-extrabold leading-[14px] text-(--color-route)";
export const unresolvedPanelClassName =
  "map-unresolved-panel absolute bottom-3 left-3 z-[7] grid max-h-[min(220px,42%)] w-[min(360px,calc(100%_-_24px))] gap-2 overflow-hidden rounded-(--radius-md) border border-(--color-warning-border) bg-[linear-gradient(135deg,var(--color-surface)_0%,var(--color-warning-soft)_100%)] p-3 text-(--color-warning-strong) shadow-[0_4px_8px_rgb(249_115_22_/_0.08)] max-[767px]:bottom-3 max-[767px]:left-2 max-[767px]:right-2 max-[767px]:top-auto max-[767px]:max-h-none max-[767px]:w-auto max-[767px]:gap-1 max-[767px]:rounded-(--radius-md) max-[767px]:border-[color-mix(in_srgb,var(--color-warning-border)_64%,transparent)] max-[767px]:bg-[rgb(255_255_255_/_0.9)] max-[767px]:p-2 max-[767px]:shadow-[0_1px_0_rgb(15_23_42_/_0.04)]";
export const unresolvedPanelHeaderClassName =
  "map-unresolved-header flex min-w-0 items-start gap-2 text-[12px] font-extrabold leading-5 text-(--color-warning-strong) max-[767px]:items-center max-[767px]:text-[11px] max-[767px]:leading-4";
export const unresolvedPanelActionsClassName = "flex min-w-0 items-center justify-between gap-2 max-[767px]:gap-1.5";
export const unresolvedPanelButtonClassName =
  "inline-flex min-h-8 w-fit shrink-0 items-center justify-center gap-1.5 rounded-(--radius-sm) border border-(--color-warning-border) bg-(--color-surface) px-2.5 text-[11px] font-extrabold text-(--color-warning-strong) transition-colors duration-150 hover:bg-(--color-warning-soft) focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--color-focus) disabled:cursor-not-allowed disabled:opacity-55 [&_.icon]:size-3.5 max-[767px]:min-h-7 max-[767px]:px-2 max-[767px]:text-[10px]";
export const unresolvedPanelStatusClassName =
  "m-0 min-w-0 text-[11px] font-bold leading-4 text-(--color-warning-strong) max-[767px]:text-[10px]";
export const unresolvedPanelListClassName =
  "map-unresolved-list m-0 grid gap-1.5 overflow-y-auto p-0 max-[767px]:hidden";
export const unresolvedPanelItemClassName =
  "map-unresolved-item grid gap-0.5 rounded-(--radius-sm) bg-(--color-surface) px-2 py-1.5 text-[11px] leading-4 text-(--color-warning-strong)";
export const unresolvedPanelItemTitleClassName = "font-extrabold text-(--color-text)";

export const DARK_TEXT = "#0f172a";
export const MINIMUM_A11Y_CONTRAST = 4.5;
