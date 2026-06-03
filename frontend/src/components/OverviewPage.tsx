import { type FormEvent, type ReactNode, useMemo, useState } from "react";
import type { ExpenseSummary, ItineraryItem, Member, Suggestion, Trip, TripTask } from "@/src/trip/types";
import { useI18n } from "@/src/i18n/I18nProvider";
import type { Locale } from "@/src/i18n/types";
import { cn } from "@/src/lib/cn";
import { formatDayLabel, getTripDates, type ItineraryView } from "@/src/trip/itinerary";
import { Icon } from "./icons";
import { formatTripRange, PageUserCard } from "./PageHeader";
import { Button } from "./ui";

interface OverviewPageProps {
  trip: Trip;
  currentMemberId: string;
  expenseSummary: ExpenseSummary;
  items: ItineraryItem[];
  itineraryView?: ItineraryView;
  suggestions: Suggestion[];
  tasks: TripTask[];
  onCreateTask: (input: { title: string; visibility: TripTask["visibility"]; assigneeId?: string | null }) => void;
  onOpenExpenses?: () => void;
  onToggleTaskStatus: (taskId: string) => void;
}

const overviewPageClassName = "overview-page grid min-h-full min-w-0 gap-3 bg-transparent px-6 py-[22px] pb-7 max-[767px]:px-3 max-[767px]:py-4 max-[767px]:pb-4";
const overviewCockpitClassName = "overview-travel-cockpit mb-3.5 grid w-full grid-cols-3 gap-3 max-[1199px]:grid-cols-2 max-[767px]:grid-cols-2 max-[767px]:[&_.overview-cockpit-card:nth-child(3)]:col-span-full";
const overviewHeroBaseClassName =
  "overview-hero relative mb-3 grid min-h-[228px] grid-cols-[minmax(0,1fr)_minmax(260px,320px)] items-center gap-6 overflow-hidden rounded-[var(--radius-lg)] border border-[color-mix(in_srgb,var(--overview-hero-accent)_18%,var(--color-border))] bg-[linear-gradient(115deg,rgb(255_255_255_/_0.98),rgb(255_255_255_/_0.9)_44%,rgb(255_255_255_/_0.58)_72%),linear-gradient(180deg,var(--overview-hero-sky)_0%,#ffffff_58%,var(--overview-hero-ground)_100%)] p-6 shadow-[0_14px_34px_rgb(15_23_42_/_0.07)] [--overview-hero-accent:var(--color-primary)] [--overview-hero-ground:#f8d49b] [--overview-hero-horizon:#8bd3e6] [--overview-hero-ink:#11323d] [--overview-hero-sky:#dff6ff] max-[1199px]:grid-cols-[minmax(0,1fr)_minmax(240px,300px)] max-[767px]:min-h-0 max-[767px]:grid-cols-1 max-[767px]:gap-3 max-[767px]:p-4";
const overviewHeroToneClassNames = {
  harbor: "[--overview-hero-accent:#0f766e] [--overview-hero-ground:#d6f2ef] [--overview-hero-horizon:#4fb8cc] [--overview-hero-sky:#dff8ff]",
  city: "[--overview-hero-accent:#5b6ec7] [--overview-hero-ground:#f6dfb6] [--overview-hero-horizon:#7c91d8] [--overview-hero-sky:#e8edff]",
  coast: "[--overview-hero-accent:#0284c7] [--overview-hero-ground:#fde68a] [--overview-hero-horizon:#38bdf8] [--overview-hero-sky:#dff7ff]",
  market: "[--overview-hero-accent:#c2410c] [--overview-hero-ground:#fee2b8] [--overview-hero-horizon:#fb7185] [--overview-hero-sky:#fff1df]",
} satisfies Record<DestinationTone, string>;
const overviewHeroCopyClassName = "overview-hero-copy relative z-[2] grid min-w-0 max-w-[760px] content-center gap-2.5";
const overviewHeroKickerClassName = "overview-hero-kicker w-fit max-w-full overflow-hidden rounded-full border border-[color-mix(in_srgb,var(--overview-hero-accent)_24%,white)] bg-[rgb(255_255_255_/_0.72)] px-2.5 py-1.5 text-xs font-[850] leading-4 text-[var(--overview-hero-accent)] text-ellipsis whitespace-nowrap";
const overviewHeroTitleClassName = "m-0 text-[clamp(28px,3vw,42px)] font-[950] leading-[1.08] text-[var(--overview-hero-ink)] max-[767px]:text-[28px] max-[767px]:leading-8";
const overviewHeroRoleClassName = "overview-hero-role m-0 max-w-[620px] text-[15px] font-bold leading-[23px] text-[color-mix(in_srgb,var(--overview-hero-ink)_78%,var(--color-text-muted))] max-[767px]:text-[13px] max-[767px]:leading-5";
const overviewHeroMetaClassName = "overview-hero-meta mt-1 flex flex-wrap gap-2 max-[767px]:grid max-[767px]:grid-cols-1 [&_.icon]:text-[var(--overview-hero-accent)] [&_span]:inline-flex [&_span]:min-h-8 [&_span]:min-w-0 [&_span]:max-w-full [&_span]:items-center [&_span]:gap-[7px] [&_span]:rounded-[var(--radius-sm)] [&_span]:border [&_span]:border-white/60 [&_span]:bg-white/70 [&_span]:px-[9px] [&_span]:py-1.5 [&_span]:text-xs [&_span]:font-extrabold [&_span]:leading-4 [&_span]:text-[var(--color-text)] [&_span]:shadow-[0_8px_18px_rgb(15_23_42_/_0.05)] max-[767px]:[&_span]:overflow-hidden max-[767px]:[&_span]:text-ellipsis max-[767px]:[&_span]:whitespace-nowrap";
const overviewHeroVisualClassName =
  "overview-hero-visual absolute bottom-[22px] right-[min(360px,26vw)] top-[22px] z-[1] hidden min-h-0 w-[min(300px,28vw)] overflow-hidden rounded-[var(--radius-lg)] border border-white/60 bg-[radial-gradient(circle_at_72%_18%,#fff7b8_0_28px,rgb(255_247_184_/_0.34)_29px_54px,transparent_55px),linear-gradient(180deg,rgb(255_255_255_/_0.18),transparent_44%),linear-gradient(180deg,var(--overview-hero-sky),color-mix(in_srgb,var(--overview-hero-horizon)_28%,white)_56%,var(--overview-hero-ground))] opacity-40 shadow-[inset_0_0_0_1px_rgb(255_255_255_/_0.32)] [&>span]:absolute [&>span]:block [&>span]:pointer-events-none";
const overviewHeroSkylineClassName = "overview-hero-skyline";
const overviewHeroRouteClassName = "overview-hero-route bottom-[17%] right-[9%] h-[46%] w-[74%] -rotate-[7deg] rounded-bl-full border-b-4 border-l-4 border-b-white/90 border-l-white/70";
const overviewHeroMarkerClassName =
  "overview-hero-marker bottom-[39%] left-[18%] size-[18px] -rotate-45 rounded-[999px_999px_999px_2px] border-4 border-white/90 bg-[var(--overview-hero-accent)] shadow-[0_10px_18px_rgb(15_23_42_/_0.14)]";
const overviewHeroAsideClassName = "overview-hero-aside relative z-[2] grid min-w-0 content-center gap-2.5 self-center rounded-[var(--radius-lg)] border border-white/70 bg-white/80 p-3 shadow-[0_14px_30px_rgb(15_23_42_/_0.07)] max-[1199px]:col-auto max-[1199px]:grid-cols-1 max-[1199px]:items-center max-[767px]:grid-cols-1 [&_.page-current-user]:min-w-0 [&_.page-current-user]:w-full [&_.page-current-user]:border-transparent [&_.page-current-user]:bg-transparent [&_.page-current-user]:shadow-none";
const overviewHeroSettlementsClassName = "overview-hero-settlements justify-self-stretch rounded-full border border-[color-mix(in_srgb,var(--overview-hero-accent)_26%,white)] bg-[rgb(255_255_255_/_0.7)] px-2.5 py-1.5 text-center text-xs font-[850] leading-4 text-[var(--overview-hero-accent)]";
const cockpitCardBaseClassName = "overview-cockpit-card grid min-h-[126px] min-w-0 content-start gap-2 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[linear-gradient(145deg,rgb(255_255_255_/_0.94),rgb(248_250_252_/_0.82)),var(--paper-grain),var(--color-surface)] bg-[length:auto,120px_120px,auto] p-3.5 text-left text-inherit shadow-[0_10px_24px_rgb(15_23_42_/_0.04)] max-[767px]:min-h-[104px] [&_small]:min-w-0 [&_small]:text-xs [&_small]:font-bold [&_small]:leading-[17px] [&_small]:text-[var(--color-text-muted)] [&_strong]:min-w-0 [&_strong]:text-[22px] [&_strong]:font-black [&_strong]:leading-7 [&_strong]:text-[var(--color-text)] [&_strong]:[overflow-wrap:anywhere]";
const cockpitCardButtonClassName = "overview-cockpit-card--button cursor-pointer transition-[border-color,box-shadow,transform] duration-150 hover:-translate-y-px hover:border-[var(--color-primary)] hover:shadow-[0_16px_30px_rgb(15_23_42_/_0.08)] focus-visible:-translate-y-px focus-visible:border-[var(--color-primary)] focus-visible:shadow-[0_16px_30px_rgb(15_23_42_/_0.08)] focus-visible:outline-none";
const cockpitCardTitleClassName = "overview-cockpit-card-title inline-flex min-w-0 items-center gap-2 text-xs font-[850] leading-4 text-[var(--color-text-muted)] [&_.icon]:text-[var(--color-primary)]";
const overviewReadinessChipsClassName = "overview-readiness-chips flex min-w-0 flex-wrap gap-1.5 [&_span]:min-w-0 [&_span]:rounded-[var(--radius-sm)] [&_span]:border [&_span]:border-[color-mix(in_srgb,var(--color-primary)_14%,var(--color-border))] [&_span]:bg-[rgb(255_255_255_/_0.68)] [&_span]:px-[7px] [&_span]:py-1 [&_span]:text-[11px] [&_span]:font-extrabold [&_span]:leading-[15px] [&_span]:text-[var(--color-text-muted)]";
const modalBackdropClassName = "modal-backdrop fixed inset-0 z-20 grid place-items-center bg-[rgb(15_23_42_/_0.28)] p-5 max-[767px]:items-end max-[767px]:p-2.5";
const taskDialogClassName = "stop-dialog overview-task-dialog max-h-[calc(100vh-40px)] w-[min(480px,100%)] overflow-auto rounded-2xl border border-[var(--color-border-strong)] bg-[var(--color-surface)] shadow-[0_30px_90px_rgb(15_23_42_/_0.24)]";
const taskDialogTitleRowClassName = "dialog-title-row grid min-h-[62px] grid-cols-[minmax(0,1fr)_34px] items-center gap-3 border-b border-[var(--color-border)] bg-[linear-gradient(180deg,var(--color-surface)_0%,var(--color-surface-subtle)_100%)] py-0 pl-5 pr-[18px] [&_button]:grid [&_button]:size-[34px] [&_button]:cursor-pointer [&_button]:place-items-center [&_button]:rounded-[var(--radius-sm)] [&_button]:border [&_button]:border-transparent [&_button]:bg-transparent [&_button]:text-[var(--color-text-muted)] [&_button]:transition-[background,border-color,color] [&_button]:duration-200 [&_button:focus-visible]:border-[var(--color-border)] [&_button:focus-visible]:bg-[var(--color-surface)] [&_button:focus-visible]:text-[var(--color-text)] [&_button:hover]:border-[var(--color-border)] [&_button:hover]:bg-[var(--color-surface)] [&_button:hover]:text-[var(--color-text)] [&_h2]:m-0 [&_h2]:text-lg [&_h2]:font-black [&_h2]:leading-6 [&_h2]:text-[#0f172a] [&_.icon]:size-[18px]";
const taskDialogGridClassName = "dialog-grid grid grid-cols-2 gap-3.5 px-5 pb-5 pt-[18px] max-[767px]:grid-cols-1 [&_input]:min-h-11 [&_input]:w-full [&_input]:rounded-[10px] [&_input]:border [&_input]:border-[var(--color-border)] [&_input]:bg-[var(--color-surface-subtle)] [&_input]:px-3 [&_input]:text-sm [&_input]:font-bold [&_input]:text-[var(--color-text)] [&_input]:transition-[background,border-color,box-shadow] [&_input]:duration-200 [&_input:focus]:border-[var(--color-primary-border)] [&_input:focus]:bg-[var(--color-surface)] [&_input:focus]:shadow-[0_0_0_3px_rgb(37_99_235_/_0.12)] [&_input:focus]:outline-none [&_label]:grid [&_label]:min-w-0 [&_label]:gap-[7px] [&_label>span]:text-xs [&_label>span]:font-extrabold [&_label>span]:leading-4 [&_label>span]:text-[var(--color-text)] [&_select]:min-h-11 [&_select]:w-full [&_select]:rounded-[10px] [&_select]:border [&_select]:border-[var(--color-border)] [&_select]:bg-[var(--color-surface-subtle)] [&_select]:px-3 [&_select]:text-sm [&_select]:font-bold [&_select]:text-[var(--color-text)] [&_select]:transition-[background,border-color,box-shadow] [&_select]:duration-200 [&_select:focus]:border-[var(--color-primary-border)] [&_select:focus]:bg-[var(--color-surface)] [&_select:focus]:shadow-[0_0_0_3px_rgb(37_99_235_/_0.12)] [&_select:focus]:outline-none [&_select:disabled]:bg-[var(--color-surface-muted)] [&_select:disabled]:text-[var(--color-text-subtle)]";
const dialogFieldWideClassName = "dialog-field-wide col-span-full";
const taskDialogFormClassName = "overview-task-form overview-task-form--dialog grid grid-cols-1 gap-0 p-0";
const taskDialogActionsClassName = "dialog-actions flex justify-end gap-2.5 border-t border-[var(--color-border)] bg-[var(--color-surface-subtle)] px-5 pb-[18px] pt-3.5 max-[767px]:grid [&_.button]:min-h-[38px] [&_.button]:min-w-[104px] [&_.button]:w-auto";
const overviewGridClassName = "overview-grid m-0 grid w-full grid-cols-[minmax(0,1.18fr)_minmax(300px,0.82fr)] gap-3 max-[1199px]:grid-cols-1";
const overviewPanelClassName = "overview-panel grid min-h-40 content-start gap-2.5 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[linear-gradient(145deg,rgb(255_255_255_/_0.86),rgb(248_250_252_/_0.74)),var(--paper-grain),var(--color-surface)] bg-[length:auto,120px_120px,auto] p-4 [&>span]:text-xs [&>span]:font-bold [&>span]:text-[var(--color-text-muted)] [&>strong]:text-xl [&>strong]:font-extrabold [&>strong]:leading-7 [&>strong]:text-[var(--color-text)]";
const overviewPanelWideClassName = "overview-panel--wide col-start-1 max-[1199px]:col-auto";
const overviewPanelHealthClassName = "overview-panel--health min-h-[132px]";
const overviewPanelButtonClassName = "overview-panel--button w-full cursor-pointer text-left text-inherit transition-[border-color,box-shadow,transform] duration-150 hover:-translate-y-px hover:border-[var(--color-primary)] hover:shadow-[var(--shadow-soft)] focus-visible:-translate-y-px focus-visible:border-[var(--color-primary)] focus-visible:shadow-[var(--shadow-soft)] focus-visible:outline-none";
const overviewTaskPanelClassName = "overview-task-panel col-start-2 row-[1/span_2] min-h-0 self-start max-[1199px]:col-auto max-[1199px]:row-auto";
const overviewPanelTitleClassName = "overview-panel-title inline-flex items-center gap-2 text-[var(--color-primary-strong)] [&_h2]:m-0 [&_h2]:text-[15px] [&_h2]:font-extrabold [&_h2]:leading-[22px] [&_h2]:text-[var(--color-text)]";
const overviewMutedClassName = "overview-muted text-xs font-bold text-[var(--color-text-muted)]";
const overviewNextStopClassName = "overview-next-stop grid gap-[5px] [&_p]:m-0 [&_p]:mt-1 [&_p]:text-[13px] [&_p]:leading-5 [&_p]:text-[var(--color-text-muted)] [&_span]:text-xs [&_span]:font-bold [&_span]:text-[var(--color-text-muted)] [&_strong]:text-xl [&_strong]:font-extrabold [&_strong]:leading-7 [&_strong]:text-[var(--color-text)]";
const overviewHealthGridClassName = "overview-health-grid grid grid-cols-3 gap-2 max-[520px]:grid-cols-1 [&_span]:grid [&_span]:min-h-[58px] [&_span]:gap-0.5 [&_span]:rounded-[var(--radius-sm)] [&_span]:border [&_span]:border-[var(--color-border)] [&_span]:bg-[var(--color-surface-subtle)] [&_span]:p-2.5 [&_span]:text-xs [&_span]:font-bold [&_span]:leading-4 [&_span]:text-[var(--color-text-muted)] [&_strong]:text-[22px] [&_strong]:font-extrabold [&_strong]:leading-[26px] [&_strong]:text-[var(--color-text)]";
const overviewStopListClassName = "overview-stop-list m-0 grid list-none gap-2 p-0 [&_li]:grid [&_li]:gap-[3px] [&_li]:rounded-[var(--radius-sm)] [&_li]:border [&_li]:border-[var(--color-border)] [&_li]:bg-[var(--color-surface-subtle)] [&_li]:px-3 [&_li]:py-2.5 [&_small]:text-xs [&_small]:font-bold [&_small]:leading-4 [&_small]:text-[var(--color-text-muted)] [&_span]:text-xs [&_span]:font-bold [&_span]:leading-4 [&_span]:text-[var(--color-text-muted)] [&_strong]:text-sm [&_strong]:font-extrabold [&_strong]:leading-5 [&_strong]:text-[var(--color-text)]";
const overviewFocusListClassName = "overview-focus-list m-0 mt-2 grid list-none gap-1.5 p-0 [&_li]:flex [&_li]:flex-wrap [&_li]:items-center [&_li]:gap-x-2.5 [&_li]:gap-y-1.5 [&_li]:border-t [&_li]:border-[var(--color-border)] [&_li]:pt-2 [&_span]:text-xs [&_span]:font-bold [&_span]:leading-4 [&_span]:text-[var(--color-text-muted)] [&_strong]:text-[13px] [&_strong]:font-extrabold [&_strong]:leading-[18px] [&_strong]:text-[var(--color-text)]";
const overviewHighlightBoardClassName = "overview-highlight-board mb-4 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[linear-gradient(135deg,rgb(255_255_255_/_0.86),rgb(255_247_237_/_0.44)),var(--paper-grain),var(--color-surface)] bg-[length:auto,120px_120px,auto] p-3 shadow-[0_14px_32px_rgb(15_23_42_/_0.05)] max-[767px]:hidden";
const overviewBoardTitleClassName = "overview-board-title mb-2.5 flex items-center gap-[9px] text-[var(--color-text)] [&_.icon]:text-[var(--color-primary)] [&_h2]:m-0 [&_h2]:text-[15px] [&_h2]:font-black [&_h2]:leading-[22px] [&_p]:m-0 [&_p]:text-xs [&_p]:font-bold [&_p]:leading-[17px] [&_p]:text-[var(--color-text-muted)]";
const overviewHighlightListClassName = "overview-highlight-list m-0 grid list-none grid-cols-[repeat(4,minmax(150px,1fr))] gap-2.5 p-0 max-[1199px]:grid-cols-3 max-[767px]:grid-cols-1";
const overviewHighlightItemClassName =
  "overview-highlight-item relative grid min-h-[178px] min-w-0 content-end overflow-hidden rounded-[var(--radius-md)] border border-[color-mix(in_srgb,var(--overview-highlight-accent)_18%,white)] bg-[linear-gradient(180deg,transparent_0_34%,rgb(255_255_255_/_0.78)_66%,rgb(255_255_255_/_0.94)),radial-gradient(circle_at_22%_22%,rgb(255_255_255_/_0.86)_0_16px,transparent_17px),linear-gradient(135deg,var(--overview-highlight-wash),color-mix(in_srgb,var(--overview-highlight-accent)_18%,white))] px-3 pb-3 pt-[88px] [--overview-highlight-accent:#0284c7] [--overview-highlight-wash:#e0f2fe] max-[767px]:min-h-[150px] [&_small]:relative [&_small]:z-[1] [&_small]:min-w-0 [&_small]:overflow-hidden [&_small]:text-ellipsis [&_small]:whitespace-nowrap [&_small]:text-[11px] [&_small]:font-bold [&_small]:leading-[15px] [&_small]:text-[var(--color-text-muted)] [&_span]:relative [&_span]:z-[1] [&_span]:text-[11px] [&_span]:font-[850] [&_span]:leading-[15px] [&_span]:text-[var(--overview-highlight-accent)] [&_strong]:relative [&_strong]:z-[1] [&_strong]:min-w-0 [&_strong]:overflow-hidden [&_strong]:text-ellipsis [&_strong]:whitespace-nowrap [&_strong]:text-[13px] [&_strong]:font-black [&_strong]:leading-[18px] [&_strong]:text-[var(--color-text)]";
const overviewHighlightToneClassNames = {
  harbor: "[--overview-highlight-accent:#0f766e] [--overview-highlight-wash:#ccfbf1]",
  city: "[--overview-highlight-accent:#4f46e5] [--overview-highlight-wash:#e0e7ff]",
  coast: "[--overview-highlight-accent:#0284c7] [--overview-highlight-wash:#cffafe]",
  market: "[--overview-highlight-accent:#c2410c] [--overview-highlight-wash:#ffedd5]",
} satisfies Record<DestinationTone, string>;
const overviewTaskToolbarClassName = "overview-task-toolbar flex flex-wrap items-center justify-between gap-2";
const overviewTaskFiltersClassName = "overview-task-filters inline-flex w-fit max-w-full rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-0.5";
const overviewTaskFilterClassName = "overview-task-filter min-h-7 rounded-[calc(var(--radius-sm)-2px)] border-0 bg-transparent px-2.5 text-xs font-extrabold text-[var(--color-text-muted)]";
const overviewTaskFilterActiveClassName = "overview-task-filter--active bg-[var(--color-surface)] text-[var(--color-primary-strong)] shadow-[0_1px_4px_rgb(15_23_42_/_0.06)]";
const overviewTaskAddButtonClassName = "overview-task-add-button inline-flex min-h-[34px] w-[34px] flex-none items-center justify-center rounded-[var(--radius-sm)] border border-[var(--color-primary-border)] bg-[var(--color-primary)] p-0 text-xl font-extrabold leading-none text-white transition-[background,border-color,box-shadow,transform] duration-200 hover:border-[var(--color-primary)] hover:bg-[var(--color-primary-strong)] hover:shadow-[0_8px_18px_rgb(37_99_235_/_0.18)] active:translate-y-px focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[rgb(37_99_235_/_0.22)]";
const overviewTaskFormClassName = "overview-task-form grid grid-cols-[minmax(180px,1fr)_minmax(118px,140px)_minmax(132px,160px)_auto] items-end gap-2 max-[767px]:grid-cols-1 [&_button]:min-h-[34px] [&_button]:rounded-[var(--radius-sm)] [&_button]:border [&_button]:border-[var(--color-primary-border)] [&_button]:bg-[var(--color-primary)] [&_button]:px-3 [&_button]:text-xs [&_button]:font-extrabold [&_button]:text-white [&_button:disabled]:border-[var(--color-border)] [&_button:disabled]:bg-[var(--color-surface-muted)] [&_button:disabled]:text-[var(--color-text-subtle)] max-[767px]:[&_button]:w-full [&_input]:min-h-[34px] [&_input]:w-full [&_input]:rounded-[var(--radius-sm)] [&_input]:border [&_input]:border-[var(--color-border)] [&_input]:bg-[var(--color-surface)] [&_input]:px-2.5 [&_input]:text-xs [&_input]:font-bold [&_input]:text-[var(--color-text)] [&_label]:grid [&_label]:min-w-0 [&_label]:gap-[5px] [&_label>span]:text-[11px] [&_label>span]:font-extrabold [&_label>span]:leading-[15px] [&_label>span]:text-[var(--color-text-muted)] [&_select]:min-h-[34px] [&_select]:w-full [&_select]:rounded-[var(--radius-sm)] [&_select]:border [&_select]:border-[var(--color-border)] [&_select]:bg-[var(--color-surface)] [&_select]:px-2.5 [&_select]:text-xs [&_select]:font-bold [&_select]:text-[var(--color-text)] [&_select:disabled]:bg-[var(--color-surface-muted)] [&_select:disabled]:text-[var(--color-text-subtle)]";
const overviewTaskFormPersonalClassName = "overview-task-form--personal grid-cols-[minmax(180px,1fr)_auto] max-[767px]:grid-cols-1";
const overviewTaskListClassName = "overview-task-list m-0 grid list-none gap-2 p-0 text-[13px] font-semibold leading-5 text-[var(--color-text-muted)]";
const overviewTaskItemClassName = "overview-task-item grid min-h-10 grid-cols-[minmax(0,1fr)_auto] items-center gap-2.5 rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface-subtle)] px-2.5 py-2 data-[status=done]:[&_label>span]:text-[var(--color-text-muted)] data-[status=done]:[&_label>span]:line-through max-[767px]:grid-cols-1 [&_input]:size-4 [&_input]:accent-[var(--color-primary)] [&_label]:inline-flex [&_label]:min-w-0 [&_label]:items-center [&_label]:gap-[9px] [&_label>span]:overflow-hidden [&_label>span]:text-ellipsis [&_label>span]:whitespace-nowrap [&_label>span]:text-[13px] [&_label>span]:font-bold [&_label>span]:leading-[18px] [&_label>span]:text-[var(--color-text)] [&_small]:whitespace-nowrap [&_small]:text-[11px] [&_small]:font-extrabold [&_small]:text-[var(--color-text-muted)]";
const overviewTaskMetaClassName = "overview-task-meta inline-flex flex-wrap justify-end gap-1.5";
const overviewTaskScopeClassName = "overview-task-scope rounded-full border border-[var(--color-border)] px-2 py-[3px] leading-[14px]";
const overviewTaskScopeToneClassName: Record<TripTask["visibility"], string> = {
  private: "overview-task-scope--private border-[var(--color-primary-border)] bg-[var(--color-primary-soft)] text-[var(--color-primary-strong)]",
  shared: "overview-task-scope--shared border-[var(--color-route-border)] bg-[var(--color-route-soft)] text-[var(--color-route)]",
};
const overviewUndoToastClassName = "overview-undo-toast fixed bottom-5 right-5 z-[80] inline-flex max-w-[min(420px,calc(100vw-32px))] items-center gap-3 rounded-[var(--radius-md)] border border-[var(--color-primary)] bg-[var(--color-surface)] px-3.5 py-3 text-[13px] font-extrabold text-[var(--color-text)] shadow-[var(--shadow-panel)] [&_button]:min-h-[30px] [&_button]:cursor-pointer [&_button]:rounded-[var(--radius-sm)] [&_button]:border [&_button]:border-[var(--color-border-strong)] [&_button]:bg-[var(--color-primary-soft)] [&_button]:px-2.5 [&_button]:text-[var(--color-primary-strong)] [&_button]:font-extrabold";

export function OverviewPage({
  trip,
  currentMemberId,
  expenseSummary,
  items,
  itineraryView,
  suggestions,
  tasks,
  onCreateTask,
  onOpenExpenses,
  onToggleTaskStatus,
}: OverviewPageProps) {
  const { locale, t } = useI18n();
  const [taskScope, setTaskScope] = useState<"mine" | "trip" | "all">("mine");
  const [taskStatusFilter, setTaskStatusFilter] = useState<"all" | "open" | "done">("all");
  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskVisibility, setNewTaskVisibility] = useState<TripTask["visibility"]>("private");
  const [newTaskAssigneeId, setNewTaskAssigneeId] = useState("");
  const [undoTask, setUndoTask] = useState<TripTask | null>(null);
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
                <h2>{t.overview.focusToday}</h2>
              </div>
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
              <form className={cn(overviewTaskFormClassName, overviewTaskFormPersonalClassName)} onSubmit={submitTask}>
                <label>
                  <span>{t.overview.addPersonalTask}</span>
                  <input value={newTaskTitle} onChange={(event) => setNewTaskTitle(event.target.value)} placeholder={t.overview.personalTaskPlaceholder} />
                </label>
                <button type="submit" disabled={!newTaskTitle.trim()}>{t.overview.addTask}</button>
              </form>
              {visibleTasks.length ? (
                <ul className={overviewTaskListClassName}>
                  {visibleTasks.map((task) => (
                    <li className={overviewTaskItemClassName} key={task.id} aria-label={task.title} data-status={task.status}>
                      <label>
                        <input type="checkbox" checked={task.status === "done"} onChange={() => toggleTask(task)} />
                        <span>{task.title}</span>
                      </label>
                      <div className={overviewTaskMetaClassName}>
                        <small className={cn(overviewTaskScopeClassName, overviewTaskScopeToneClassName[task.visibility])}>{task.visibility === "private" ? t.overview.task.private : t.overview.task.shared}</small>
                        <small>{assigneeLabel(task, trip, t.overview.task)}</small>
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
            <h2>{t.overview.focusToday}</h2>
          </div>
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
                <li className={overviewTaskItemClassName} key={task.id} aria-label={task.title} data-status={task.status}>
                  <label>
                    <input type="checkbox" checked={task.status === "done"} onChange={() => toggleTask(task)} />
                    <span>{task.title}</span>
                  </label>
                  <div className={overviewTaskMetaClassName}>
                    <small className={cn(overviewTaskScopeClassName, overviewTaskScopeToneClassName[task.visibility])}>{task.visibility === "private" ? t.overview.task.private : t.overview.task.shared}</small>
                    <small>{taskKindLabel(task, t.overview.task)}</small>
                    <small>{task.relatedItemId ? stopLabel(task.relatedItemId, items, t.overview.task.planStop) : assigneeLabel(task, trip, t.overview.task)}</small>
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

function assigneeLabel(task: TripTask, trip: Trip, labels: { mine: string; unassigned: string; tripMember: string }): string {
  if (task.visibility === "private") return labels.mine;
  if (!task.assigneeId) return labels.unassigned;
  /* v8 ignore next */
  return trip.members.find((member) => member.id === task.assigneeId)?.displayName ?? labels.tripMember;
}

type DestinationTone = "harbor" | "city" | "coast" | "market";

interface DestinationVisual {
  tone: DestinationTone;
  label: string;
}

function buildDestinationVisual(destinationLabel: string): DestinationVisual {
  const label = destinationLabel.trim() || "Trip destination";
  const normalized = label.toLocaleLowerCase("en-US");
  if (/(hong kong|harbour|harbor|shenzhen|bay)/i.test(normalized)) return { tone: "harbor", label };
  if (/(beach|coast|island|phuket|okinawa|bali)/i.test(normalized)) return { tone: "coast", label };
  if (/(market|bazaar|night|taipei|bangkok)/i.test(normalized)) return { tone: "market", label };
  return { tone: "city", label };
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
}) {
  return (
    <section className={cn(overviewHeroBaseClassName, overviewHeroToneClassNames[visual.tone])} aria-label={title}>
      <div className={overviewHeroCopyClassName}>
        <span className={overviewHeroKickerClassName}>{destinationLabel}</span>
        <h1 className={overviewHeroTitleClassName}>{title}</h1>
        <p className={overviewHeroRoleClassName}>{roleTitle}</p>
        <div className={overviewHeroMetaClassName} aria-label="trip facts">
          <span><Icon name="calendar" /> {dateRange}</span>
          <span><Icon name="location" /> {visual.label}</span>
          <span><Icon name="users" /> {activeMembersLabel}</span>
          <span><Icon name="wallet" /> {groupSpendLabel}</span>
        </div>
      </div>
      <div className={overviewHeroVisualClassName} aria-hidden="true">
        <span className={overviewHeroSkylineClassName} />
        <span className={overviewHeroRouteClassName} />
        <span className={overviewHeroMarkerClassName} />
      </div>
      <div className={overviewHeroAsideClassName}>
        {currentMemberCard}
        <span className={overviewHeroSettlementsClassName}>{settlementCount} settlements</span>
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
  const content = (
    <>
      <div className={cockpitCardTitleClassName}>
        <Icon name={icon} />
        <span>{label}</span>
      </div>
      <strong>{value}</strong>
      <small>{detail}</small>
    </>
  );

  if (onClick) {
    return (
      <button className={cn(cockpitCardBaseClassName, cockpitCardButtonClassName)} type="button" aria-label={ariaLabel} onClick={onClick}>
        {content}
      </button>
    );
  }

  return <div className={cockpitCardBaseClassName}>{content}</div>;
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
        <ul className={overviewHighlightListClassName}>
          {items.map((item, index) => (
            <li className={cn(overviewHighlightItemClassName, overviewHighlightToneClassNames[highlightTone(item, index)])} key={item.id}>
              <span>{formatDayLabel(item.day, startDate, locale)} · {item.startTime}</span>
              <strong>{item.activity}</strong>
              <small>{item.place}</small>
            </li>
          ))}
        </ul>
      ) : (
        <p className={overviewMutedClassName}>{emptyMessage}</p>
      )}
    </section>
  );
}
