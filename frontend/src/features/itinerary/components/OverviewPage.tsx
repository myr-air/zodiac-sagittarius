import { type FormEvent, useMemo, useState } from "react";
import type { DailyBriefingOverrides, ExpenseSummary, ItineraryItem, Suggestion, Trip, TripDailyBriefing, TripTask } from "@/src/trip/types";
import { useI18n } from "@/src/i18n/I18nProvider";
import { cn } from "@/src/lib/cn";
import { formatDayLabel, getTripDates, type ItineraryView } from "@/src/trip/itinerary";
import { Icon } from "@/src/ui/icons";
import { formatTripRange, PageUserCard } from "@/src/components/PageHeader";
import { Button, SegmentedControl, Select, TextInput } from "@/src/ui";
import { WeatherBriefingDrawer } from "@/src/components/WeatherBriefingDrawer";
import { WeatherForecastStrip } from "@/src/components/WeatherForecastStrip";
import { CockpitCard, HighlightBoard, OverviewFocusList, OverviewHero, OverviewStopList, TaskAssigneeBadge, TripCompletedPostcard, ViewerNextStopPanel } from "./overview/OverviewSections";
import {
  buildDestinationVisual,
  buildHighlightItems,
  getCountdownBadge,
  isMyTask,
  managerNextStopDetail,
  overviewRoleLens,
  photoBoardEmptyMessage,
  stopLabel,
  taskKindLabel,
  travelerNextStopDetail,
} from "@/src/features/itinerary/domain";

interface OverviewPageProps {
  trip: Trip;
  currentMemberId: string;
  expenseSummary: ExpenseSummary;
  items: ItineraryItem[];
  itineraryView?: ItineraryView;
  suggestions: Suggestion[];
  tasks: TripTask[];
  dailyBriefings?: TripDailyBriefing[];
  onCreateTask: (input: { title: string; visibility: TripTask["visibility"]; assigneeId?: string | null }) => void;
  onOpenExpenses?: () => void;
  onSaveDailyBriefingOverrides?: (date: string, version: number, overrides: DailyBriefingOverrides) => void;
  onToggleTaskStatus: (taskId: string) => void;
}

const overviewPageClassName = "overview-page grid min-h-full min-w-0 max-w-full overflow-hidden gap-3 bg-transparent px-6 py-[22px] pb-7 max-[1199px]:min-h-[calc(100dvh-48px)] max-[1199px]:gap-0 max-[1199px]:bg-(--color-surface) max-[1199px]:px-0 max-[1199px]:py-0 max-[1199px]:pb-0 max-[767px]:overflow-y-auto";
const overviewCockpitClassName = "overview-travel-cockpit mb-3.5 grid w-full min-w-0 max-w-full grid-cols-3 gap-3 overflow-hidden max-[1199px]:mb-0 max-[1199px]:grid-cols-2 max-[1199px]:gap-0 max-[1199px]:[&_.overview-cockpit-card:nth-child(3)]:col-span-full";
const overviewHeroBaseClassName =
  "overview-hero relative mb-3 grid min-h-[168px] min-w-0 max-w-full grid-cols-[minmax(0,1fr)_minmax(236px,280px)] items-center gap-4 overflow-hidden rounded-(--radius-lg) border border-[color-mix(in_srgb,var(--overview-hero-accent)_22%,var(--color-border))] bg-[linear-gradient(135deg,var(--color-surface)_0%,var(--overview-hero-sky)_100%)] p-5 shadow-[0_1px_0_rgb(15_23_42_/_0.04)] [--overview-hero-accent:var(--color-primary)] [--overview-hero-ground:#f7d9b8] [--overview-hero-horizon:#8bd3e6] [--overview-hero-ink:#18191f] [--overview-hero-sky:#eaf6ff] max-[1199px]:mb-0 max-[1199px]:grid-cols-1 max-[1199px]:gap-2 max-[1199px]:rounded-none max-[1199px]:border-x-0 max-[1199px]:border-t-0 max-[1199px]:p-4 max-[1199px]:shadow-none max-[767px]:min-h-0 max-[767px]:p-3";
const overviewHeroToneClassNames = {
  harbor: "[--overview-hero-accent:var(--color-primary)] [--overview-hero-ground:#d6f2ef] [--overview-hero-horizon:#4fb8cc] [--overview-hero-sky:#e8f8ff]",
  city: "[--overview-hero-accent:var(--color-primary)] [--overview-hero-ground:#f6dfb6] [--overview-hero-horizon:#7c91d8] [--overview-hero-sky:#eef1ff]",
  coast: "[--overview-hero-accent:var(--color-route)] [--overview-hero-ground:#fde68a] [--overview-hero-horizon:#38bdf8] [--overview-hero-sky:#e6f8ff]",
  market: "[--overview-hero-accent:var(--color-warning)] [--overview-hero-ground:#fee2b8] [--overview-hero-horizon:#fb7185] [--overview-hero-sky:#fff1df]",
} satisfies Record<string, string>;
const overviewHeroCopyClassName = "overview-hero-copy relative z-[2] grid min-w-0 max-w-[760px] content-center gap-2.5";
const overviewHeroKickerClassName = "overview-hero-kicker w-fit max-w-full overflow-hidden rounded-full border border-[color-mix(in_srgb,var(--overview-hero-accent)_26%,white)] bg-[rgb(255_255_255_/_0.78)] px-2.5 py-1.5 text-xs font-[850] leading-4 text-(--overview-hero-accent) text-ellipsis whitespace-nowrap";
const overviewHeroTitleClassName = "m-0 text-[30px] font-[950] leading-[36px] text-(--overview-hero-ink) max-[767px]:hidden";
const overviewHeroRoleClassName = "overview-hero-role m-0 max-w-[620px] text-[15px] font-bold leading-[23px] text-[color-mix(in_srgb,var(--overview-hero-ink)_78%,var(--color-text-muted))] max-[767px]:text-[13px] max-[767px]:leading-5";
const overviewHeroMetaClassName = "overview-hero-meta mt-1 flex flex-wrap gap-2 max-[767px]:grid max-[767px]:grid-cols-1 [&_.icon]:text-(--overview-hero-accent) [&_span]:inline-flex [&_span]:min-h-8 [&_span]:min-w-0 [&_span]:max-w-full [&_span]:items-center [&_span]:gap-[7px] [&_span]:rounded-(--radius-sm) [&_span]:border [&_span]:border-[color-mix(in_srgb,var(--overview-hero-accent)_18%,white)] [&_span]:bg-[rgb(255_255_255_/_0.74)] [&_span]:px-[9px] [&_span]:py-1.5 [&_span]:text-xs [&_span]:font-extrabold [&_span]:leading-4 [&_span]:text-(--color-text) max-[767px]:[&_span]:overflow-hidden max-[767px]:[&_span]:text-ellipsis max-[767px]:[&_span]:whitespace-nowrap";
const overviewHeroAsideClassName = "overview-hero-aside relative z-[2] grid min-w-0 content-center gap-2.5 self-center rounded-(--radius-md) border border-[color-mix(in_srgb,var(--overview-hero-accent)_18%,white)] bg-[rgb(255_255_255_/_0.72)] p-3 shadow-[inset_0_1px_0_rgb(255_255_255_/_0.78)] max-[1199px]:col-auto max-[1199px]:grid-cols-1 max-[1199px]:items-center max-[1199px]:rounded-none max-[1199px]:border-0 max-[1199px]:bg-transparent max-[1199px]:p-0 max-[1199px]:shadow-none [&_.page-current-user]:min-w-0 [&_.page-current-user]:w-full [&_.page-current-user]:border-transparent [&_.page-current-user]:bg-transparent [&_.page-current-user]:shadow-none";
const overviewHeroSettlementsClassName = "overview-hero-settlements justify-self-stretch rounded-(--radius-sm) border border-[color-mix(in_srgb,var(--overview-hero-accent)_26%,white)] bg-[rgb(255_255_255_/_0.82)] px-2.5 py-1.5 text-center text-xs font-[850] leading-4 text-(--overview-hero-accent)";
const cockpitCardBaseClassName = "overview-cockpit-card relative grid min-h-[126px] min-w-0 content-start gap-2 overflow-hidden rounded-(--radius-lg) border border-[color-mix(in_srgb,var(--overview-cockpit-accent)_16%,var(--color-border))] bg-[linear-gradient(150deg,var(--color-surface)_0%,var(--overview-cockpit-wash)_100%)] p-3.5 text-left text-inherit shadow-[inset_0_1px_0_rgb(255_255_255_/_0.72)] [--overview-cockpit-accent:var(--color-primary)] [--overview-cockpit-wash:var(--color-surface-subtle)] max-[1199px]:rounded-none max-[1199px]:border-x-0 max-[1199px]:border-t-0 max-[1199px]:shadow-none max-[767px]:min-h-[104px] [&_small]:min-w-0 [&_small]:text-xs [&_small]:font-bold [&_small]:leading-[17px] [&_small]:text-(--color-text-muted) [&_strong]:min-w-0 [&_strong]:text-[22px] [&_strong]:font-black [&_strong]:leading-7 [&_strong]:text-(--color-text) [&_strong]:[overflow-wrap:anywhere]";
const cockpitCardButtonClassName = "overview-cockpit-card--button cursor-pointer transition-[border-color,box-shadow,transform] duration-150 hover:-translate-y-px hover:border-(--overview-cockpit-accent) hover:shadow-[0_4px_8px_rgb(15_23_42_/_0.06)] focus-visible:-translate-y-px focus-visible:border-(--overview-cockpit-accent) focus-visible:shadow-[0_0_0_3px_rgb(15_118_110_/_0.16)] focus-visible:outline-none";
const overviewReadinessChipsClassName = "overview-readiness-chips flex min-w-0 flex-wrap gap-1.5 [&_span]:min-w-0 [&_span]:rounded-(--radius-sm) [&_span]:border [&_span]:border-[color-mix(in_srgb,var(--color-primary)_14%,var(--color-border))] [&_span]:bg-[rgb(255_255_255_/_0.68)] [&_span]:px-[7px] [&_span]:py-1 [&_span]:text-[11px] [&_span]:font-extrabold [&_span]:leading-[15px] [&_span]:text-(--color-text-muted)";
const modalBackdropClassName = "modal-backdrop fixed inset-0 z-20 grid place-items-center bg-[rgb(15_23_42_/_0.28)] p-5 max-[767px]:items-end max-[767px]:p-2.5";
const taskDialogClassName = "stop-dialog overview-task-dialog max-h-[calc(100vh-40px)] w-[min(480px,100%)] overflow-auto rounded-(--radius-lg) border border-(--color-border-strong) bg-(--color-surface) shadow-[0_14px_34px_rgb(15_23_42_/_0.16)]";
const taskDialogTitleRowClassName = "dialog-title-row grid min-h-[62px] grid-cols-[minmax(0,1fr)_34px] items-center gap-3 border-b border-(--color-border) bg-[linear-gradient(180deg,var(--color-surface)_0%,var(--color-surface-subtle)_100%)] py-0 pl-5 pr-[18px] [&_button]:grid [&_button]:size-[34px] [&_button]:cursor-pointer [&_button]:place-items-center [&_button]:rounded-(--radius-sm) [&_button]:border [&_button]:border-transparent [&_button]:bg-transparent [&_button]:text-(--color-text-muted) [&_button]:transition-[background,border-color,color] [&_button]:duration-200 [&_button:focus-visible]:border-(--color-border) [&_button:focus-visible]:bg-(--color-surface) [&_button:focus-visible]:text-(--color-text) [&_button:hover]:border-(--color-border) [&_button:hover]:bg-(--color-surface) [&_button:hover]:text-(--color-text) [&_h2]:m-0 [&_h2]:text-lg [&_h2]:font-black [&_h2]:leading-6 [&_h2]:text-(--color-text) [&_.icon]:size-[18px]";
const taskDialogGridClassName = "dialog-grid grid grid-cols-2 gap-3.5 px-5 pb-5 pt-[18px] max-[767px]:grid-cols-1 [&_input]:min-h-11 [&_input]:w-full [&_input]:rounded-[10px] [&_input]:border [&_input]:border-(--color-border) [&_input]:bg-(--color-surface-subtle) [&_input]:px-3 [&_input]:text-sm [&_input]:font-bold [&_input]:text-(--color-text) [&_input]:transition-[background,border-color,box-shadow] [&_input]:duration-200 [&_input:focus]:border-(--color-route-border) [&_input:focus]:bg-(--color-surface) [&_input:focus]:shadow-[0_0_0_3px_rgb(191_219_254_/_0.55)] [&_input:focus]:outline-none [&_label]:grid [&_label]:min-w-0 [&_label]:gap-[7px] [&_label>span]:text-xs [&_label>span]:font-extrabold [&_label>span]:leading-4 [&_label>span]:text-(--color-text) [&_select]:min-h-11 [&_select]:w-full [&_select]:rounded-[10px] [&_select]:border [&_select]:border-(--color-border) [&_select]:bg-(--color-surface-subtle) [&_select]:px-3 [&_select]:text-sm [&_select]:font-bold [&_select]:text-(--color-text) [&_select]:transition-[background,border-color,box-shadow] [&_select]:duration-200 [&_select:focus]:border-(--color-route-border) [&_select:focus]:bg-(--color-surface) [&_select:focus]:shadow-[0_0_0_3px_rgb(191_219_254_/_0.55)] [&_select:focus]:outline-none [&_select:disabled]:bg-(--color-surface-muted) [&_select:disabled]:text-(--color-text-subtle)";
const dialogFieldWideClassName = "dialog-field-wide col-span-full";
const taskDialogFormClassName = "overview-task-form overview-task-form--dialog grid grid-cols-1 gap-0 p-0";
const taskDialogActionsClassName = "dialog-actions flex justify-end gap-2.5 border-t border-(--color-border) bg-(--color-surface-subtle) px-5 pb-[18px] pt-3.5 max-[767px]:grid [&_.button]:min-h-[38px] [&_.button]:min-w-[104px] [&_.button]:w-auto";
const overviewGridClassName = "overview-grid m-0 grid w-full min-w-0 max-w-full grid-cols-[minmax(0,1.18fr)_minmax(300px,0.82fr)] gap-3 overflow-hidden max-[1199px]:grid-cols-1 max-[1199px]:gap-0";
const overviewPanelClassName = "overview-panel grid min-h-40 min-w-0 max-w-full content-start gap-2.5 overflow-hidden rounded-(--radius-lg) border border-(--color-border) bg-(--color-surface) p-4 shadow-[0_1px_0_rgb(15_23_42_/_0.04)] max-[1199px]:rounded-none max-[1199px]:border-x-0 max-[1199px]:border-t-0 max-[1199px]:shadow-none [&>span]:text-xs [&>span]:font-bold [&>span]:text-(--color-text-muted) [&>strong]:text-xl [&>strong]:font-extrabold [&>strong]:leading-7 [&>strong]:text-(--color-text)";
const overviewPanelWideClassName = "overview-panel--wide col-start-1 max-[1199px]:col-auto";
const overviewPanelHealthClassName = "overview-panel--health min-h-[132px]";
const overviewPanelButtonClassName = "overview-panel--button w-full cursor-pointer text-left text-inherit transition-[border-color,box-shadow,transform] duration-150 hover:-translate-y-px hover:border-(--color-primary) hover:shadow-[0_4px_8px_rgb(15_23_42_/_0.06)] focus-visible:-translate-y-px focus-visible:border-(--color-primary) focus-visible:shadow-[0_0_0_3px_rgb(15_118_110_/_0.16)] focus-visible:outline-none";
const overviewTaskPanelClassName = "overview-task-panel col-start-2 row-[1/span_2] min-h-0 self-start max-[1199px]:col-auto max-[1199px]:row-auto";
const overviewPanelTitleClassName = "overview-panel-title inline-flex items-center gap-2 text-(--color-primary-strong) [&_h2]:m-0 [&_h2]:text-[15px] [&_h2]:font-extrabold [&_h2]:leading-[22px] [&_h2]:text-(--color-text)";
const overviewMutedClassName = "overview-muted text-xs font-bold text-(--color-text-muted)";
const overviewNextStopClassName = "overview-next-stop grid gap-[5px] [&_p]:m-0 [&_p]:mt-1 [&_p]:text-[13px] [&_p]:leading-5 [&_p]:text-(--color-text-muted) [&_span]:text-xs [&_span]:font-bold [&_span]:text-(--color-text-muted) [&_strong]:text-xl [&_strong]:font-extrabold [&_strong]:leading-7 [&_strong]:text-(--color-text)";
const overviewHealthGridClassName = "overview-health-grid grid grid-cols-3 gap-2 max-[520px]:grid-cols-1 [&_span]:grid [&_span]:min-h-[58px] [&_span]:gap-0.5 [&_span]:rounded-(--radius-sm) [&_span]:border [&_span]:border-(--color-border) [&_span]:bg-(--color-surface-subtle) [&_span]:p-2.5 [&_span]:text-xs [&_span]:font-bold [&_span]:leading-4 [&_span]:text-(--color-text-muted) [&_strong]:text-[22px] [&_strong]:font-extrabold [&_strong]:leading-[26px] [&_strong]:text-(--color-text)";
const overviewStopListClassName = "overview-stop-list m-0 grid list-none gap-2 p-0 [&_li]:grid [&_li]:gap-[3px] [&_li]:rounded-(--radius-sm) [&_li]:border [&_li]:border-(--color-border) [&_li]:bg-(--color-surface-subtle) [&_li]:px-3 [&_li]:py-2.5 [&_small]:text-xs [&_small]:font-bold [&_small]:leading-4 [&_small]:text-(--color-text-muted) [&_span]:text-xs [&_span]:font-bold [&_span]:leading-4 [&_span]:text-(--color-text-muted) [&_strong]:text-sm [&_strong]:font-extrabold [&_strong]:leading-5 [&_strong]:text-(--color-text)";
const overviewFocusListClassName = "overview-focus-list m-0 mt-2 grid list-none gap-1.5 p-0 [&_li]:flex [&_li]:flex-wrap [&_li]:items-center [&_li]:gap-x-2.5 [&_li]:gap-y-1.5 [&_li]:border-t [&_li]:border-(--color-border) [&_li]:pt-2 [&_span]:text-xs [&_span]:font-bold [&_span]:leading-4 [&_span]:text-(--color-text-muted) [&_strong]:text-[13px] [&_strong]:font-extrabold [&_strong]:leading-[18px] [&_strong]:text-(--color-text)";
const overviewHighlightBoardClassName = "overview-highlight-board mb-4 min-w-0 max-w-full overflow-hidden rounded-(--radius-lg) border border-(--color-border) bg-(--color-surface) p-3 shadow-[0_1px_0_rgb(15_23_42_/_0.04)] max-[1199px]:mb-0 max-[1199px]:rounded-none max-[1199px]:border-x-0 max-[1199px]:border-t-0 max-[1199px]:shadow-none";
const overviewBoardTitleClassName = "overview-board-title mb-2.5 flex items-center gap-[9px] text-(--color-text) [&_.icon]:text-(--color-primary) [&_h2]:m-0 [&_h2]:text-[15px] [&_h2]:font-black [&_h2]:leading-[22px] [&_p]:m-0 [&_p]:text-xs [&_p]:font-bold [&_p]:leading-[17px] [&_p]:text-(--color-text-muted)";
const overviewHighlightListClassName = "overview-highlight-list m-0 grid list-none grid-cols-[repeat(4,minmax(150px,1fr))] gap-2.5 p-0 max-[1199px]:grid-cols-3 max-[767px]:flex max-[767px]:overflow-x-auto max-[767px]:overscroll-x-contain max-[767px]:pb-3.5 max-[767px]:snap-x max-[767px]:snap-mandatory max-[767px]:-mx-3 max-[767px]:px-3 [&::-webkit-scrollbar]:hidden";
const overviewHighlightItemClassName =
  "overview-highlight-item relative grid min-h-[178px] min-w-0 content-end overflow-hidden rounded-(--radius-md) border border-[color-mix(in_srgb,var(--overview-highlight-accent)_18%,white)] bg-[linear-gradient(180deg,transparent_0_34%,rgb(255_255_255_/_0.78)_66%,rgb(255_255_255_/_0.94)),radial-gradient(circle_at_22%_22%,rgb(255_255_255_/_0.86)_0_16px,transparent_17px),linear-gradient(135deg,var(--overview-highlight-wash),color-mix(in_srgb,var(--overview-highlight-accent)_18%,white))] px-3 pb-3 pt-[88px] [--overview-highlight-accent:#0284c7] [--overview-highlight-wash:#e0f2fe] max-[767px]:min-h-[150px] max-[767px]:w-[240px] max-[767px]:shrink-0 max-[767px]:snap-start [&_small]:relative [&_small]:z-[1] [&_small]:min-w-0 [&_small]:overflow-hidden [&_small]:text-ellipsis [&_small]:whitespace-nowrap [&_small]:text-[11px] [&_small]:font-bold [&_small]:leading-[15px] [&_small]:text-(--color-text-muted) [&_span]:relative [&_span]:z-[1] [&_span]:text-[11px] [&_span]:font-[850] [&_span]:leading-[15px] [&_span]:text-(--overview-highlight-accent) [&_strong]:relative [&_strong]:z-[1] [&_strong]:min-w-0 [&_strong]:text-[13px] [&_strong]:font-black [&_strong]:leading-[18px] [&_strong]:text-(--color-text) [&_strong]:[overflow-wrap:anywhere]";
const overviewHighlightToneClassNames = {
  harbor: "[--overview-highlight-accent:var(--color-primary)] [--overview-highlight-wash:var(--color-primary-soft)]",
  city: "[--overview-highlight-accent:var(--color-route)] [--overview-highlight-wash:var(--color-route-soft)]",
  coast: "[--overview-highlight-accent:var(--color-route)] [--overview-highlight-wash:var(--color-route-soft)]",
  market: "[--overview-highlight-accent:var(--color-warning-strong)] [--overview-highlight-wash:var(--color-warning-soft)]",
} satisfies Record<string, string>;
const overviewTaskToolbarClassName = "overview-task-toolbar flex flex-wrap items-center justify-between gap-2";
const overviewTaskFiltersClassName = "overview-task-filters";
const overviewTaskFilterActiveClassName = "overview-task-filter--active";
const overviewTaskAddButtonClassName = "overview-task-add-button inline-flex min-h-[34px] w-[34px] flex-none items-center justify-center rounded-(--radius-sm) border border-(--color-primary-border) bg-(--color-primary) p-0 text-xl font-extrabold leading-none text-white transition-[background,border-color,box-shadow,transform] duration-200 hover:border-(--color-primary) hover:bg-(--color-primary-strong) hover:shadow-[0_8px_18px_rgb(194_79_22_/_0.18)] active:translate-y-px focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[rgb(191_219_254_/_0.72)]";
const personalTaskFormClassName = "overview-task-form overview-task-form--personal grid grid-cols-[minmax(140px,1fr)_auto] items-end gap-2 [&_button]:min-h-[34px] [&_button]:rounded-(--radius-sm) [&_button]:border [&_button]:border-(--color-primary-border) [&_button]:bg-(--color-primary) [&_button]:px-3 [&_button]:text-xs [&_button]:font-extrabold [&_button]:text-white [&_button:disabled]:border-(--color-border) [&_button:disabled]:bg-(--color-surface-muted) [&_button:disabled]:text-(--color-text-subtle) [&_input]:min-h-[34px] [&_input]:w-full [&_input]:rounded-(--radius-sm) [&_input]:border [&_input]:border-(--color-border) [&_input]:bg-(--color-surface) [&_input]:px-2.5 [&_input]:text-xs [&_input]:font-bold [&_input]:text-(--color-text) [&_label]:grid [&_label]:min-w-0 [&_label]:gap-[5px] [&_label>span]:text-[11px] [&_label>span]:font-extrabold [&_label>span]:leading-[15px] [&_label>span]:text-(--color-text-muted) w-full max-[767px]:grid-cols-1 max-[767px]:[&_button]:w-full";
const overviewTaskListClassName = "overview-task-list m-0 grid list-none gap-2 p-0 text-[13px] font-semibold leading-5 text-(--color-text-muted)";
const overviewTaskItemClassName = "overview-task-item grid min-h-10 grid-cols-[minmax(0,1fr)_auto] items-center gap-2.5 rounded-(--radius-sm) border border-(--color-border) bg-(--color-surface-subtle) px-2.5 py-2 max-[767px]:grid-cols-1 [&_input]:size-4 [&_input]:accent-[var(--color-primary)] [&_label]:inline-flex [&_label]:min-w-0 [&_label]:items-center [&_label]:gap-[9px] [&_label>span]:overflow-hidden [&_label>span]:text-ellipsis [&_label>span]:whitespace-nowrap [&_label>span]:text-[13px] [&_label>span]:leading-[18px] [&_small]:whitespace-nowrap [&_small]:text-[11px] [&_small]:font-extrabold [&_small]:text-(--color-text-muted)";
const overviewTaskItemInteractiveClassName = "transition-[border-color,box-shadow,background] duration-150 hover:border-(--color-primary-border) hover:bg-(--color-surface)";
const overviewTaskMetaClassName = "overview-task-meta inline-flex flex-wrap justify-end gap-1.5";
const overviewUndoToastClassName = "overview-undo-toast fixed bottom-5 right-5 z-[80] inline-flex max-w-[min(420px,calc(100vw-32px))] items-center gap-3 rounded-(--radius-md) border border-(--color-primary) bg-(--color-surface) px-3.5 py-3 text-[13px] font-extrabold text-(--color-text) shadow-[var(--shadow-panel)] [&_button]:min-h-8 [&_button]:cursor-pointer [&_button]:rounded-(--radius-sm) [&_button]:border [&_button]:border-(--color-border-strong) [&_button]:bg-(--color-primary-soft) [&_button]:px-2.5 [&_button]:text-(--color-primary-strong) [&_button]:font-extrabold";

export function OverviewPage({
  trip,
  currentMemberId,
  expenseSummary,
  items,
  itineraryView,
  suggestions,
  tasks,
  dailyBriefings = [],
  onCreateTask,
  onOpenExpenses,
  onSaveDailyBriefingOverrides,
  onToggleTaskStatus,
}: OverviewPageProps) {
  const { locale, t } = useI18n();
  const countdown = getCountdownBadge(trip.startDate, trip.endDate, locale);
  const isCompleted = countdown.type === "completed";
  const focusTodayHeading = isCompleted
    ? (locale === "th" ? "ย้อนรอยความทรงจำ" : "Memories of the Journey")
    : (countdown.type === "incoming"
      ? (locale === "th" ? "จุดสตาร์ทแรกของทริป" : "First Stop Preview")
      : t.overview.focusToday);
  const [taskScope, setTaskScope] = useState<"mine" | "trip" | "all">("mine");
  const [taskStatusFilter, setTaskStatusFilter] = useState<"all" | "open" | "done">("all");
  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskVisibility, setNewTaskVisibility] = useState<TripTask["visibility"]>("private");
  const [newTaskAssigneeId, setNewTaskAssigneeId] = useState("");
  const [undoTask, setUndoTask] = useState<TripTask | null>(null);
  const [selectedBriefingDate, setSelectedBriefingDate] = useState<string | null>(null);
  const tripDays = getTripDates(trip.startDate, trip.endDate);
  /* v8 ignore next */
  const sortedItems = itineraryView?.sortedItems ?? items.slice().sort((a, b) => a.day.localeCompare(b.day) || a.sortOrder - b.sortOrder || a.startTime.localeCompare(b.startTime));
  const nextStop = sortedItems[0];
  const warningCount = itineraryView?.warningCount ?? items.reduce((total, item) => total + (item.advisories?.length ?? 0), 0);
  const pendingSuggestions = suggestions.filter((suggestion) => suggestion.status === "pending").length;
  const activeMembers = trip.members.filter((member) => member.id !== "member-viewer" && member.accessStatus !== "disabled").length;
  const groupSpendLabel = `HK$${expenseSummary.groupSpend.toLocaleString("en-HK")}`;
  const settlementCount = expenseSummary.settlementSuggestions.length;
  const heroVisual = buildDestinationVisual(trip.destinationLabel);
  const highlightItems = buildHighlightItems(sortedItems);
  const currentMember = trip.members.find((member) => member.id === currentMemberId);
  /* v8 ignore next */
  const currentMemberCard = currentMember ? <PageUserCard color={currentMember.color} name={currentMember.displayName} label={trip.destinationLabel} /> : null;
  const roleLens = overviewRoleLens(currentMember);
  const isManagerLens = roleLens === "manager";
  const isTravelerLens = roleLens === "traveler";
  const isViewerLens = roleLens === "viewer";
  const assignableMembers = trip.members.filter((member) => member.id !== "member-viewer" && member.accessStatus !== "disabled");
  const myOpenTasks = tasks.filter((task) => task.status === "open" && isMyTask(task, currentMemberId)).length;
  const sharedOpenTasks = tasks.filter((task) => task.status === "open" && task.visibility === "shared").length;
  const nextDayItems = nextStop ? sortedItems.filter((item) => item.day === nextStop.day).slice(0, 4) : [];
  const foodStops = sortedItems.filter((item) => item.activityType === "food").slice(0, 3);
  const tripHighlights = sortedItems.filter((item) => ["attraction", "experience", "shopping"].includes(item.activityType)).slice(0, 4);
  const viewerHighlights = sortedItems.filter((item) => item.activityType !== "travel").slice(0, 5);
  const selectedBriefing = dailyBriefings.find((briefing) => briefing.date === selectedBriefingDate) ?? null;
  const visibleTasks = useMemo(
    () =>
      tasks.filter((task) => {
        if (taskScope === "mine" && !isMyTask(task, currentMemberId)) return false;
        if (taskScope === "trip" && task.visibility !== "shared") return false;
        if (taskStatusFilter === "open") return task.status === "open";
        if (taskStatusFilter === "done") return task.status === "done";
        return true;
      }),
    [currentMemberId, taskScope, taskStatusFilter, tasks],
  );

  function submitTask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const title = newTaskTitle.trim();
    if (!title) return;
    onCreateTask({ title, visibility: newTaskVisibility, assigneeId: newTaskAssigneeId || null });
    setNewTaskTitle("");
    setNewTaskVisibility("private");
    setNewTaskAssigneeId("");
    setTaskScope(newTaskVisibility === "shared" ? "trip" : "mine");
    setTaskStatusFilter("all");
    setIsTaskDialogOpen(false);
  }

  function closeTaskDialog() {
    setIsTaskDialogOpen(false);
    setNewTaskTitle("");
    setNewTaskVisibility("private");
    setNewTaskAssigneeId("");
  }

  function toggleTask(task: TripTask) {
    onToggleTaskStatus(task.id);
    setUndoTask(task);
  }

  function undoTaskToggle() {
    if (!undoTask) return;
    onToggleTaskStatus(undoTask.id);
    setUndoTask(null);
  }

  function openExpenses() {
    onOpenExpenses?.();
  }

  return (
    <section className={overviewPageClassName} aria-label={t.overview.pageLabel}>
      <OverviewHero
        title={trip.name}
        roleTitle={t.overview.roleHeadings[roleLens]}
        destinationLabel={trip.destinationLabel}
        dateRange={formatTripRange(trip.startDate, trip.endDate, locale)}
        activeMembersLabel={t.dates.activeMembers({ count: activeMembers })}
        groupSpendLabel={groupSpendLabel}
        settlementCount={settlementCount}
        visual={heroVisual}
        currentMemberCard={currentMemberCard}
        countdown={countdown}
      />
      <WeatherForecastStrip
        briefings={dailyBriefings}
        locale={locale}
        selectedDate={selectedBriefingDate}
        onSelect={setSelectedBriefingDate}
      />
      <WeatherBriefingDrawer
        briefing={selectedBriefing}
        locale={locale}
        canEdit={isManagerLens}
        isOpen={Boolean(selectedBriefing)}
        onClose={() => setSelectedBriefingDate(null)}
        onSaveOverrides={onSaveDailyBriefingOverrides}
      />

      <section className={overviewCockpitClassName} aria-label="travel cockpit">
        <CockpitCard
          icon="route"
          label={t.overview.cockpit.nextStop}
          value={nextStop?.place ?? trip.destinationLabel}
          detail={nextStop ? `${formatDayLabel(nextStop.day, trip.startDate, locale)} · ${nextStop.startTime}` : t.dates.stopCount({ count: items.length })}
        />
        <CockpitCard
          icon="wallet"
          label={t.overview.cockpit.budget}
          ariaLabel={t.overview.money.openExpenses}
          value={groupSpendLabel}
          detail={t.overview.money.settlementSuggestions({ count: settlementCount })}
          onClick={openExpenses}
        />
        <CockpitCard
          icon="users"
          label={t.overview.cockpit.crewReadiness}
          value={t.dates.memberCount({ count: activeMembers })}
          detail={(
            <span className={overviewReadinessChipsClassName}>
              <span>{t.dates.dayCount({ count: tripDays.length })}</span>
              <span>{t.overview.readiness.alertSummary({ warnings: warningCount, suggestions: pendingSuggestions })}</span>
            </span>
          )}
        />
      </section>

      <HighlightBoard
        items={highlightItems}
        startDate={trip.startDate}
        locale={locale}
        emptyMessage={isManagerLens ? t.overview.empty.highlights : photoBoardEmptyMessage(t.overview.empty.highlights)}
        title={t.overview.highlightBoard.title}
        subtitle={t.overview.highlightBoard.subtitle}
      />

      <div className={overviewGridClassName}>
        {isTravelerLens ? (
          <>
            <section className={cn(overviewPanelClassName, overviewPanelWideClassName)} aria-label={t.overview.sections.todayFocus}>
              <div className={overviewPanelTitleClassName}>
                <Icon name="route" />
                <h2>{focusTodayHeading}</h2>
              </div>
              {isCompleted ? (
                <TripCompletedPostcard trip={trip} items={items} groupSpendLabel={groupSpendLabel} locale={locale} />
              ) : (
                <>
                  {nextStop ? (
                    <div className={overviewNextStopClassName}>
                      <strong>{nextStop.activity}</strong>
                      <span>{formatDayLabel(nextStop.day, trip.startDate, locale)} · {nextStop.startTime} · {nextStop.place}</span>
                      <p>{travelerNextStopDetail(nextStop, t.overview.focusDetails.travelerFallback)}</p>
                    </div>
                  ) : (
                    <p className={overviewMutedClassName}>{t.overview.empty.itinerary}</p>
                  )}
                  <OverviewFocusList items={nextDayItems} startDate={trip.startDate} locale={locale} label={t.overview.sections.todayFocusStops} />
                </>
              )}
            </section>

            <section className={cn(overviewPanelClassName, overviewPanelWideClassName)} aria-label={t.overview.sections.travelerHighlights}>
              <div className={overviewPanelTitleClassName}>
                <Icon name="location" />
                <h2>{t.overview.headings.highlights}</h2>
              </div>
              <OverviewStopList items={[...foodStops, ...tripHighlights].slice(0, 5)} startDate={trip.startDate} locale={locale} emptyMessage={t.overview.empty.highlights} />
            </section>

            <section className={cn(overviewPanelClassName, overviewTaskPanelClassName)} aria-label={t.overview.sections.travelChecklist}>
              <div className={overviewPanelTitleClassName}>
                <Icon name="check" />
                <h2>{t.overview.checklist}</h2>
              </div>
              <div className={overviewTaskToolbarClassName}>
                <SegmentedControl
                  aria-label={t.overview.filters.statusLabel}
                  className={overviewTaskFiltersClassName}
                  selectedItemClassName={overviewTaskFilterActiveClassName}
                  value={taskStatusFilter}
                  options={[
                    { value: "all", label: t.overview.filters.all },
                    { value: "open", label: t.common.status.open },
                    { value: "done", label: t.common.status.done },
                  ]}
                  onChange={setTaskStatusFilter}
                />
              </div>
              <form className={personalTaskFormClassName} onSubmit={submitTask}>
                <label>
                  <span>{t.overview.addPersonalTask}</span>
                  <input value={newTaskTitle} onChange={(event) => setNewTaskTitle(event.target.value)} placeholder={t.overview.personalTaskPlaceholder} />
                </label>
                <button type="submit" disabled={!newTaskTitle.trim()}>{t.overview.addTask}</button>
              </form>
              {visibleTasks.length ? (
                <ul className={overviewTaskListClassName}>
                  {visibleTasks.map((task) => (
                    <li className={cn(overviewTaskItemClassName, overviewTaskItemInteractiveClassName)} key={task.id} aria-label={task.title} data-status={task.status}>
                      <label>
                        <input type="checkbox" checked={task.status === "done"} onChange={() => toggleTask(task)} />
                        <span className={task.status === "done" ? "line-through text-(--color-text-muted) font-normal" : "text-(--color-text) font-bold"}>
                          {task.title}
                        </span>
                      </label>
                      <div className={overviewTaskMetaClassName}>
                        <TaskAssigneeBadge task={task} trip={trip} labels={t.overview.task} />
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className={overviewMutedClassName}>{t.overview.noChecklist}</p>
              )}
            </section>

            <button className={cn(overviewPanelClassName, overviewPanelButtonClassName)} type="button" onClick={openExpenses}>
              <div className={overviewPanelTitleClassName}>
                <Icon name="wallet" />
                <h2 id="overview-traveler-budget-title">{t.overview.expenses}</h2>
              </div>
              <strong>{expenseSummary.currentUserNetLabel}</strong>
              <span>{t.overview.money.settlementSuggestions({ count: expenseSummary.settlementSuggestions.length })}</span>
            </button>

            <button className={cn(overviewPanelClassName, overviewPanelButtonClassName)} type="button" aria-label={t.overview.generalExpense} onClick={openExpenses}>
              <div className={overviewPanelTitleClassName}>
                <Icon name="plus" />
                <h2>{t.overview.generalExpense}</h2>
              </div>
              <strong>{t.overview.money.generalExamples}</strong>
              <span>{t.overview.money.generalDetail}</span>
            </button>
          </>
        ) : null}

        {isViewerLens ? (
          <>
            <section className={cn(overviewPanelClassName, overviewPanelWideClassName)} aria-label={t.overview.sections.viewerSnapshot}>
              <div className={overviewPanelTitleClassName}>
                <Icon name="location" />
                <h2>{t.overview.headings.viewerSnapshot}</h2>
              </div>
              <OverviewStopList items={viewerHighlights} startDate={trip.startDate} locale={locale} emptyMessage={t.overview.empty.highlights} />
            </section>

            <section className={overviewPanelClassName} aria-label={t.overview.sections.nextStop}>
              <div className={overviewPanelTitleClassName}>
                <Icon name="route" />
                <h2>{t.overview.headings.nextStop}</h2>
              </div>
              <ViewerNextStopPanel
                item={nextStop}
                startDate={trip.startDate}
                locale={locale}
                emptyMessage={t.overview.empty.itinerary}
                detailFallback={t.overview.focusDetails.viewerFallback}
              />
            </section>

            <button className={cn(overviewPanelClassName, overviewPanelButtonClassName)} type="button" onClick={openExpenses}>
              <div className={overviewPanelTitleClassName}>
                <Icon name="wallet" />
                <h2 id="overview-viewer-budget-title">{t.overview.headings.overallBudget}</h2>
              </div>
              <strong>HK${expenseSummary.groupSpend.toLocaleString("en-HK")}</strong>
              <span>{t.overview.money.overallSummary}</span>
            </button>

            <button className={cn(overviewPanelClassName, overviewPanelButtonClassName)} type="button" aria-label={t.overview.generalExpense} onClick={openExpenses}>
              <div className={overviewPanelTitleClassName}>
                <Icon name="plus" />
                <h2>{t.overview.generalExpense}</h2>
              </div>
              <strong>{t.overview.money.generalExamples}</strong>
              <span>{t.overview.money.generalDetail}</span>
            </button>
          </>
        ) : null}

        {isManagerLens ? (
          <>
            <section className={cn(overviewPanelClassName, overviewPanelWideClassName)} aria-label={t.overview.sections.todayFocus}>
          <div className={overviewPanelTitleClassName}>
            <Icon name="route" />
            <h2>{focusTodayHeading}</h2>
          </div>
          {isCompleted ? (
            <TripCompletedPostcard trip={trip} items={items} groupSpendLabel={groupSpendLabel} locale={locale} />
          ) : (
            <>
              {nextStop ? (
                <div className={overviewNextStopClassName}>
                  <strong>{nextStop.activity}</strong>
                  <span>{formatDayLabel(nextStop.day, trip.startDate, locale)} · {nextStop.startTime} · {nextStop.place}</span>
                  <p>{managerNextStopDetail(nextStop, t.overview.focusDetails.managerFallback)}</p>
                </div>
              ) : (
                <p className={overviewMutedClassName}>{t.overview.empty.itinerary}</p>
              )}
              <OverviewFocusList items={nextDayItems} startDate={trip.startDate} locale={locale} label={t.overview.sections.todayFocusStops} />
            </>
          )}
            </section>

            <section className={cn(overviewPanelClassName, overviewPanelHealthClassName)} aria-label={t.overview.sections.readiness}>
          <div className={overviewPanelTitleClassName}>
            <Icon name="check" />
            <h2>{t.overview.headings.readiness}</h2>
          </div>
          <div className={overviewHealthGridClassName}>
            <span><strong>{myOpenTasks}</strong> {t.overview.readiness.myChecklist}</span>
            <span><strong>{sharedOpenTasks}</strong> {t.overview.readiness.sharedChecklist}</span>
            <span><strong>{pendingSuggestions}</strong> {t.overview.readiness.pendingSuggestions}</span>
          </div>
            </section>

            <button className={cn(overviewPanelClassName, overviewPanelButtonClassName)} type="button" aria-label={t.overview.generalExpense} onClick={openExpenses}>
          <div className={overviewPanelTitleClassName}>
            <Icon name="plus" />
            <h2>{t.overview.generalExpense}</h2>
          </div>
          <strong>{t.overview.money.generalExamples}</strong>
          <span>{t.overview.money.generalDetail}</span>
            </button>

            <section className={cn(overviewPanelClassName, overviewTaskPanelClassName)} aria-label={t.overview.sections.tripChecklist}>
          <div className={overviewPanelTitleClassName}>
            <Icon name="check" />
            <h2>{t.overview.headings.tripChecklist}</h2>
          </div>
          <div className={overviewTaskToolbarClassName}>
            <SegmentedControl
              aria-label={t.overview.filters.scopeLabel}
              className={overviewTaskFiltersClassName}
              selectedItemClassName={overviewTaskFilterActiveClassName}
              value={taskScope}
              options={[
                { value: "mine", label: t.overview.filters.mine },
                { value: "trip", label: t.overview.filters.trip },
                { value: "all", label: t.overview.filters.all },
              ]}
              onChange={setTaskScope}
            />
            <SegmentedControl
              aria-label={t.overview.filters.statusLabel}
              className={overviewTaskFiltersClassName}
              selectedItemClassName={overviewTaskFilterActiveClassName}
              value={taskStatusFilter}
              options={[
                { value: "all", label: t.overview.filters.allStatuses },
                { value: "open", label: t.overview.filters.open },
                { value: "done", label: t.overview.filters.done },
              ]}
              onChange={setTaskStatusFilter}
            />
            <button className={overviewTaskAddButtonClassName} type="button" aria-label={t.overview.headings.addChecklist} title={t.overview.headings.addChecklist} onClick={() => setIsTaskDialogOpen(true)}>
              <span aria-hidden="true">+</span>
            </button>
          </div>
          {visibleTasks.length ? (
            <ul className={overviewTaskListClassName}>
              {visibleTasks.map((task) => (
                <li className={cn(overviewTaskItemClassName, overviewTaskItemInteractiveClassName)} key={task.id} aria-label={task.title} data-status={task.status}>
                  <label>
                    <input type="checkbox" checked={task.status === "done"} onChange={() => toggleTask(task)} />
                    <span className={task.status === "done" ? "line-through text-(--color-text-muted) font-normal" : "text-(--color-text) font-bold"}>
                      {task.title}
                    </span>
                  </label>
                  <div className={overviewTaskMetaClassName}>
                    <TaskAssigneeBadge task={task} trip={trip} labels={t.overview.task} />
                    <small className="text-[11px] font-extrabold text-(--color-text-muted) border border-(--color-border) bg-(--color-surface-subtle) px-1.5 py-0.5 rounded-sm">{taskKindLabel(task, t.overview.task)}</small>
                    {task.relatedItemId && (
                      <small className="text-[11px] font-extrabold text-(--color-text-muted) border border-(--color-border) bg-(--color-surface-subtle) px-1.5 py-0.5 rounded-sm">
                        {stopLabel(task.relatedItemId, items, t.overview.task.planStop)}
                      </small>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className={overviewMutedClassName}>{t.overview.task.emptyFilter}</p>
          )}
            </section>
          </>
        ) : null}
      </div>
      {isTaskDialogOpen ? (
        <div className={modalBackdropClassName} role="presentation">
          <section className={taskDialogClassName} role="dialog" aria-modal="true" aria-labelledby="task-dialog-title">
            <div className={taskDialogTitleRowClassName}>
              <h2 id="task-dialog-title">{t.overview.headings.addChecklist}</h2>
              <button type="button" aria-label={t.overview.task.closeForm} onClick={closeTaskDialog}>
                <Icon name="x" />
              </button>
            </div>

            <form className={taskDialogFormClassName} onSubmit={submitTask}>
              <div className={taskDialogGridClassName}>
                <label className={dialogFieldWideClassName}>
                  <span>{t.overview.task.titleLabel}</span>
                  <TextInput value={newTaskTitle} onChange={(event) => setNewTaskTitle(event.target.value)} placeholder={t.overview.task.titlePlaceholder} />
                </label>
                <label>
                  <span>{t.overview.task.visibilityLabel}</span>
                  <Select value={newTaskVisibility} onChange={(event) => setNewTaskVisibility(event.target.value as TripTask["visibility"])}>
                    <option value="private">{t.overview.task.private}</option>
                    <option value="shared">{t.overview.task.shared}</option>
                  </Select>
                </label>
                <label>
                  <span>{t.overview.task.assigneeLabel}</span>
                  <Select value={newTaskAssigneeId} disabled={newTaskVisibility === "private"} onChange={(event) => setNewTaskAssigneeId(event.target.value)}>
                    <option value="">{t.overview.task.noAssignee}</option>
                    {assignableMembers.map((member) => (
                      <option key={member.id} value={member.id}>{member.displayName}</option>
                    ))}
                  </Select>
                </label>
              </div>

              <div className={taskDialogActionsClassName}>
                <Button type="button" variant="ghost" onClick={closeTaskDialog}>{t.overview.task.cancel}</Button>
                <Button type="submit" disabled={!newTaskTitle.trim()}>{t.overview.task.submit}</Button>
              </div>
            </form>
          </section>
        </div>
      ) : null}
      {undoTask ? (
        <div className={overviewUndoToastClassName} role="status">
          <span>{t.overview.task.changed({ title: undoTask.title })}</span>
          <button type="button" onClick={undoTaskToggle}>{t.overview.task.undo}</button>
        </div>
      ) : null}
    </section>
  );
}
