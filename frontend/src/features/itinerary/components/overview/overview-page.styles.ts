import { workspaceResponsivePanelResetClassName } from "@/src/shared/components/workspace-surface/workspace-surface.styles";
import { workspacePanelHeadingOverviewClassName } from "@/src/shared/components/workspace-panel-heading";

export const overviewPageClassName =
  "overview-page grid min-h-full min-w-0 max-w-full overflow-hidden gap-3 bg-transparent px-6 py-[22px] pb-7 max-[1199px]:min-h-[calc(100dvh-48px)] max-[1199px]:gap-0 max-[1199px]:bg-(--color-surface) max-[1199px]:px-0 max-[1199px]:py-0 max-[1199px]:pb-0 max-[767px]:overflow-y-auto";
export const overviewSummaryBentoClassName =
  "overview-summary-bento grid min-w-0 max-w-full grid-cols-12 items-start gap-3 max-[1199px]:grid-cols-1 max-[1199px]:gap-0";
export const overviewWeatherBentoClassName =
  "overview-weather-bento col-span-12 min-w-0 overflow-hidden rounded-(--radius-lg) border border-(--color-border) bg-(--color-surface) shadow-[0_1px_0_rgb(15_23_42_/_0.04)] max-[1199px]:col-auto max-[1199px]:rounded-none max-[1199px]:border-x-0 max-[1199px]:shadow-none [&_.weather-forecast-strip]:m-0 [&_.weather-forecast-strip]:w-full [&_.weather-forecast-strip]:rounded-none [&_.weather-forecast-strip]:border-0 [&_.weather-forecast-strip]:px-4 [&_.weather-forecast-strip]:py-3 [&_.weather-forecast-strip]:shadow-none";
export const overviewCockpitClassName =
  "overview-travel-cockpit col-span-7 grid w-full min-w-0 max-w-full grid-cols-3 items-start gap-3 overflow-hidden self-start max-[1199px]:col-auto max-[1199px]:mb-0 max-[1199px]:grid-cols-2 max-[1199px]:gap-0 max-[1199px]:[&_.overview-cockpit-card:nth-child(3)]:col-span-full";
export const overviewPhaseCardClassName =
  "overview-phase-card col-span-5 grid min-w-0 gap-3 overflow-hidden rounded-(--radius-lg) border border-[color-mix(in_srgb,var(--overview-phase-accent)_18%,var(--color-border))] bg-(--color-surface) p-4 shadow-[0_1px_0_rgb(15_23_42_/_0.04)] [--overview-phase-accent:var(--color-primary)] [--overview-phase-wash:var(--color-surface-subtle)] max-[1199px]:col-auto max-[1199px]:rounded-none max-[1199px]:border-x-0 max-[1199px]:shadow-none";
export const overviewPhaseToneClassNames = {
  incoming: "[--overview-phase-accent:var(--color-primary)] [--overview-phase-wash:var(--color-primary-soft)]",
  active: "[--overview-phase-accent:var(--color-warning-strong)] [--overview-phase-wash:var(--color-warning-soft)]",
  completed: "[--overview-phase-accent:var(--color-route)] [--overview-phase-wash:var(--color-route-soft)]",
} as const;
export const overviewPhaseHeaderClassName =
  "overview-phase-header grid gap-1.5 [&_span]:w-fit [&_span]:rounded-full [&_span]:border [&_span]:border-[color-mix(in_srgb,var(--overview-phase-accent)_26%,var(--color-border))] [&_span]:bg-[rgb(255_255_255_/_0.7)] [&_span]:px-2.5 [&_span]:py-1 [&_span]:text-[11px] [&_span]:font-extrabold [&_span]:leading-4 [&_span]:text-(--overview-phase-accent) [&_h2]:m-0 [&_h2]:text-[18px] [&_h2]:font-black [&_h2]:leading-6 [&_h2]:text-(--color-text) [&_p]:m-0 [&_p]:text-xs [&_p]:font-bold [&_p]:leading-5 [&_p]:text-(--color-text-muted)";
export const overviewPhaseFactListClassName =
  "overview-phase-facts m-0 grid list-none grid-cols-3 gap-2 p-0 max-[1399px]:grid-cols-1 [&_li]:grid [&_li]:grid-cols-[28px_minmax(0,1fr)] [&_li]:items-start [&_li]:gap-2 [&_li]:rounded-(--radius-sm) [&_li]:border [&_li]:border-[color-mix(in_srgb,var(--overview-phase-accent)_14%,var(--color-border))] [&_li]:bg-(--overview-phase-wash) [&_li]:p-2.5 [&_.icon]:mt-0.5 [&_.icon]:size-[16px] [&_.icon]:text-(--overview-phase-accent) [&_small]:block [&_small]:text-[11px] [&_small]:font-extrabold [&_small]:leading-4 [&_small]:text-(--color-text-muted) [&_strong]:block [&_strong]:min-w-0 [&_strong]:text-[13px] [&_strong]:font-black [&_strong]:leading-[18px] [&_strong]:text-(--color-text) [&_strong]:[overflow-wrap:anywhere]";
export const overviewReadinessChipsClassName =
  "overview-readiness-chips flex min-w-0 flex-wrap gap-1.5 [&_span]:min-w-0 [&_span]:rounded-(--radius-sm) [&_span]:border [&_span]:border-[color-mix(in_srgb,var(--color-primary)_14%,var(--color-border))] [&_span]:bg-[rgb(255_255_255_/_0.68)] [&_span]:px-[7px] [&_span]:py-1 [&_span]:text-[11px] [&_span]:font-extrabold [&_span]:leading-[15px] [&_span]:text-(--color-text-muted)";

export const modalBackdropClassName =
  "modal-backdrop fixed inset-0 z-20 grid place-items-center bg-[rgb(15_23_42_/_0.28)] p-5 max-[767px]:items-end max-[767px]:p-2.5";
export const taskDialogClassName =
  "stop-dialog overview-task-dialog max-h-[calc(100vh-40px)] w-[min(480px,100%)] overflow-auto rounded-(--radius-lg) border border-(--color-border-strong) bg-(--color-surface) shadow-[0_14px_34px_rgb(15_23_42_/_0.16)]";
export const taskDialogTitleRowClassName =
  "dialog-title-row grid min-h-[62px] grid-cols-[minmax(0,1fr)_34px] items-center gap-3 border-b border-(--color-border) bg-[linear-gradient(180deg,var(--color-surface)_0%,var(--color-surface-subtle)_100%)] py-0 pl-5 pr-[18px] [&_button]:grid [&_button]:size-[34px] [&_button]:cursor-pointer [&_button]:place-items-center [&_button]:rounded-(--radius-sm) [&_button]:border [&_button]:border-transparent [&_button]:bg-transparent [&_button]:text-(--color-text-muted) [&_button]:transition-[background,border-color,color] [&_button]:duration-200 [&_button:focus-visible]:border-(--color-border) [&_button:focus-visible]:bg-(--color-surface) [&_button:focus-visible]:text-(--color-text) [&_button:hover]:border-(--color-border) [&_button:hover]:bg-(--color-surface) [&_button:hover]:text-(--color-text) [&_h2]:m-0 [&_h2]:text-lg [&_h2]:font-black [&_h2]:leading-6 [&_h2]:text-(--color-text) [&_.icon]:size-[18px]";
export const taskDialogGridClassName =
  "dialog-grid grid grid-cols-2 gap-3.5 px-5 pb-5 pt-[18px] max-[767px]:grid-cols-1 [&_input]:min-h-11 [&_input]:w-full [&_input]:rounded-[10px] [&_input]:border [&_input]:border-(--color-border) [&_input]:bg-(--color-surface-subtle) [&_input]:px-3 [&_input]:text-sm [&_input]:font-bold [&_input]:text-(--color-text) [&_input]:transition-[background,border-color,box-shadow] [&_input]:duration-200 [&_input:focus]:border-(--color-route-border) [&_input:focus]:bg-(--color-surface) [&_input:focus]:shadow-[0_0_0_3px_rgb(191_219_254_/_0.55)] [&_input:focus]:outline-none [&_label]:grid [&_label]:min-w-0 [&_label]:gap-[7px] [&_label>span]:text-xs [&_label>span]:font-extrabold [&_label>span]:leading-4 [&_label>span]:text-(--color-text) [&_select]:min-h-11 [&_select]:w-full [&_select]:rounded-[10px] [&_select]:border [&_select]:border-(--color-border) [&_select]:bg-(--color-surface-subtle) [&_select]:px-3 [&_select]:text-sm [&_select]:font-bold [&_select]:text-(--color-text) [&_select]:transition-[background,border-color,box-shadow] [&_select]:duration-200 [&_select:focus]:border-(--color-route-border) [&_select:focus]:bg-(--color-surface) [&_select:focus]:shadow-[0_0_0_3px_rgb(191_219_254_/_0.55)] [&_select:focus]:outline-none [&_select:disabled]:bg-(--color-surface-muted) [&_select:disabled]:text-(--color-text-subtle)";
export const dialogFieldWideClassName = "dialog-field-wide col-span-full";
export const taskDialogFormClassName = "overview-task-form overview-task-form--dialog grid grid-cols-1 gap-0 p-0";
export const taskDialogActionsClassName =
  "dialog-actions flex justify-end gap-2.5 border-t border-(--color-border) bg-(--color-surface-subtle) px-5 pb-[18px] pt-3.5 max-[767px]:grid [&_.button]:min-h-[38px] [&_.button]:min-w-[104px] [&_.button]:w-auto";

export const overviewGridClassName =
  "overview-grid m-0 grid w-full min-w-0 max-w-full grid-cols-[minmax(0,1.18fr)_minmax(300px,0.82fr)] gap-3 overflow-hidden max-[1199px]:grid-cols-1 max-[1199px]:gap-0";
export const overviewPanelClassName =
  `overview-panel grid min-h-40 min-w-0 max-w-full content-start gap-2.5 overflow-hidden rounded-(--radius-lg) border border-(--color-border) bg-(--color-surface) p-4 shadow-[0_1px_0_rgb(15_23_42_/_0.04)] ${workspaceResponsivePanelResetClassName} [&>span]:text-xs [&>span]:font-bold [&>span]:text-(--color-text-muted) [&>strong]:text-xl [&>strong]:font-extrabold [&>strong]:leading-7 [&>strong]:text-(--color-text)`;
export const overviewPanelWideClassName = "overview-panel--wide col-start-1 max-[1199px]:col-auto";
export const overviewPanelHealthClassName = "overview-panel--health min-h-[132px]";
export const overviewPanelButtonClassName =
  "overview-panel--button w-full cursor-pointer text-left text-inherit transition-[border-color,box-shadow,transform] duration-150 hover:-translate-y-px hover:border-(--color-primary) hover:shadow-[0_4px_8px_rgb(15_23_42_/_0.06)] focus-visible:-translate-y-px focus-visible:border-(--color-primary) focus-visible:shadow-[0_0_0_3px_rgb(15_118_110_/_0.16)] focus-visible:outline-none";
export const overviewTaskPanelClassName =
  "overview-task-panel col-start-2 row-[1/span_2] min-h-0 self-start max-[1199px]:col-auto max-[1199px]:row-auto";
export const overviewPanelTitleClassName =
  workspacePanelHeadingOverviewClassName;
export const overviewHealthGridClassName =
  "overview-health-grid grid grid-cols-3 gap-2 max-[520px]:grid-cols-1 [&_span]:grid [&_span]:min-h-[58px] [&_span]:gap-0.5 [&_span]:rounded-(--radius-sm) [&_span]:border [&_span]:border-(--color-border) [&_span]:bg-(--color-surface-subtle) [&_span]:p-2.5 [&_span]:text-xs [&_span]:font-bold [&_span]:leading-4 [&_span]:text-(--color-text-muted) [&_strong]:text-[22px] [&_strong]:font-extrabold [&_strong]:leading-[26px] [&_strong]:text-(--color-text)";
export const overviewTaskToolbarClassName = "overview-task-toolbar flex flex-wrap items-center justify-between gap-2";
export const overviewTaskFiltersClassName = "overview-task-filters";
export const overviewTaskFilterActiveClassName = "overview-task-filter--active";
export const overviewTaskAddButtonClassName =
  "overview-task-add-button inline-flex min-h-[34px] w-[34px] flex-none items-center justify-center rounded-(--radius-sm) border border-(--color-primary-border) bg-(--color-primary) p-0 text-xl font-extrabold leading-none text-white transition-[background,border-color,box-shadow,transform] duration-200 hover:border-(--color-primary) hover:bg-(--color-primary-strong) hover:shadow-[0_8px_18px_rgb(194_79_22_/_0.18)] active:translate-y-px focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[rgb(191_219_254_/_0.72)]";
export const personalTaskFormClassName =
  "overview-task-form overview-task-form--personal grid grid-cols-[minmax(140px,1fr)_auto] items-end gap-2 [&_button]:min-h-[34px] [&_button]:rounded-(--radius-sm) [&_button]:border [&_button]:border-(--color-primary-border) [&_button]:bg-(--color-primary) [&_button]:px-3 [&_button]:text-xs [&_button]:font-extrabold [&_button]:text-white [&_button:disabled]:border-(--color-border) [&_button:disabled]:bg-(--color-surface-muted) [&_button:disabled]:text-(--color-text-subtle) [&_input]:min-h-[34px] [&_input]:w-full [&_input]:rounded-(--radius-sm) [&_input]:border [&_input]:border-(--color-border) [&_input]:bg-(--color-surface) [&_input]:px-2.5 [&_input]:text-xs [&_input]:font-bold [&_input]:text-(--color-text) [&_label]:grid [&_label]:min-w-0 [&_label]:gap-[5px] [&_label>span]:text-[11px] [&_label>span]:font-extrabold [&_label>span]:leading-[15px] [&_label>span]:text-(--color-text-muted) w-full max-[767px]:grid-cols-1 max-[767px]:[&_button]:w-full";

export const overviewUndoToastClassName =
  "overview-undo-toast fixed bottom-5 right-5 z-[80] inline-flex max-w-[min(420px,calc(100vw-32px))] items-center gap-3 rounded-(--radius-md) border border-(--color-primary) bg-(--color-surface) px-3.5 py-3 text-[13px] font-extrabold text-(--color-text) shadow-[var(--shadow-panel)] [&_button]:min-h-8 [&_button]:cursor-pointer [&_button]:rounded-(--radius-sm) [&_button]:border [&_button]:border-(--color-border-strong) [&_button]:bg-(--color-primary-soft) [&_button]:px-2.5 [&_button]:text-(--color-primary-strong) [&_button]:font-extrabold";
