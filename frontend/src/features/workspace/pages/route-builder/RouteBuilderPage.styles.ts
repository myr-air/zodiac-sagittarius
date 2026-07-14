export const pageClass = "grid h-full min-h-0 gap-4 grid-cols-1";

export const mapColumnClass = "min-h-0 overflow-hidden";

export const mapSurfaceClassName =
  "flex flex-col h-full min-h-0 overflow-hidden rounded-(--radius-lg) border border-(--color-border) bg-(--color-surface) shadow-[0_1px_0_rgb(15_23_42_/_0.04)]";

export const mapContainerClassName =
  "relative h-full min-h-[400px] w-full rounded-lg";

export const mapStatusOverlayClassName =
  "absolute inset-0 z-10 flex items-center justify-center gap-2 rounded-lg bg-(--color-surface-subtle)/86 text-sm font-extrabold text-(--color-text-muted) backdrop-blur-sm";

export const emptyPromptClassName =
  "pointer-events-none absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 text-(--color-text-muted)";

export const distanceBadgesRowClassName =
  "flex flex-wrap items-center gap-2 px-4 py-3";

export const distanceBadgeClassName =
  "inline-flex items-center gap-1 rounded-full border border-(--color-route-border) bg-(--color-route-soft) px-2.5 py-1 text-[11px] font-extrabold text-(--color-route) tabular-nums";

export const controlsClassName = "flex items-start gap-2 border-t border-(--color-border) px-4 py-3";

export const addStopFormClassName = "grid w-full gap-2";

export const addStopFormGridClassName = "grid grid-cols-[1fr_1fr] gap-2";

export const formErrorClassName = "text-[11px] font-bold text-(--color-danger)";

export const formActionsClassName = "flex items-center gap-2 pt-1";

export const waypointMarkerClassName =
  "waypoint-marker flex size-6 items-center justify-center rounded-full bg-(--color-primary) text-[11px] font-extrabold text-white shadow-[0_3px_6px_rgb(15_23_42_/_0.18)] opacity-0 transition-opacity duration-150";

export const routeSourceId = "route-line-source";
export const routeLineLayerId = "route-line-layer";
export const routeLineColor = "#2563eb";
export const routeLineWidth = 3;
