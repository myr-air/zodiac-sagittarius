export const pageHeaderActionsClassName =
  "page-header-actions relative z-[20] grid w-[min(560px,100%)] min-w-0 justify-items-end gap-2 overflow-visible max-[1199px]:w-full max-[1199px]:justify-items-stretch";
export const pageHeaderNoteClassName =
  "page-header-note m-0 text-right text-xs font-bold text-(--color-warning-strong) max-[1199px]:text-left";
export const headerControlsButtonClassName =
  "itinerary-header-controls-button inline-flex min-h-9 max-w-full items-center justify-center gap-2 rounded-(--radius-sm) border border-(--color-border) bg-(--color-surface) px-3 text-xs font-extrabold text-(--color-text) transition-[background,border-color,color] duration-150 hover:border-(--color-primary-border) hover:bg-(--color-primary-soft) hover:text-(--color-primary-strong) aria-[expanded=true]:border-(--color-primary-border) aria-[expanded=true]:bg-(--color-primary-soft) aria-[expanded=true]:text-(--color-primary-strong) [&_.icon]:size-4";
export const headerControlsPanelClassName =
  "itinerary-header-controls absolute right-0 top-[calc(100%_+_8px)] z-[30] grid max-h-[min(72vh,620px)] w-[min(640px,calc(100vw_-_32px))] min-w-0 origin-top-right overflow-y-auto overscroll-contain rounded-(--radius-md) border border-[color-mix(in_srgb,var(--color-primary)_22%,var(--color-border))] bg-(--color-surface) p-0 text-left shadow-[0_8px_8px_rgb(55_47_38_/_0.10)] [transition:opacity_160ms_var(--motion-ease-out),transform_160ms_var(--motion-ease-out),box-shadow_160ms_var(--motion-ease-out)] will-change-[opacity,transform] data-[state=closed]:pointer-events-none data-[state=closed]:-translate-y-1.5 data-[state=closed]:scale-[0.98] data-[state=closed]:opacity-0 data-[state=open]:translate-y-0 data-[state=open]:scale-100 data-[state=open]:opacity-100 motion-reduce:transform-none motion-reduce:transition-none max-[767px]:fixed max-[767px]:inset-x-3 max-[767px]:top-20 max-[767px]:max-h-[calc(100vh_-_96px)] max-[767px]:w-auto max-[767px]:origin-top";
export const headerControlsTitleBarClassName =
  "grid min-w-0 gap-1 border-b border-(--color-border) bg-[linear-gradient(180deg,var(--color-surface)_0%,var(--color-surface-subtle)_100%)] px-4 py-3";
export const headerControlsTitleClassName =
  "flex min-w-0 items-center justify-between gap-3 text-sm font-extrabold text-(--color-text)";
export const headerControlsContentClassName = "grid min-w-0 gap-0";
export const headerControlsSectionClassName =
  "grid min-w-0 gap-3 border-b border-(--color-border) px-4 py-3 last:border-b-0";
export const headerControlsSectionHeaderClassName =
  "flex min-w-0 flex-wrap items-center justify-between gap-2 text-xs font-bold text-(--color-text-muted) [&_strong]:text-(--color-text)";
export const headerControlsGridClassName =
  "grid min-w-0 grid-cols-[minmax(220px,1fr)_minmax(150px,180px)] items-end gap-2 rounded-(--radius-sm) bg-(--color-surface-subtle) p-2 max-[640px]:grid-cols-1";
export const tripPlanFieldClassName =
  "grid min-w-0 gap-1 text-[11px] font-extrabold text-(--color-text-muted)";
export const tripPlanSelectClassName =
  "min-h-10 w-full min-w-0 rounded-(--radius-sm) border border-(--color-border) bg-(--color-surface) px-2.5 text-sm font-bold text-(--color-text) outline-none transition-[border-color,box-shadow] duration-150 focus:border-(--color-route-border) focus:shadow-[0_0_0_2px_rgb(191_219_254_/_0.55)] disabled:cursor-not-allowed disabled:opacity-50";
export const tripPlanActionsClassName =
  "grid min-w-0 grid-cols-2 gap-2 max-[640px]:grid-cols-1";
export const tripPlanCreateFormClassName =
  "trip-plan-create-form col-span-full grid min-w-0 grid-cols-[minmax(0,1fr)_auto_auto] items-end gap-2 max-[640px]:grid-cols-1";
export const tripPlanNameFieldClassName =
  "grid min-w-0 gap-1 text-[11px] font-extrabold text-(--color-text-muted)";
export const tripPlanNameInputClassName =
  "min-h-10 w-full min-w-0 rounded-(--radius-sm) border border-(--color-border) bg-(--color-surface) px-2.5 text-sm font-bold text-(--color-text) outline-none placeholder:text-(--color-text-muted) focus:border-(--color-route-border) focus:shadow-[0_0_0_2px_rgb(191_219_254_/_0.55)] disabled:cursor-not-allowed disabled:opacity-50";
export const tripPlanButtonClassName =
  "min-h-10 rounded-(--radius-sm) px-3 text-xs font-extrabold";
export const tripPlanSecondaryButtonClassName =
  "inline-flex min-h-10 items-center justify-center rounded-(--radius-sm) border border-(--color-border) bg-(--color-surface-subtle) px-3 text-xs font-extrabold text-(--color-text-muted) transition-colors hover:enabled:border-(--color-route-border) hover:enabled:bg-(--color-route-soft) hover:enabled:text-(--color-route) disabled:cursor-not-allowed disabled:opacity-50";
export const pathFilterSummaryClassName =
  "min-w-0 truncate text-xs font-semibold text-(--color-text-muted)";
export const showAllPathsToggleClassName =
  "show-all-paths-toggle inline-grid min-h-9 w-full grid-cols-[auto_minmax(0,1fr)] items-center gap-2 rounded-(--radius-sm) border border-(--color-route-border) bg-(--color-surface) px-2.5 text-xs font-extrabold text-(--color-route) transition-[background,border-color,color] duration-150 hover:bg-(--color-route-soft) has-[:checked]:border-(--color-primary-border) has-[:checked]:bg-(--color-primary-soft) has-[:checked]:text-(--color-primary-strong) [&_input]:size-4 [&_input]:accent-[var(--color-primary)]";
export const pathFilterPanelClassName =
  "itinerary-filter-panel grid min-w-0 grid-cols-[repeat(auto-fit,minmax(118px,1fr))] gap-1.5";
export const pathFilterOptionClassName =
  "inline-grid min-h-9 min-w-0 grid-cols-[auto_minmax(0,1fr)] items-center gap-2 rounded-(--radius-sm) border border-(--color-route-border) bg-(--color-surface) px-2.5 text-xs font-semibold text-(--color-route) transition-[background,border-color,color] duration-150 hover:border-(--color-route-border) hover:bg-(--color-route-soft) [&_span]:truncate";
