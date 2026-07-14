import { workspaceResponsivePanelResetClassName } from "@/src/shared/components/workspace-surface/workspace-surface.styles";

export const timelinePanelClassName =
  "timeline-panel grid min-h-full min-w-0 grid-rows-[auto_minmax(0,1fr)] gap-3 bg-(--color-page) px-6 py-[22px] pb-7 max-[1199px]:min-h-[calc(100dvh-48px)] max-[1199px]:gap-0 max-[1199px]:px-0 max-[1199px]:py-0 max-[1199px]:pb-0 max-[767px]:h-[calc(100dvh-48px)] max-[767px]:overflow-hidden";
export const timelineGridClassName =
  "timeline-grid mb-[30px] grid w-full grid-cols-3 gap-3 p-0 max-[1199px]:mb-0 max-[1199px]:grid-cols-1 max-[1199px]:gap-0 max-[767px]:overflow-y-auto";
export const timelineDayClassName =
  `timeline-day overflow-hidden rounded-(--radius-lg) border border-[color-mix(in_srgb,var(--color-route)_16%,var(--color-border))] bg-[linear-gradient(135deg,var(--color-surface)_0%,var(--color-route-soft)_100%)] shadow-[0_1px_0_rgb(15_23_42_/_0.04)] ${workspaceResponsivePanelResetClassName}`;
export const timelineDayHeaderClassName =
  "timeline-day-header flex min-h-[50px] items-center justify-between gap-2.5 border-b border-[color-mix(in_srgb,var(--color-route)_18%,var(--color-border))] bg-[rgb(255_255_255_/_0.72)] px-3.5 py-2.5 [&_strong]:text-[13px] [&_strong]:font-extrabold [&_strong]:leading-[18px] [&_strong]:text-(--color-text) [&_span:not(.badge)]:text-[11px] [&_span:not(.badge)]:font-bold [&_span:not(.badge)]:leading-[15px] [&_span:not(.badge)]:text-(--color-text-muted) max-[767px]:flex-col max-[767px]:items-start";
export const timelineDayHeaderCopyClassName = "grid min-w-0 gap-px";
export const timelineStopListClassName =
  "timeline-stop-list m-0 grid list-none gap-1.5 p-0 [&_.timeline-stop:last-child_.timeline-stop-button]:border-b-0";
export const timelineStopClassName = "timeline-stop relative";
export const timelineStopButtonClassName =
  "timeline-stop-button relative z-[1] grid min-h-[86px] w-full grid-cols-[56px_34px_minmax(0,1fr)] items-start gap-2.5 border-0 border-b border-[color-mix(in_srgb,var(--color-route)_14%,var(--color-border))] bg-[rgb(255_255_255_/_0.78)] px-3.5 py-2.5 text-left text-(--color-text) transition-[background,box-shadow] duration-150 hover:bg-(--color-primary-soft) focus-visible:bg-(--color-primary-soft) focus-visible:outline-none max-[767px]:min-h-[82px] max-[767px]:grid-cols-[62px_32px_minmax(0,1fr)] max-[767px]:gap-2";
export const selectedTimelineStopButtonClassName =
  "bg-(--color-primary-soft) shadow-[inset_0_0_0_1px_var(--color-primary-border),inset_3px_0_0_var(--color-primary)]";
export const timelineTimeClassName =
  "timeline-time col-start-1 row-span-3 grid min-w-0 gap-0.5 [&_span]:text-[11px] [&_span]:font-bold [&_span]:leading-[15px] [&_span]:tabular-nums [&_span]:text-(--color-text-muted) [&_strong]:text-[13px] [&_strong]:font-extrabold [&_strong]:leading-[18px] [&_strong]:tabular-nums [&_strong]:text-(--color-text)";
export const timelineNodeClassName =
  "timeline-node col-start-2 row-start-1 grid size-8 place-items-center rounded-full border-2 border-white bg-(--color-primary-soft) text-(--color-primary-strong) shadow-[0_1px_0_rgb(15_23_42_/_0.06)]";
export const selectedTimelineNodeClassName =
  "bg-(--color-primary) text-white shadow-[0_0_0_1px_var(--color-primary)]";
export const timelineCopyClassName =
  "timeline-copy col-start-3 row-start-1 grid min-w-0 gap-0.5 [&_span]:[overflow-wrap:anywhere] [&_span]:text-xs [&_span]:font-semibold [&_span]:leading-4 [&_span]:text-(--color-text-muted) [&_strong]:overflow-hidden [&_strong]:whitespace-normal [&_strong]:text-[13px] [&_strong]:font-extrabold [&_strong]:leading-[18px] [&_strong]:text-(--color-text) [&_strong]:text-ellipsis";
export const timelineMetaClassName =
  "timeline-meta col-start-3 row-start-2 flex min-w-0 flex-wrap content-start gap-x-2 gap-y-1 [&_span]:text-xs [&_span]:font-semibold [&_span]:leading-4 [&_span]:text-(--color-text-muted)";
export const timelineWarningClassName =
  "timeline-warning col-start-3 row-start-3 inline-flex min-h-6 w-fit items-center gap-1.5 rounded-(--radius-sm) border border-(--color-warning-border) bg-(--color-warning-soft) px-2 py-0.5 text-[11px] font-extrabold leading-[15px] text-(--color-warning-strong)";
export const detailsToggleButtonClassName =
  "details-toggle-button aria-[expanded=false]:border-(--color-primary-border) aria-[expanded=false]:bg-(--color-primary-soft) aria-[expanded=false]:text-(--color-primary-strong)";
export const pageHeaderActionsClassName =
  "page-header-actions relative z-[1] flex max-w-[420px] min-w-0 flex-wrap items-center justify-end gap-2";
