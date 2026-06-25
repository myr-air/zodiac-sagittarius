import type { DestinationTone } from "@/src/features/itinerary/domain/overview";
import { workspaceResponsivePanelResetClassName } from "@/src/shared/components/workspace-surface/workspace-surface.styles";

export const overviewStopListClassName =
  "overview-stop-list m-0 grid list-none gap-2 p-0 [&_li]:grid [&_li]:gap-[3px] [&_li]:rounded-(--radius-sm) [&_li]:border [&_li]:border-(--color-border) [&_li]:bg-(--color-surface-subtle) [&_li]:px-3 [&_li]:py-2.5 [&_small]:text-xs [&_small]:font-bold [&_small]:leading-4 [&_small]:text-(--color-text-muted) [&_span]:text-xs [&_span]:font-bold [&_span]:leading-4 [&_span]:text-(--color-text-muted) [&_strong]:text-sm [&_strong]:font-extrabold [&_strong]:leading-5 [&_strong]:text-(--color-text)";

export const overviewFocusListClassName =
  "overview-focus-list m-0 mt-2 grid list-none gap-1.5 p-0 [&_li]:flex [&_li]:flex-wrap [&_li]:items-center [&_li]:gap-x-2.5 [&_li]:gap-y-1.5 [&_li]:border-t [&_li]:border-(--color-border) [&_li]:pt-2 [&_span]:text-xs [&_span]:font-bold [&_span]:leading-4 [&_span]:text-(--color-text-muted) [&_strong]:text-[13px] [&_strong]:font-extrabold [&_strong]:leading-[18px] [&_strong]:text-(--color-text)";

export const overviewMutedClassName = "overview-muted text-xs font-bold text-(--color-text-muted)";
export const overviewTaskMetaClassName = "overview-task-meta inline-flex flex-wrap justify-end gap-1.5";
export const overviewTaskListClassName =
  "overview-task-list m-0 grid list-none gap-2 p-0 text-[13px] font-semibold leading-5 text-(--color-text-muted)";
export const overviewTaskItemClassName =
  "overview-task-item grid min-h-10 grid-cols-[minmax(0,1fr)_auto] items-center gap-2.5 rounded-(--radius-sm) border border-(--color-border) bg-(--color-surface-subtle) px-2.5 py-2 max-[767px]:grid-cols-1 [&_input]:size-4 [&_input]:accent-[var(--color-primary)] [&_label]:inline-flex [&_label]:min-w-0 [&_label]:items-center [&_label]:gap-[9px] [&_label>span]:overflow-hidden [&_label>span]:text-ellipsis [&_label>span]:whitespace-nowrap [&_label>span]:text-[13px] [&_label>span]:leading-[18px] [&_small]:whitespace-nowrap [&_small]:text-[11px] [&_small]:font-extrabold [&_small]:text-(--color-text-muted)";
export const overviewTaskItemInteractiveClassName =
  "transition-[border-color,box-shadow,background] duration-150 hover:border-(--color-primary-border) hover:bg-(--color-surface)";
export const overviewTaskKindChipClassName =
  "text-[11px] font-extrabold text-(--color-text-muted) border border-(--color-border) bg-(--color-surface-subtle) px-1.5 py-0.5 rounded-sm";
export const overviewTaskTitleDoneClassName = "line-through text-(--color-text-muted) font-normal";
export const overviewTaskTitleTodoClassName = "text-(--color-text) font-bold";

export const overviewNextStopClassName =
  "overview-next-stop grid gap-[5px] [&_p]:m-0 [&_p]:mt-1 [&_p]:text-[13px] [&_p]:leading-5 [&_p]:text-(--color-text-muted) [&_span]:text-xs [&_span]:font-bold [&_span]:text-(--color-text-muted) [&_strong]:text-xl [&_strong]:font-extrabold [&_strong]:leading-7 [&_strong]:text-(--color-text)";

export const overviewHeroBaseClassName =
  "overview-hero relative col-span-12 grid min-h-[126px] min-w-0 max-w-full grid-cols-[minmax(0,1fr)_minmax(220px,260px)] items-center gap-4 overflow-hidden rounded-(--radius-lg) border border-[color-mix(in_srgb,var(--overview-hero-accent)_16%,var(--color-border))] bg-[linear-gradient(135deg,var(--color-surface)_0%,color-mix(in_srgb,var(--overview-hero-sky)_62%,white)_100%)] p-4 shadow-[0_1px_0_rgb(15_23_42_/_0.04)] [--overview-hero-accent:var(--color-primary)] [--overview-hero-ground:#f7d9b8] [--overview-hero-horizon:#8bd3e6] [--overview-hero-ink:#18191f] [--overview-hero-sky:#eaf6ff] before:pointer-events-none before:absolute before:inset-y-0 before:right-0 before:w-[44%] before:bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.65))] max-[1199px]:col-auto max-[1199px]:mb-0 max-[1199px]:grid-cols-1 max-[1199px]:gap-2 max-[1199px]:rounded-none max-[1199px]:border-x-0 max-[1199px]:border-t-0 max-[1199px]:p-4 max-[1199px]:shadow-none max-[767px]:min-h-0 max-[767px]:rounded-(--radius-lg) max-[767px]:border max-[767px]:p-3.5 max-[767px]:shadow-[0_1px_0_rgb(15_23_42_/_0.04)] max-[767px]:before:hidden";

export const overviewHeroToneClassNames: Record<DestinationTone, string> = {
  harbor: "[--overview-hero-accent:var(--color-primary)] [--overview-hero-ground:#d6f2ef] [--overview-hero-horizon:#4fb8cc] [--overview-hero-sky:#e8f8ff]",
  city: "[--overview-hero-accent:var(--color-primary)] [--overview-hero-ground:#f6dfb6] [--overview-hero-horizon:#7c91d8] [--overview-hero-sky:#eef1ff]",
  coast: "[--overview-hero-accent:var(--color-route)] [--overview-hero-ground:#fde68a] [--overview-hero-horizon:#38bdf8] [--overview-hero-sky:#e6f8ff]",
  market: "[--overview-hero-accent:var(--color-warning)] [--overview-hero-ground:#fee2b8] [--overview-hero-horizon:#fb7185] [--overview-hero-sky:#fff1df]",
};

export const overviewHeroCopyClassName = "overview-hero-copy relative z-[2] grid min-w-0 max-w-[760px] content-center gap-2";
export const overviewHeroKickerClassName = "overview-hero-kicker w-fit max-w-full overflow-hidden rounded-full border border-[color-mix(in_srgb,var(--overview-hero-accent)_26%,white)] bg-[rgb(255_255_255_/_0.78)] px-2.5 py-1.5 text-xs font-[850] leading-4 text-(--overview-hero-accent) text-ellipsis whitespace-nowrap";
export const overviewHeroTitleClassName = "m-0 text-[28px] font-[900] leading-[34px] text-(--overview-hero-ink) max-[767px]:hidden";
export const overviewHeroRoleClassName = "overview-hero-role m-0 max-w-[620px] text-[15px] font-bold leading-[23px] text-[color-mix(in_srgb,var(--overview-hero-ink)_78%,var(--color-text-muted))] max-[767px]:text-[13px] max-[767px]:leading-5";
export const overviewHeroMetaClassName = "overview-hero-meta mt-0.5 flex flex-wrap gap-1.5 max-[767px]:grid max-[767px]:grid-cols-1 [&_.icon]:text-(--overview-hero-accent) [&_span]:inline-flex [&_span]:min-h-8 [&_span]:min-w-0 [&_span]:max-w-full [&_span]:items-center [&_span]:gap-[7px] [&_span]:rounded-(--radius-sm) [&_span]:border [&_span]:border-[color-mix(in_srgb,var(--overview-hero-accent)_16%,var(--color-border))] [&_span]:bg-[rgb(255_255_255_/_0.78)] [&_span]:px-[9px] [&_span]:py-1.5 [&_span]:text-xs [&_span]:font-extrabold [&_span]:leading-4 [&_span]:text-(--color-text) max-[767px]:[&_span]:overflow-hidden max-[767px]:[&_span]:text-ellipsis max-[767px]:[&_span]:whitespace-nowrap";
export const overviewHeroAsideClassName =
  "overview-hero-aside relative z-[2] grid min-w-0 content-center gap-2 self-center rounded-(--radius-md) border border-[color-mix(in_srgb,var(--overview-hero-accent)_14%,var(--color-border))] bg-[rgb(255_255_255_/_0.76)] p-2.5 shadow-[inset_0_1px_0_rgb(255_255_255_/_0.78)] max-[1199px]:col-auto max-[1199px]:grid-cols-1 max-[1199px]:items-center max-[1199px]:rounded-none max-[1199px]:border-0 max-[1199px]:bg-transparent max-[1199px]:p-0 max-[1199px]:shadow-none [&_.page-current-user]:min-w-0 [&_.page-current-user]:w-full [&_.page-current-user]:border-transparent [&_.page-current-user]:bg-transparent [&_.page-current-user]:shadow-none";
export const overviewHeroSettlementsClassName = "overview-hero-settlements justify-self-stretch rounded-(--radius-sm) border border-[color-mix(in_srgb,var(--overview-hero-accent)_26%,white)] bg-[rgb(255_255_255_/_0.82)] px-2.5 py-1.5 text-center text-xs font-[850] leading-4 text-(--overview-hero-accent)";

export const cockpitCardBaseClassName =
  `overview-cockpit-card relative grid min-h-[96px] min-w-0 content-start gap-2 overflow-hidden border-r border-(--color-border) bg-transparent p-3.5 text-left text-inherit last:border-r-0 [--overview-cockpit-accent:var(--color-primary)] [--overview-cockpit-wash:var(--color-surface-subtle)] ${workspaceResponsivePanelResetClassName} max-[767px]:min-h-[92px] max-[767px]:border-b max-[767px]:p-3 max-[767px]:[&:nth-child(2)]:border-r-0 max-[767px]:last:border-b-0 [&_small]:min-w-0 [&_small]:text-xs [&_small]:font-bold [&_small]:leading-[17px] [&_small]:text-(--color-text-muted) [&_strong]:min-w-0 [&_strong]:text-[22px] [&_strong]:font-black [&_strong]:leading-7 [&_strong]:text-(--color-text)`;
export const cockpitCardButtonClassName = "overview-cockpit-card--button cursor-pointer transition-[background,box-shadow] duration-150 hover:bg-(--overview-cockpit-wash) focus-visible:bg-(--overview-cockpit-wash) focus-visible:shadow-[inset_0_0_0_2px_color-mix(in_srgb,var(--overview-cockpit-accent)_28%,transparent)] focus-visible:outline-none";

export const overviewHighlightBoardClassName =
  `overview-highlight-board col-span-12 min-w-0 max-w-full overflow-hidden rounded-(--radius-lg) border border-(--color-border) bg-(--color-surface) p-3 shadow-[0_1px_0_rgb(15_23_42_/_0.04)] max-[1199px]:col-auto max-[1199px]:mb-0 ${workspaceResponsivePanelResetClassName} max-[767px]:rounded-(--radius-lg) max-[767px]:border max-[767px]:bg-(--color-surface) max-[767px]:shadow-[0_1px_0_rgb(15_23_42_/_0.04)]`;
export const overviewBoardTitleClassName =
  "overview-board-title mb-2.5 flex items-center gap-[9px] text-(--color-text) [&_.icon]:text-(--color-primary) [&_h2]:m-0 [&_h2]:text-[15px] [&_h2]:font-black [&_h2]:leading-[22px] [&_p]:m-0 [&_p]:text-xs [&_p]:font-bold [&_p]:leading-[17px] [&_p]:text-(--color-text-muted)";
export const overviewHighlightListClassName =
  "overview-highlight-list m-0 grid list-none grid-cols-[repeat(4,minmax(150px,1fr))] gap-2.5 p-0 max-[1199px]:grid-cols-3 max-[767px]:flex max-[767px]:overflow-x-auto max-[767px]:overscroll-x-contain max-[767px]:pb-3.5 max-[767px]:snap-x max-[767px]:snap-mandatory max-[767px]:-mx-3 max-[767px]:px-3 [&::-webkit-scrollbar]:hidden";
export const overviewHighlightItemClassName =
  "overview-highlight-item relative grid min-h-[132px] min-w-0 content-end overflow-hidden rounded-(--radius-md) border border-[color-mix(in_srgb,var(--overview-highlight-accent)_16%,white)] bg-[linear-gradient(180deg,transparent_0_30%,rgb(255_255_255_/_0.8)_64%,rgb(255_255_255_/_0.96)),linear-gradient(135deg,var(--overview-highlight-wash),color-mix(in_srgb,var(--overview-highlight-accent)_14%,white))] px-3 pb-3 pt-[64px] [--overview-highlight-accent:#0284c7] [--overview-highlight-wash:#e0f2fe] max-[767px]:min-h-[138px] max-[767px]:w-[224px] max-[767px]:shrink-0 max-[767px]:snap-start [&_small]:relative [&_small]:z-[1] [&_small]:min-w-0 [&_small]:overflow-hidden [&_small]:text-ellipsis [&_small]:whitespace-nowrap [&_small]:text-[11px] [&_small]:font-bold [&_small]:leading-[15px] [&_small]:text-(--color-text-muted) [&_span]:relative [&_span]:z-[1] [&_span]:text-[11px] [&_span]:font-[850] [&_span]:leading-[15px] [&_span]:text-(--overview-highlight-accent) [&_strong]:relative [&_strong]:z-[1] [&_strong]:min-w-0 [&_strong]:text-[13px] [&_strong]:font-black [&_strong]:leading-[18px] [&_strong]:text-(--color-text) [&_strong]:[overflow-wrap:anywhere]";
export const overviewHighlightToneClassNames: Record<DestinationTone, string> = {
  harbor: "[--overview-highlight-accent:var(--color-primary)] [--overview-highlight-wash:var(--color-primary-soft)]",
  city: "[--overview-highlight-accent:var(--color-route)] [--overview-highlight-wash:var(--color-route-soft)]",
  coast: "[--overview-highlight-accent:var(--color-route)] [--overview-highlight-wash:var(--color-route-soft)]",
  market: "[--overview-highlight-accent:var(--color-warning-strong)] [--overview-highlight-wash:var(--color-warning-soft)]",
};

export const tripCompletedClassName = "relative overflow-hidden rounded-(--radius-md) border border-(--color-warning-border) bg-(--color-warning-soft) bg-[image:var(--paper-grain)] bg-[length:120px_120px] p-5 max-[767px]:rounded-(--radius-lg) max-[767px]:p-4";
