export const drawerClassName =
  "weather-briefing-drawer fixed bottom-0 right-0 top-0 z-[50] grid w-[min(720px,78vw)] grid-rows-[auto_minmax(0,1fr)] overflow-hidden border-l border-(--color-border) bg-(--color-surface) shadow-[-28px_0_70px_rgb(15_23_42_/_0.18)] transition-[transform,opacity] duration-300 ease-out motion-reduce:transition-none max-[767px]:top-auto max-[767px]:max-h-[calc(100dvh-12px)] max-[767px]:w-full max-[767px]:rounded-t-[22px] max-[767px]:border-l-0 max-[767px]:border-t max-[767px]:shadow-[0_-18px_60px_rgb(15_23_42_/_0.18)]";
export const briefingSurfaceClassName =
  "weather-briefing-surface grid min-w-0 grid-rows-[auto_minmax(0,1fr)] overflow-hidden border-t border-(--color-border) bg-(--color-surface) max-[767px]:rounded-b-(--radius-lg) max-[767px]:[&_.weather-drawer-body]:p-3";
export const drawerHeaderClassName =
  "weather-drawer-header grid grid-cols-[minmax(0,1fr)_auto] gap-3 border-b border-(--color-border) bg-[linear-gradient(135deg,var(--color-surface)_0%,var(--color-route-soft)_100%)] px-5 py-4 max-[767px]:px-4 max-[767px]:py-3.5";
export const drawerHeroMetaClassName =
  "m-0 text-xs font-black leading-4 text-(--color-text-muted) max-[767px]:max-w-[240px]";
export const drawerHeroTitleClassName =
  "m-0 mt-1 text-[28px] font-black leading-9 text-(--color-text) max-[767px]:text-2xl max-[767px]:leading-8";
export const drawerCloseButtonClassName =
  "grid size-10 place-items-center rounded-full border border-(--color-border) bg-(--color-surface) p-0 text-(--color-text-muted) shadow-[0_1px_0_rgb(15_23_42_/_0.04)] hover:text-(--color-text) [&_.icon]:size-4 max-[767px]:size-9";
export const drawerBodyClassName =
  "weather-drawer-body grid min-h-0 content-start grid-cols-[minmax(0,1fr)_minmax(260px,0.86fr)] items-start gap-3 overflow-auto bg-(--color-surface-subtle) p-5 max-[767px]:grid-cols-1 max-[767px]:gap-2.5 max-[767px]:p-4";
export const briefingBlockClassName =
  "grid content-start gap-2 self-start rounded-(--radius-md) border border-(--color-border) bg-(--color-surface) p-4 shadow-[0_1px_0_rgb(15_23_42_/_0.04)]";
export const primaryWeatherBlockClassName =
  "grid content-start gap-2 self-start rounded-(--radius-md) bg-transparent p-0";
export const secondaryBriefingBlockClassName =
  `${briefingBlockClassName} max-[767px]:hidden`;
export const secondaryBriefingListClassName =
  "weather-secondary-list col-span-full hidden border-t border-(--color-border) pt-2 min-[768px]:grid";
export const secondaryBriefingRowClassName =
  "grid grid-cols-[140px_minmax(0,1fr)] gap-3 border-b border-(--color-border) py-3 last:border-b-0 [&_h3]:m-0 [&_h3]:text-xs [&_h3]:font-black [&_h3]:uppercase [&_h3]:tracking-[0.08em] [&_h3]:text-(--color-text-muted) [&_p]:m-0 [&_p]:text-sm [&_p]:font-bold [&_p]:leading-5 [&_p]:text-(--color-text)";
export const briefingImpactClassName =
  "weather-trip-impact col-span-full grid grid-cols-[48px_minmax(0,1fr)] items-center gap-3 rounded-(--radius-md) border border-(--color-route-border) bg-[linear-gradient(135deg,var(--color-surface)_0%,var(--color-route-soft)_100%)] p-4 shadow-[0_1px_0_rgb(15_23_42_/_0.04)] max-[767px]:grid-cols-[44px_minmax(0,1fr)] max-[767px]:p-3.5";
export const briefingImpactIconClassName =
  "grid size-12 place-items-center rounded-(--radius-md) border border-[color-mix(in_srgb,var(--color-route)_22%,var(--color-border))] bg-[rgb(255_255_255_/_0.82)] text-(--color-route) shadow-[inset_0_1px_0_rgb(255_255_255_/_0.7)] [&_.icon]:size-6 max-[767px]:size-11 max-[767px]:[&_.icon]:size-5";
export const briefingImpactTextClassName =
  "grid min-w-0 gap-0.5 [&_h3]:m-0 [&_h3]:text-sm [&_h3]:font-black [&_h3]:text-(--color-text) [&_p]:m-0 [&_p]:max-w-[54ch] [&_p]:text-sm [&_p]:font-bold [&_p]:leading-5 [&_p]:text-(--color-text-muted) max-[767px]:[&_p]:text-xs max-[767px]:[&_p]:leading-4";
export const weatherMetricGridClassName =
  "weather-metric-grid grid grid-cols-2 gap-2 max-[420px]:grid-cols-2";
export const weatherMetricChipClassName =
  "weather-metric-chip grid min-h-[68px] content-between rounded-(--radius-sm) border border-[color-mix(in_srgb,var(--color-route)_8%,var(--color-border))] bg-[rgb(255_255_255_/_0.56)] p-3 text-left [&_small]:text-[11px] [&_small]:font-extrabold [&_small]:leading-4 [&_small]:text-(--color-text-muted) [&_strong]:text-lg [&_strong]:font-black [&_strong]:leading-6 [&_strong]:text-(--color-text) max-[767px]:min-h-[58px] max-[767px]:p-2.5 max-[767px]:[&_strong]:text-base";
export const weatherDetailPillClassName =
  "rounded-(--radius-sm) border border-(--color-border) bg-(--color-surface-subtle) px-2.5 py-1.5 text-xs font-extrabold leading-4 text-(--color-text-muted)";
export const pendingBriefingClassName =
  "weather-pending-briefing col-span-full grid grid-cols-[48px_minmax(0,1fr)] items-center gap-3 self-start rounded-(--radius-md) border border-(--color-route-border) bg-[linear-gradient(135deg,var(--color-surface)_0%,var(--color-route-soft)_100%)] p-4 shadow-[0_1px_0_rgb(15_23_42_/_0.04)] max-[767px]:grid-cols-[36px_minmax(0,1fr)] max-[767px]:gap-2.5 max-[767px]:p-3 max-[767px]:[&>span]:size-9 max-[767px]:[&>span_.icon]:size-4 [&_.weather-source-meta]:col-span-full [&_.weather-source-meta]:mt-1 max-[767px]:[&_.weather-source-meta]:hidden";
export const metaClassName = "weather-source-meta m-0 text-[10px] font-extrabold leading-4 text-(--color-text-muted) max-[767px]:truncate";
export const organizerFormClassName =
  "weather-organizer-form grid content-start gap-2";
export const organizerDisclosureClassName =
  "weather-organizer-disclosure col-span-full hidden rounded-(--radius-md) border border-dashed border-(--color-border) bg-(--color-surface) p-3 text-sm min-[768px]:grid [&_summary]:cursor-pointer [&_summary]:font-black [&_summary]:text-(--color-text-muted) [&_summary]:outline-none open:[&_summary]:mb-3";
export const textAreaClassName = "min-h-16 rounded-(--radius-sm) border border-(--color-border) bg-white p-2 text-sm font-bold text-(--color-text) focus:border-(--color-route-border) focus:outline-none focus:ring-3 focus:ring-[rgb(191_219_254_/_0.45)]";
