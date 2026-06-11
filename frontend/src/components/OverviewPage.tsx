import { type FormEvent, type ReactNode, useMemo, useState } from "react";
import Image from "next/image";
import type { DailyBriefingOverrides, ExpenseSummary, ItineraryItem, Member, Suggestion, Trip, TripDailyBriefing, TripTask } from "@/src/trip/types";
import { useI18n } from "@/src/i18n/I18nProvider";
import type { Locale } from "@/src/i18n/types";
import { cn } from "@/src/lib/cn";
import { formatDayLabel, getTripDates, type ItineraryView } from "@/src/trip/itinerary";
import { Icon } from "./icons";
import { formatTripRange, PageUserCard } from "./PageHeader";
import { Button } from "./ui";
import { WeatherBriefingDrawer } from "./WeatherBriefingDrawer";
import { WeatherForecastStrip } from "./WeatherForecastStrip";

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

const overviewPageClassName = "overview-page grid min-h-full min-w-0 max-w-full overflow-hidden gap-3 bg-transparent px-6 py-[22px] pb-7 max-[767px]:px-3 max-[767px]:py-4 max-[767px]:pb-4";
const overviewCockpitClassName = "overview-travel-cockpit mb-3.5 grid w-full min-w-0 max-w-full grid-cols-3 gap-3 overflow-hidden max-[1199px]:grid-cols-2 max-[767px]:grid-cols-2 max-[767px]:[&_.overview-cockpit-card:nth-child(3)]:col-span-full";
const overviewHeroBaseClassName =
  "overview-hero relative mb-3 grid min-h-[168px] min-w-0 max-w-full grid-cols-[minmax(0,1fr)_minmax(236px,280px)] items-center gap-4 overflow-hidden rounded-(--radius-lg) border border-(--color-border) bg-(--color-surface) p-5 shadow-[0_12px_26px_rgb(55_47_38_/_0.06)] [--overview-hero-accent:var(--color-primary)] [--overview-hero-ground:#f7d9b8] [--overview-hero-horizon:#8bd3e6] [--overview-hero-ink:#18191f] [--overview-hero-sky:#eaf6ff] max-[1199px]:grid-cols-[minmax(0,1fr)_minmax(220px,260px)] max-[767px]:min-h-0 max-[767px]:grid-cols-1 max-[767px]:gap-3 max-[767px]:p-4";
const overviewHeroToneClassNames = {
  harbor: "[--overview-hero-accent:var(--color-primary)] [--overview-hero-ground:#d6f2ef] [--overview-hero-horizon:#4fb8cc] [--overview-hero-sky:#e8f8ff]",
  city: "[--overview-hero-accent:var(--color-primary)] [--overview-hero-ground:#f6dfb6] [--overview-hero-horizon:#7c91d8] [--overview-hero-sky:#eef1ff]",
  coast: "[--overview-hero-accent:var(--color-route)] [--overview-hero-ground:#fde68a] [--overview-hero-horizon:#38bdf8] [--overview-hero-sky:#e6f8ff]",
  market: "[--overview-hero-accent:var(--color-warning)] [--overview-hero-ground:#fee2b8] [--overview-hero-horizon:#fb7185] [--overview-hero-sky:#fff1df]",
} satisfies Record<DestinationTone, string>;
const overviewHeroCopyClassName = "overview-hero-copy relative z-[2] grid min-w-0 max-w-[760px] content-center gap-2.5";
const overviewHeroKickerClassName = "overview-hero-kicker w-fit max-w-full overflow-hidden rounded-full border border-[color-mix(in_srgb,var(--overview-hero-accent)_24%,white)] bg-(--color-surface-subtle) px-2.5 py-1.5 text-xs font-[850] leading-4 text-(--overview-hero-accent) text-ellipsis whitespace-nowrap";
const overviewHeroTitleClassName = "m-0 text-[30px] font-[950] leading-[36px] text-(--overview-hero-ink) max-[767px]:text-[26px] max-[767px]:leading-8";
const overviewHeroRoleClassName = "overview-hero-role m-0 max-w-[620px] text-[15px] font-bold leading-[23px] text-[color-mix(in_srgb,var(--overview-hero-ink)_78%,var(--color-text-muted))] max-[767px]:text-[13px] max-[767px]:leading-5";
const overviewHeroMetaClassName = "overview-hero-meta mt-1 flex flex-wrap gap-2 max-[767px]:grid max-[767px]:grid-cols-1 [&_.icon]:text-(--overview-hero-accent) [&_span]:inline-flex [&_span]:min-h-8 [&_span]:min-w-0 [&_span]:max-w-full [&_span]:items-center [&_span]:gap-[7px] [&_span]:rounded-(--radius-sm) [&_span]:border [&_span]:border-(--color-border) [&_span]:bg-(--color-surface-subtle) [&_span]:px-[9px] [&_span]:py-1.5 [&_span]:text-xs [&_span]:font-extrabold [&_span]:leading-4 [&_span]:text-(--color-text) max-[767px]:[&_span]:overflow-hidden max-[767px]:[&_span]:text-ellipsis max-[767px]:[&_span]:whitespace-nowrap";
const overviewHeroAsideClassName = "overview-hero-aside relative z-[2] grid min-w-0 content-center gap-2.5 self-center rounded-(--radius-md) border border-(--color-border) bg-(--color-surface-subtle) p-3 max-[1199px]:col-auto max-[1199px]:grid-cols-1 max-[1199px]:items-center max-[767px]:grid-cols-1 [&_.page-current-user]:min-w-0 [&_.page-current-user]:w-full [&_.page-current-user]:border-transparent [&_.page-current-user]:bg-transparent [&_.page-current-user]:shadow-none";
const overviewHeroSettlementsClassName = "overview-hero-settlements justify-self-stretch rounded-(--radius-sm) border border-[color-mix(in_srgb,var(--overview-hero-accent)_26%,white)] bg-(--color-surface) px-2.5 py-1.5 text-center text-xs font-[850] leading-4 text-(--overview-hero-accent)";
const cockpitCardBaseClassName = "overview-cockpit-card grid min-h-[126px] min-w-0 content-start gap-2 rounded-(--radius-lg) border border-(--color-border) bg-(--color-surface) p-3.5 text-left text-inherit shadow-[var(--shadow-soft)] max-[767px]:min-h-[104px] [&_small]:min-w-0 [&_small]:text-xs [&_small]:font-bold [&_small]:leading-[17px] [&_small]:text-(--color-text-muted) [&_strong]:min-w-0 [&_strong]:text-[22px] [&_strong]:font-black [&_strong]:leading-7 [&_strong]:text-(--color-text) [&_strong]:[overflow-wrap:anywhere]";
const cockpitCardButtonClassName = "overview-cockpit-card--button cursor-pointer transition-[border-color,box-shadow,transform] duration-150 hover:-translate-y-px hover:border-(--color-primary) hover:shadow-[0_16px_30px_rgb(15_23_42_/_0.08)] focus-visible:-translate-y-px focus-visible:border-(--color-primary) focus-visible:shadow-[0_16px_30px_rgb(15_23_42_/_0.08)] focus-visible:outline-none";
const overviewReadinessChipsClassName = "overview-readiness-chips flex min-w-0 flex-wrap gap-1.5 [&_span]:min-w-0 [&_span]:rounded-(--radius-sm) [&_span]:border [&_span]:border-[color-mix(in_srgb,var(--color-primary)_14%,var(--color-border))] [&_span]:bg-[rgb(255_255_255_/_0.68)] [&_span]:px-[7px] [&_span]:py-1 [&_span]:text-[11px] [&_span]:font-extrabold [&_span]:leading-[15px] [&_span]:text-(--color-text-muted)";
const modalBackdropClassName = "modal-backdrop fixed inset-0 z-20 grid place-items-center bg-[rgb(15_23_42_/_0.28)] p-5 max-[767px]:items-end max-[767px]:p-2.5";
const taskDialogClassName = "stop-dialog overview-task-dialog max-h-[calc(100vh-40px)] w-[min(480px,100%)] overflow-auto rounded-(--radius-lg) border border-(--color-border-strong) bg-(--color-surface) shadow-[0_30px_90px_rgb(15_23_42_/_0.24)]";
const taskDialogTitleRowClassName = "dialog-title-row grid min-h-[62px] grid-cols-[minmax(0,1fr)_34px] items-center gap-3 border-b border-(--color-border) bg-[linear-gradient(180deg,var(--color-surface)_0%,var(--color-surface-subtle)_100%)] py-0 pl-5 pr-[18px] [&_button]:grid [&_button]:size-[34px] [&_button]:cursor-pointer [&_button]:place-items-center [&_button]:rounded-(--radius-sm) [&_button]:border [&_button]:border-transparent [&_button]:bg-transparent [&_button]:text-(--color-text-muted) [&_button]:transition-[background,border-color,color] [&_button]:duration-200 [&_button:focus-visible]:border-(--color-border) [&_button:focus-visible]:bg-(--color-surface) [&_button:focus-visible]:text-(--color-text) [&_button:hover]:border-(--color-border) [&_button:hover]:bg-(--color-surface) [&_button:hover]:text-(--color-text) [&_h2]:m-0 [&_h2]:text-lg [&_h2]:font-black [&_h2]:leading-6 [&_h2]:text-[#0f172a] [&_.icon]:size-[18px]";
const taskDialogGridClassName = "dialog-grid grid grid-cols-2 gap-3.5 px-5 pb-5 pt-[18px] max-[767px]:grid-cols-1 [&_input]:min-h-11 [&_input]:w-full [&_input]:rounded-[10px] [&_input]:border [&_input]:border-(--color-border) [&_input]:bg-(--color-surface-subtle) [&_input]:px-3 [&_input]:text-sm [&_input]:font-bold [&_input]:text-(--color-text) [&_input]:transition-[background,border-color,box-shadow] [&_input]:duration-200 [&_input:focus]:border-(--color-primary-border) [&_input:focus]:bg-(--color-surface) [&_input:focus]:shadow-[0_0_0_3px_rgb(37_99_235_/_0.12)] [&_input:focus]:outline-none [&_label]:grid [&_label]:min-w-0 [&_label]:gap-[7px] [&_label>span]:text-xs [&_label>span]:font-extrabold [&_label>span]:leading-4 [&_label>span]:text-(--color-text) [&_select]:min-h-11 [&_select]:w-full [&_select]:rounded-[10px] [&_select]:border [&_select]:border-(--color-border) [&_select]:bg-(--color-surface-subtle) [&_select]:px-3 [&_select]:text-sm [&_select]:font-bold [&_select]:text-(--color-text) [&_select]:transition-[background,border-color,box-shadow] [&_select]:duration-200 [&_select:focus]:border-(--color-primary-border) [&_select:focus]:bg-(--color-surface) [&_select:focus]:shadow-[0_0_0_3px_rgb(37_99_235_/_0.12)] [&_select:focus]:outline-none [&_select:disabled]:bg-(--color-surface-muted) [&_select:disabled]:text-(--color-text-subtle)";
const dialogFieldWideClassName = "dialog-field-wide col-span-full";
const taskDialogFormClassName = "overview-task-form overview-task-form--dialog grid grid-cols-1 gap-0 p-0";
const taskDialogActionsClassName = "dialog-actions flex justify-end gap-2.5 border-t border-(--color-border) bg-(--color-surface-subtle) px-5 pb-[18px] pt-3.5 max-[767px]:grid [&_.button]:min-h-[38px] [&_.button]:min-w-[104px] [&_.button]:w-auto";
const overviewGridClassName = "overview-grid m-0 grid w-full min-w-0 max-w-full grid-cols-[minmax(0,1.18fr)_minmax(300px,0.82fr)] gap-3 overflow-hidden max-[1199px]:grid-cols-1";
const overviewPanelClassName = "overview-panel grid min-h-40 min-w-0 max-w-full content-start gap-2.5 overflow-hidden rounded-(--radius-lg) border border-(--color-border) bg-(--color-surface) p-4 shadow-[var(--shadow-soft)] [&>span]:text-xs [&>span]:font-bold [&>span]:text-(--color-text-muted) [&>strong]:text-xl [&>strong]:font-extrabold [&>strong]:leading-7 [&>strong]:text-(--color-text)";
const overviewPanelWideClassName = "overview-panel--wide col-start-1 max-[1199px]:col-auto";
const overviewPanelHealthClassName = "overview-panel--health min-h-[132px]";
const overviewPanelButtonClassName = "overview-panel--button w-full cursor-pointer text-left text-inherit transition-[border-color,box-shadow,transform] duration-150 hover:-translate-y-px hover:border-(--color-primary) hover:shadow-[var(--shadow-soft)] focus-visible:-translate-y-px focus-visible:border-(--color-primary) focus-visible:shadow-[var(--shadow-soft)] focus-visible:outline-none";
const overviewTaskPanelClassName = "overview-task-panel col-start-2 row-[1/span_2] min-h-0 self-start max-[1199px]:col-auto max-[1199px]:row-auto";
const overviewPanelTitleClassName = "overview-panel-title inline-flex items-center gap-2 text-(--color-primary-strong) [&_h2]:m-0 [&_h2]:text-[15px] [&_h2]:font-extrabold [&_h2]:leading-[22px] [&_h2]:text-(--color-text)";
const overviewMutedClassName = "overview-muted text-xs font-bold text-(--color-text-muted)";
const overviewNextStopClassName = "overview-next-stop grid gap-[5px] [&_p]:m-0 [&_p]:mt-1 [&_p]:text-[13px] [&_p]:leading-5 [&_p]:text-(--color-text-muted) [&_span]:text-xs [&_span]:font-bold [&_span]:text-(--color-text-muted) [&_strong]:text-xl [&_strong]:font-extrabold [&_strong]:leading-7 [&_strong]:text-(--color-text)";
const overviewHealthGridClassName = "overview-health-grid grid grid-cols-3 gap-2 max-[520px]:grid-cols-1 [&_span]:grid [&_span]:min-h-[58px] [&_span]:gap-0.5 [&_span]:rounded-(--radius-sm) [&_span]:border [&_span]:border-(--color-border) [&_span]:bg-(--color-surface-subtle) [&_span]:p-2.5 [&_span]:text-xs [&_span]:font-bold [&_span]:leading-4 [&_span]:text-(--color-text-muted) [&_strong]:text-[22px] [&_strong]:font-extrabold [&_strong]:leading-[26px] [&_strong]:text-(--color-text)";
const overviewStopListClassName = "overview-stop-list m-0 grid list-none gap-2 p-0 [&_li]:grid [&_li]:gap-[3px] [&_li]:rounded-(--radius-sm) [&_li]:border [&_li]:border-(--color-border) [&_li]:bg-(--color-surface-subtle) [&_li]:px-3 [&_li]:py-2.5 [&_small]:text-xs [&_small]:font-bold [&_small]:leading-4 [&_small]:text-(--color-text-muted) [&_span]:text-xs [&_span]:font-bold [&_span]:leading-4 [&_span]:text-(--color-text-muted) [&_strong]:text-sm [&_strong]:font-extrabold [&_strong]:leading-5 [&_strong]:text-(--color-text)";
const overviewFocusListClassName = "overview-focus-list m-0 mt-2 grid list-none gap-1.5 p-0 [&_li]:flex [&_li]:flex-wrap [&_li]:items-center [&_li]:gap-x-2.5 [&_li]:gap-y-1.5 [&_li]:border-t [&_li]:border-(--color-border) [&_li]:pt-2 [&_span]:text-xs [&_span]:font-bold [&_span]:leading-4 [&_span]:text-(--color-text-muted) [&_strong]:text-[13px] [&_strong]:font-extrabold [&_strong]:leading-[18px] [&_strong]:text-(--color-text)";
const overviewHighlightBoardClassName = "overview-highlight-board mb-4 min-w-0 max-w-full overflow-hidden rounded-(--radius-lg) border border-(--color-border) bg-(--color-surface) p-3 shadow-[var(--shadow-soft)]";
const overviewBoardTitleClassName = "overview-board-title mb-2.5 flex items-center gap-[9px] text-(--color-text) [&_.icon]:text-(--color-primary) [&_h2]:m-0 [&_h2]:text-[15px] [&_h2]:font-black [&_h2]:leading-[22px] [&_p]:m-0 [&_p]:text-xs [&_p]:font-bold [&_p]:leading-[17px] [&_p]:text-(--color-text-muted)";
const overviewHighlightListClassName = "overview-highlight-list m-0 grid list-none grid-cols-[repeat(4,minmax(150px,1fr))] gap-2.5 p-0 max-[1199px]:grid-cols-3 max-[767px]:flex max-[767px]:overflow-x-auto max-[767px]:overscroll-x-contain max-[767px]:pb-3.5 max-[767px]:snap-x max-[767px]:snap-mandatory max-[767px]:-mx-3 max-[767px]:px-3 [&::-webkit-scrollbar]:hidden";
const overviewHighlightItemClassName =
  "overview-highlight-item relative grid min-h-[178px] min-w-0 content-end overflow-hidden rounded-(--radius-md) border border-[color-mix(in_srgb,var(--overview-highlight-accent)_18%,white)] bg-[linear-gradient(180deg,transparent_0_34%,rgb(255_255_255_/_0.78)_66%,rgb(255_255_255_/_0.94)),radial-gradient(circle_at_22%_22%,rgb(255_255_255_/_0.86)_0_16px,transparent_17px),linear-gradient(135deg,var(--overview-highlight-wash),color-mix(in_srgb,var(--overview-highlight-accent)_18%,white))] px-3 pb-3 pt-[88px] [--overview-highlight-accent:#0284c7] [--overview-highlight-wash:#e0f2fe] max-[767px]:min-h-[150px] max-[767px]:w-[240px] max-[767px]:shrink-0 max-[767px]:snap-start [&_small]:relative [&_small]:z-[1] [&_small]:min-w-0 [&_small]:overflow-hidden [&_small]:text-ellipsis [&_small]:whitespace-nowrap [&_small]:text-[11px] [&_small]:font-bold [&_small]:leading-[15px] [&_small]:text-(--color-text-muted) [&_span]:relative [&_span]:z-[1] [&_span]:text-[11px] [&_span]:font-[850] [&_span]:leading-[15px] [&_span]:text-(--overview-highlight-accent) [&_strong]:relative [&_strong]:z-[1] [&_strong]:min-w-0 [&_strong]:overflow-hidden [&_strong]:text-ellipsis [&_strong]:whitespace-nowrap [&_strong]:text-[13px] [&_strong]:font-black [&_strong]:leading-[18px] [&_strong]:text-(--color-text)";
const overviewHighlightToneClassNames = {
  harbor: "[--overview-highlight-accent:#0f766e] [--overview-highlight-wash:#ccfbf1]",
  city: "[--overview-highlight-accent:#4f46e5] [--overview-highlight-wash:#e0e7ff]",
  coast: "[--overview-highlight-accent:#0284c7] [--overview-highlight-wash:#cffafe]",
  market: "[--overview-highlight-accent:#c2410c] [--overview-highlight-wash:#ffedd5]",
} satisfies Record<DestinationTone, string>;
const overviewTaskToolbarClassName = "overview-task-toolbar flex flex-wrap items-center justify-between gap-2";
const overviewTaskFiltersClassName = "overview-task-filters inline-flex w-fit max-w-full rounded-(--radius-sm) border border-(--color-border) bg-(--color-surface-muted) p-0.5";
const overviewTaskFilterClassName = "overview-task-filter min-h-8 rounded-[calc(var(--radius-sm)-2px)] border-0 bg-transparent px-2.5 text-xs font-extrabold text-(--color-text-muted)";
const overviewTaskFilterActiveClassName = "overview-task-filter--active bg-(--color-surface) text-(--color-primary-strong) shadow-[0_1px_4px_rgb(15_23_42_/_0.06)]";
const overviewTaskAddButtonClassName = "overview-task-add-button inline-flex min-h-[34px] w-[34px] flex-none items-center justify-center rounded-(--radius-sm) border border-(--color-primary-border) bg-(--color-primary) p-0 text-xl font-extrabold leading-none text-white transition-[background,border-color,box-shadow,transform] duration-200 hover:border-(--color-primary) hover:bg-(--color-primary-strong) hover:shadow-[0_8px_18px_rgb(37_99_235_/_0.18)] active:translate-y-px focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[rgb(37_99_235_/_0.22)]";
const personalTaskFormClassName = "overview-task-form overview-task-form--personal grid grid-cols-[minmax(140px,1fr)_auto] items-end gap-2 [&_button]:min-h-[34px] [&_button]:rounded-(--radius-sm) [&_button]:border [&_button]:border-(--color-primary-border) [&_button]:bg-(--color-primary) [&_button]:px-3 [&_button]:text-xs [&_button]:font-extrabold [&_button]:text-white [&_button:disabled]:border-(--color-border) [&_button:disabled]:bg-(--color-surface-muted) [&_button:disabled]:text-(--color-text-subtle) [&_input]:min-h-[34px] [&_input]:w-full [&_input]:rounded-(--radius-sm) [&_input]:border [&_input]:border-(--color-border) [&_input]:bg-(--color-surface) [&_input]:px-2.5 [&_input]:text-xs [&_input]:font-bold [&_input]:text-(--color-text) [&_label]:grid [&_label]:min-w-0 [&_label]:gap-[5px] [&_label>span]:text-[11px] [&_label>span]:font-extrabold [&_label>span]:leading-[15px] [&_label>span]:text-(--color-text-muted) w-full max-[767px]:grid-cols-1 max-[767px]:[&_button]:w-full";
const overviewTaskListClassName = "overview-task-list m-0 grid list-none gap-2 p-0 text-[13px] font-semibold leading-5 text-(--color-text-muted)";
const overviewTaskItemClassName = "overview-task-item grid min-h-10 grid-cols-[minmax(0,1fr)_auto] items-center gap-2.5 rounded-(--radius-sm) border border-(--color-border) bg-(--color-surface-subtle) px-2.5 py-2 max-[767px]:grid-cols-1 [&_input]:size-4 [&_input]:accent-[var(--color-primary)] [&_label]:inline-flex [&_label]:min-w-0 [&_label]:items-center [&_label]:gap-[9px] [&_label>span]:overflow-hidden [&_label>span]:text-ellipsis [&_label>span]:whitespace-nowrap [&_label>span]:text-[13px] [&_label>span]:leading-[18px] [&_small]:whitespace-nowrap [&_small]:text-[11px] [&_small]:font-extrabold [&_small]:text-(--color-text-muted)";
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
                <div className={overviewTaskFiltersClassName} role="group" aria-label={t.overview.filters.statusLabel}>
                  <button className={cn(overviewTaskFilterClassName, taskStatusFilter === "all" && overviewTaskFilterActiveClassName)} type="button" onClick={() => setTaskStatusFilter("all")}>{t.overview.filters.all}</button>
                  <button className={cn(overviewTaskFilterClassName, taskStatusFilter === "open" && overviewTaskFilterActiveClassName)} type="button" onClick={() => setTaskStatusFilter("open")}>{t.common.status.open}</button>
                  <button className={cn(overviewTaskFilterClassName, taskStatusFilter === "done" && overviewTaskFilterActiveClassName)} type="button" onClick={() => setTaskStatusFilter("done")}>{t.common.status.done}</button>
                </div>
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
                    <li className={cn(overviewTaskItemClassName, "hover:border-teal-600/30 hover:shadow-xs transition-all duration-200")} key={task.id} aria-label={task.title} data-status={task.status}>
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
              {viewerNextStopPanel(nextStop, trip.startDate, locale, t.overview.empty.itinerary, t.overview.focusDetails.viewerFallback)}
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
            <div className={overviewTaskFiltersClassName} role="group" aria-label={t.overview.filters.scopeLabel}>
              <button className={cn(overviewTaskFilterClassName, taskScope === "mine" && overviewTaskFilterActiveClassName)} type="button" onClick={() => setTaskScope("mine")}>{t.overview.filters.mine}</button>
              <button className={cn(overviewTaskFilterClassName, taskScope === "trip" && overviewTaskFilterActiveClassName)} type="button" onClick={() => setTaskScope("trip")}>{t.overview.filters.trip}</button>
              <button className={cn(overviewTaskFilterClassName, taskScope === "all" && overviewTaskFilterActiveClassName)} type="button" onClick={() => setTaskScope("all")}>{t.overview.filters.all}</button>
            </div>
            <div className={overviewTaskFiltersClassName} role="group" aria-label={t.overview.filters.statusLabel}>
              <button className={cn(overviewTaskFilterClassName, taskStatusFilter === "all" && overviewTaskFilterActiveClassName)} type="button" onClick={() => setTaskStatusFilter("all")}>{t.overview.filters.allStatuses}</button>
              <button className={cn(overviewTaskFilterClassName, taskStatusFilter === "open" && overviewTaskFilterActiveClassName)} type="button" onClick={() => setTaskStatusFilter("open")}>{t.overview.filters.open}</button>
              <button className={cn(overviewTaskFilterClassName, taskStatusFilter === "done" && overviewTaskFilterActiveClassName)} type="button" onClick={() => setTaskStatusFilter("done")}>{t.overview.filters.done}</button>
            </div>
            <button className={overviewTaskAddButtonClassName} type="button" aria-label={t.overview.headings.addChecklist} title={t.overview.headings.addChecklist} onClick={() => setIsTaskDialogOpen(true)}>
              <span aria-hidden="true">+</span>
            </button>
          </div>
          {visibleTasks.length ? (
            <ul className={overviewTaskListClassName}>
              {visibleTasks.map((task) => (
                <li className={cn(overviewTaskItemClassName, "hover:border-teal-600/30 hover:shadow-xs transition-all duration-200")} key={task.id} aria-label={task.title} data-status={task.status}>
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
                  <input value={newTaskTitle} onChange={(event) => setNewTaskTitle(event.target.value)} placeholder={t.overview.task.titlePlaceholder} />
                </label>
                <label>
                  <span>{t.overview.task.visibilityLabel}</span>
                  <select value={newTaskVisibility} onChange={(event) => setNewTaskVisibility(event.target.value as TripTask["visibility"])}>
                    <option value="private">{t.overview.task.private}</option>
                    <option value="shared">{t.overview.task.shared}</option>
                  </select>
                </label>
                <label>
                  <span>{t.overview.task.assigneeLabel}</span>
                  <select value={newTaskAssigneeId} disabled={newTaskVisibility === "private"} onChange={(event) => setNewTaskAssigneeId(event.target.value)}>
                    <option value="">{t.overview.task.noAssignee}</option>
                    {assignableMembers.map((member) => (
                      <option key={member.id} value={member.id}>{member.displayName}</option>
                    ))}
                  </select>
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

type OverviewRoleLens = "manager" | "traveler" | "viewer";

function overviewRoleLens(member?: Member): OverviewRoleLens {
  if (member?.role === "owner" || member?.role === "organizer") return "manager";
  if (member?.role === "traveler") return "traveler";
  return "viewer";
}

function OverviewStopList({ items, startDate, locale, emptyMessage }: { items: ItineraryItem[]; startDate: string; locale: Locale; emptyMessage: string }) {
  if (!items.length) return <p className={overviewMutedClassName}>{emptyMessage}</p>;

  return (
    <ul className={overviewStopListClassName}>
      {items.map((item) => (
        <li key={item.id}>
          <span>{formatDayLabel(item.day, startDate, locale)} · {item.startTime}</span>
          <strong>{item.activity}</strong>
          <small>{item.place}</small>
        </li>
      ))}
    </ul>
  );
}

function OverviewFocusList({ items, startDate, locale, label }: { items: ItineraryItem[]; startDate: string; locale: Locale; label: string }) {
  if (items.length <= 1) return null;

  return (
    <ul className={overviewFocusListClassName} aria-label={label}>
      {items.slice(1).map((item) => (
        <li key={item.id}>
          <span>{formatDayLabel(item.day, startDate, locale)} · {item.startTime}</span>
          <strong>{item.activity}</strong>
        </li>
      ))}
    </ul>
  );
}

function stopLabel(itemId: string, items: ItineraryItem[], fallback: string): string {
  /* v8 ignore next */
  return items.find((item) => item.id === itemId)?.activity ?? fallback;
}

function travelerNextStopDetail(item: ItineraryItem, fallback: string): string {
  /* v8 ignore next */
  return item.transportation || item.note || fallback;
}

function viewerNextStopDetail(item: ItineraryItem, fallback: string): string {
  /* v8 ignore next */
  return item.transportation || fallback;
}

function viewerNextStopPanel(item: ItineraryItem | undefined, startDate: string, locale: Locale, emptyMessage: string, detailFallback: string) {
  /* v8 ignore next */
  return item ? (
    <div className={overviewNextStopClassName}>
      <strong>{item.activity}</strong>
      <span>{formatDayLabel(item.day, startDate, locale)} · {item.startTime} · {item.place}</span>
      <p>{viewerNextStopDetail(item, detailFallback)}</p>
    </div>
  ) : (
    <p className={overviewMutedClassName}>{emptyMessage}</p>
  );
}

function managerNextStopDetail(item: ItineraryItem, fallback: string): string {
  /* v8 ignore next */
  return item.transportation || fallback;
}

function taskKindLabel(task: TripTask, labels: { booking: string; prep: string }): string {
  if (task.kind === "booking" || task.relatedItemId || task.title.includes("จอง")) return labels.booking;
  return labels.prep;
}

function isMyTask(task: TripTask, currentMemberId: string): boolean {
  return task.createdBy === currentMemberId || task.assigneeId === currentMemberId;
}

type DestinationTone = "harbor" | "city" | "coast" | "market";

interface DestinationVisual {
  tone: DestinationTone;
  label: string;
  imageUrl?: string;
  polaroids: Array<{ imageUrl: string; caption: string }>;
}

function buildDestinationVisual(destinationLabel: string): DestinationVisual {
  const label = destinationLabel.trim() || "Trip destination";
  const normalized = label.toLocaleLowerCase("en-US");
  if (/(hong kong|harbour|harbor|shenzhen|bay)/i.test(normalized)) {
    return {
      tone: "harbor",
      label,
      imageUrl: "/landing/auth/photo-hong-kong-skyline.png",
      polaroids: [
        { imageUrl: "/landing/auth/photo-mong-kok-market.png", caption: "Market" },
        { imageUrl: "/landing/auth/photo-hong-kong-skyline.png", caption: "Harbour" },
        { imageUrl: "/landing/auth/photo-dim-sum-brunch.png", caption: "Dim sum" },
      ],
    };
  }
  if (/(beach|coast|island|phuket|okinawa|bali)/i.test(normalized)) {
    return {
      tone: "coast",
      label,
      imageUrl: "/landing/auth/photo-krabi.png",
      polaroids: [
        { imageUrl: "/landing/auth/photo-krabi.png", caption: "Coast" },
        { imageUrl: "/landing/auth/photo-santorini.png", caption: "Sunset" },
        { imageUrl: "/landing/auth/photo-cappadocia.png", caption: "Route" },
      ],
    };
  }
  if (/(market|bazaar|night|taipei|bangkok)/i.test(normalized)) {
    return {
      tone: "market",
      label,
      imageUrl: "/landing/auth/photo-santorini.png",
      polaroids: [
        { imageUrl: "/landing/auth/photo-mong-kok-market.png", caption: "Market" },
        { imageUrl: "/landing/auth/photo-dim-sum-brunch.png", caption: "Food" },
        { imageUrl: "/landing/auth/photo-santorini.png", caption: "Night" },
      ],
    };
  }
  return {
    tone: "city",
    label,
    imageUrl: "/landing/auth/photo-kyoto.png",
    polaroids: [
      { imageUrl: "/landing/auth/photo-kyoto.png", caption: "City" },
      { imageUrl: "/landing/auth/photo-cappadocia.png", caption: "Route" },
      { imageUrl: "/landing/auth/photo-krabi.png", caption: "Pause" },
    ],
  };
}

function getHighlightImage(item: ItineraryItem): string | undefined {
  const activity = item.activity.toLowerCase();

  // Hong Kong specific matches first
  if (
    activity.includes("dim dim sum") ||
    activity.includes("ติ่มซำ") ||
    activity.includes("food") ||
    activity.includes("กิน") ||
    activity.includes("อาหาร") ||
    activity.includes("brunch") ||
    activity.includes("lunch") ||
    activity.includes("dinner")
  ) {
    return "/landing/auth/photo-dim-sum-brunch.png";
  }
  if (
    activity.includes("mong kok") ||
    activity.includes("ladies market") ||
    activity.includes("ช้อป") ||
    activity.includes("เดินเล่น") ||
    activity.includes("market") ||
    activity.includes("shopping") ||
    activity.includes("ซื้อ")
  ) {
    return "/landing/auth/photo-mong-kok-market.png";
  }
  if (
    activity.includes("peak tram") ||
    activity.includes("victoria peak") ||
    activity.includes("skyline") ||
    activity.includes("view") ||
    activity.includes("วิวมุมสูง") ||
    activity.includes("ชมวิว") ||
    activity.includes("sky terrace")
  ) {
    return "/landing/auth/photo-hong-kong-skyline.png";
  }

  // Fallbacks based on category/tone
  if (item.activityType === "food") {
    return "/landing/auth/photo-dim-sum-brunch.png";
  }
  if (item.activityType === "shopping") {
    return "/landing/auth/photo-mong-kok-market.png";
  }
  if (item.activityType === "attraction") {
    return "/landing/auth/photo-hong-kong-skyline.png";
  }

  // Generic fallbacks based on item.id hash to keep it stable
  const images = [
    "/landing/auth/photo-kyoto.png",
    "/landing/auth/photo-krabi.png",
    "/landing/auth/photo-santorini.png",
    "/landing/auth/photo-cappadocia.png",
  ];
  const hash = item.id.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return images[hash % images.length];
}

function buildHighlightItems(items: ItineraryItem[]): ItineraryItem[] {
  const preferredItems = items.filter((item) => ["food", "attraction", "experience", "shopping"].includes(item.activityType));
  return (preferredItems.length ? preferredItems : items.filter((item) => item.activityType !== "travel")).slice(0, 4);
}

function photoBoardEmptyMessage(message: string): string {
  if (message === "ยังไม่มีไฮไลต์ในแผนนี้") return "ยังไม่มีภาพไฮไลต์ในแผนนี้";
  if (message === "No highlights in this plan yet.") return "No photo highlights in this plan yet.";
  return message;
}

function highlightTone(item: ItineraryItem, index: number): DestinationTone {
  if (item.activityType === "food" || item.activityType === "shopping") return "market";
  if (item.activityType === "attraction" || item.activityType === "experience") return index % 2 === 0 ? "harbor" : "city";
  return index % 3 === 0 ? "coast" : "city";
}

function getCountdownBadge(startDateStr: string, endDateStr: string, locale: Locale): { text: string; type: "incoming" | "active" | "completed" } {
  const now = new Date();
  const start = new Date(`${startDateStr}T00:00:00.000Z`);
  const end = new Date(`${endDateStr}T00:00:00.000Z`);
  
  const today = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
  const todayMs = today.getTime();

  const startMs = start.getTime();
  const endMs = end.getTime();

  if (todayMs < startMs) {
    const diffDays = Math.ceil((startMs - todayMs) / (1000 * 60 * 60 * 24));
    return {
      text: locale === "th" ? `จะเริ่มในอีก ${diffDays} วัน` : `Starts in ${diffDays} days`,
      type: "incoming"
    };
  } else if (todayMs >= startMs && todayMs <= endMs) {
    const diffDays = Math.floor((todayMs - startMs) / (1000 * 60 * 60 * 24)) + 1;
    const totalDays = Math.floor((endMs - startMs) / (1000 * 60 * 60 * 24)) + 1;
    return {
      text: locale === "th" ? `วันที่ ${diffDays} จาก ${totalDays}` : `Day ${diffDays} of ${totalDays}`,
      type: "active"
    };
  } else {
    return {
      text: locale === "th" ? "ทริปเสร็จสิ้นแล้ว" : "Trip Completed",
      type: "completed"
    };
  }
}

function TripCompletedPostcard({ trip, items, groupSpendLabel, locale }: { trip: Trip; items: ItineraryItem[]; groupSpendLabel: string; locale: Locale }) {
  const dayCount = getTripDates(trip.startDate, trip.endDate).length;
  const stopCount = items.length;

  return (
    <div className="relative overflow-hidden rounded-xl border border-amber-200/60 bg-(--color-paper-warm) p-5 shadow-[0_8px_24px_rgba(245_158_11_/_0.04)] bg-[image:var(--paper-grain)] bg-[length:120px_120px]">
      {/* Decorative Stamp */}
      <div className="absolute top-4 right-4 w-12 h-14 border-2 border-dashed border-amber-300/40 rounded-xs flex flex-col items-center justify-center rotate-[6deg] select-none opacity-60">
        <Icon name="location" className="size-5 text-amber-500/50" />
        <span className="text-[7px] font-black text-amber-600/40 uppercase mt-0.5 tracking-wider font-mono">Joii Map</span>
      </div>

      <div className="flex flex-col gap-2.5 max-w-[85%]">
        <strong className="text-base font-extrabold text-amber-900/90 leading-tight flex items-center gap-1.5">
          <Icon name="calendar" className="size-4.5 text-amber-700" />
          {locale === "th" ? "ขอบคุณสำหรับการเดินทาง!" : "Thank you for traveling!"}
        </strong>
        <p className="m-0 text-xs font-bold leading-relaxed text-amber-800/80">
          {locale === "th" 
            ? `ทริป ${trip.name} ได้เสร็จสิ้นลงแล้วอย่างสมบูรณ์แบบ หวังว่าคุณจะได้รับความทรงจำและมิตรภาพที่ยอดเยี่ยมระหว่างเดินทาง!`
            : `The ${trip.name} has completed. Hope this journey left you with beautiful memories and meaningful connections!`}
        </p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-2 border-t border-amber-200/40 pt-4 mt-4 text-center">
        <div className="flex flex-col gap-0.5">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-700/60">{locale === "th" ? "ระยะเวลา" : "Duration"}</span>
          <strong className="text-lg font-black text-amber-900">{dayCount} {locale === "th" ? "วัน" : "Days"}</strong>
        </div>
        <div className="flex flex-col gap-0.5 border-x border-amber-200/40">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-700/60">{locale === "th" ? "สถานที่เช็คอิน" : "Places Visited"}</span>
          <strong className="text-lg font-black text-amber-900">{stopCount} {locale === "th" ? "จุด" : "Stops"}</strong>
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-700/60">{locale === "th" ? "ยอดใช้จ่ายรวม" : "Total Budget"}</span>
          <strong className="text-lg font-black text-amber-900">{groupSpendLabel}</strong>
        </div>
      </div>
    </div>
  );
}

interface TaskAssigneeLabels {
  private: string;
  shared: string;
  tripMember: string;
  unassigned: string;
}

function TaskAssigneeBadge({ task, trip, labels }: { task: TripTask; trip: Trip; labels: TaskAssigneeLabels }) {
  const isPrivate = task.visibility === "private";
  const member = task.assigneeId ? trip.members.find((m) => m.id === task.assigneeId) : null;
  const name = member?.displayName ?? labels.tripMember;
  const color = member?.color ?? "#cbd5e1";
  const initial = name.slice(0, 1).toUpperCase();

  return (
    <div className="inline-flex flex-wrap items-center gap-1.5">
      {/* Visibility Badge */}
      <small className={cn(
        "inline-flex items-center text-[10px] font-bold px-1.5 py-0.5 rounded-sm border",
        isPrivate 
          ? "bg-teal-50 text-teal-700 border-teal-100/50" 
          : "bg-blue-50 text-blue-700 border-blue-100/50"
      )}>
        {isPrivate ? labels.private : labels.shared}
      </small>

      {/* Assignee Badge */}
      {task.visibility !== "private" && (
        task.assigneeId ? (
          <div className="inline-flex items-center gap-1">
            <span
              className="w-[18px] h-[18px] rounded-full flex items-center justify-center text-[9px] font-black text-white shrink-0 shadow-2xs"
              style={{ backgroundColor: color }}
              title={name}
            >
              {initial}
            </span>
            <span className="text-[11px] font-bold text-(--color-text-muted) max-w-[80px] overflow-hidden text-ellipsis whitespace-nowrap">
              {name}
            </span>
          </div>
        ) : (
          <small className="inline-flex items-center bg-slate-50 border border-slate-200/50 text-[10px] font-bold text-slate-500 px-1.5 py-0.5 rounded-sm">
            {labels.unassigned}
          </small>
        )
      )}
    </div>
  );
}

function OverviewHero({
  title,
  roleTitle,
  destinationLabel,
  dateRange,
  activeMembersLabel,
  groupSpendLabel,
  settlementCount,
  visual,
  currentMemberCard,
  countdown,
}: {
  title: string;
  roleTitle: string;
  destinationLabel: string;
  dateRange: string;
  activeMembersLabel: string;
  groupSpendLabel: string;
  settlementCount: number;
  visual: DestinationVisual;
  currentMemberCard: ReactNode;
  countdown: { text: string; type: "incoming" | "active" | "completed" };
}) {
  const { t } = useI18n();
  return (
    <section className={cn(overviewHeroBaseClassName, overviewHeroToneClassNames[visual.tone])} aria-label={title}>
      <div className={overviewHeroCopyClassName}>
        <div className="flex flex-wrap items-center gap-2 mb-1">
          <span className={overviewHeroKickerClassName}>{destinationLabel}</span>
          <span className={cn(
            "text-[11px] font-extrabold px-2 py-0.5 rounded-full border",
            countdown.type === "incoming" && "bg-(--color-primary-soft) text-(--color-primary-strong) border-(--color-primary-border)",
            countdown.type === "active" && "bg-(--color-warning-soft) text-(--color-warning-strong) border-(--color-warning-border)",
            countdown.type === "completed" && "bg-(--color-surface-muted) text-(--color-text-muted) border-(--color-border)"
          )}>
            {countdown.text}
          </span>
        </div>
        <h1 className={overviewHeroTitleClassName}>{title}</h1>
        <p className={overviewHeroRoleClassName}>{roleTitle}</p>
        <div className={overviewHeroMetaClassName} aria-label="trip facts">
          <span><Icon name="calendar" /> {dateRange}</span>
          <span><Icon name="location" /> {visual.label}</span>
          <span><Icon name="users" /> {activeMembersLabel}</span>
          <span><Icon name="wallet" /> {groupSpendLabel}</span>
        </div>
      </div>
      <div className={overviewHeroAsideClassName}>
        {currentMemberCard}
        <span className={overviewHeroSettlementsClassName}>{t.overview.money.settlementsCount({ count: settlementCount })}</span>
      </div>
    </section>
  );
}

function CockpitCard({
  icon,
  label,
  ariaLabel,
  value,
  detail,
  onClick,
}: {
  icon: "calendar" | "location" | "users" | "wallet" | "route" | "check";
  label: string;
  ariaLabel?: string;
  value: string;
  detail: ReactNode;
  onClick?: () => void;
}) {
  const iconColors = {
    route: "bg-teal-50 text-teal-700 border border-teal-100/80 dark:bg-teal-950/40 dark:text-teal-400 dark:border-teal-900/40",
    wallet: "bg-amber-50 text-amber-700 border border-amber-100/80 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-900/40",
    users: "bg-sky-50 text-sky-700 border border-sky-100/80 dark:bg-sky-950/40 dark:text-sky-400 dark:border-sky-900/40",
    calendar: "bg-indigo-50 text-indigo-700 border border-indigo-100/80 dark:bg-indigo-950/40 dark:text-indigo-400 dark:border-indigo-900/40",
    location: "bg-emerald-50 text-emerald-700 border border-emerald-100/80 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900/40",
    check: "bg-purple-50 text-purple-700 border border-purple-100/80 dark:bg-purple-950/40 dark:text-purple-400 dark:border-purple-900/40",
  }[icon] || "bg-slate-50 text-slate-700";

  const content = (
    <div className="flex flex-col gap-2 w-full">
      <div className="flex items-center gap-2">
        <div className={cn("size-8 rounded-full flex items-center justify-center shrink-0 shadow-xs", iconColors)}>
          <Icon name={icon} className="size-4" />
        </div>
        <span className="text-[11px] font-extrabold uppercase tracking-wider text-(--color-text-muted)">
          {label}
        </span>
      </div>
      <div className="flex flex-col gap-0.5 mt-1">
        <strong className="text-[22px] font-black leading-7 text-(--color-text) [overflow-wrap:anywhere]">
          {value}
        </strong>
        <div className="min-w-0 text-xs font-bold leading-[17px] text-(--color-text-muted) mt-0.5">
          {detail}
        </div>
      </div>
    </div>
  );

  if (onClick) {
    return (
      <button
        className={cn(
          cockpitCardBaseClassName,
          cockpitCardButtonClassName,
          "hover:scale-[1.01] hover:border-(--color-primary) active:scale-[0.99] transition-all duration-200"
        )}
        type="button"
        aria-label={ariaLabel}
        onClick={onClick}
      >
        {content}
      </button>
    );
  }

  return (
    <div className={cn(cockpitCardBaseClassName, "hover:scale-[1.01] hover:border-slate-300 transition-all duration-200")}>
      {content}
    </div>
  );
}

function HighlightBoard({ items, startDate, locale, emptyMessage, title, subtitle }: { items: ItineraryItem[]; startDate: string; locale: Locale; emptyMessage: string; title: string; subtitle: string }) {
  if (items.length === 1) return null;

  return (
    <section className={overviewHighlightBoardClassName} aria-label={title}>
      <div className={overviewBoardTitleClassName}>
        <Icon name="location" />
        <div>
          <h2>{title}</h2>
          <p>{subtitle}</p>
        </div>
      </div>
      {items.length ? (
        <ul aria-label={title} className={overviewHighlightListClassName} tabIndex={0}>
          {items.map((item, index) => {
            const imgUrl = getHighlightImage(item);
            return (
              <li
                className={cn(
                  overviewHighlightItemClassName,
                  !imgUrl && overviewHighlightToneClassNames[highlightTone(item, index)],
                  imgUrl && "border-slate-200/60 bg-slate-900",
                  "hover:scale-[1.02] hover:shadow-[0_12px_24px_rgba(15,23,42,0.08)] transition-all duration-300 group cursor-pointer"
                )}
                key={item.id}
              >
                {imgUrl && (
                  <>
                    <Image
                      src={imgUrl}
                      alt={item.activity}
                      fill
                      sizes="(max-width: 767px) 240px, 25vw"
                      className="absolute inset-0 w-full h-full object-cover opacity-70 transition-transform duration-500 group-hover:scale-108"
                      priority={index === 0}
                      loading={index === 0 ? "eager" : undefined}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/40 to-transparent z-[1]" />
                  </>
                )}
                <span className={cn("relative z-10 text-[11px] font-bold uppercase tracking-wider mb-1", imgUrl ? "text-slate-300" : "text-(--overview-highlight-accent)")}>
                  {formatDayLabel(item.day, startDate, locale)} · {item.startTime}
                </span>
                <strong className={cn("relative z-10 text-sm font-black leading-snug mb-0.5", imgUrl ? "text-white group-hover:text-teal-200 transition-colors" : "text-(--color-text)")}>
                  {item.activity}
                </strong>
                <small className={cn("relative z-10 text-[11px] font-bold overflow-hidden text-ellipsis whitespace-nowrap", imgUrl ? "text-slate-300" : "text-(--color-text-muted)")}>
                  {item.place}
                </small>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className={overviewMutedClassName}>{emptyMessage}</p>
      )}
    </section>
  );
}
