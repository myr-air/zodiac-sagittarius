import Image from "next/image";
import { type ReactNode } from "react";
import type { ItineraryItem, Trip, TripTask } from "@/src/trip/types";
import type { Locale } from "@/src/i18n/types";
import { cn } from "@/src/lib/cn";
import { getTripDates, formatDayLabel } from "@/src/trip/itinerary";
import { Icon } from "@/src/ui/icons";
import { useI18n } from "@/src/i18n/I18nProvider";
import type { DestinationVisual } from "@/src/features/itinerary/domain";
import { getHighlightImage, highlightTone, viewerNextStopDetail } from "@/src/features/itinerary/domain";

const overviewStopListClassName = "overview-stop-list m-0 grid list-none gap-2 p-0 [&_li]:grid [&_li]:gap-[3px] [&_li]:rounded-(--radius-sm) [&_li]:border [&_li]:border-(--color-border) [&_li]:bg-(--color-surface-subtle) [&_li]:px-3 [&_li]:py-2.5 [&_small]:text-xs [&_small]:font-bold [&_small]:leading-4 [&_small]:text-(--color-text-muted) [&_span]:text-xs [&_span]:font-bold [&_span]:leading-4 [&_span]:text-(--color-text-muted) [&_strong]:text-sm [&_strong]:font-extrabold [&_strong]:leading-5 [&_strong]:text-(--color-text)";
const overviewFocusListClassName = "overview-focus-list m-0 mt-2 grid list-none gap-1.5 p-0 [&_li]:flex [&_li]:flex-wrap [&_li]:items-center [&_li]:gap-x-2.5 [&_li]:gap-y-1.5 [&_li]:border-t [&_li]:border-(--color-border) [&_li]:pt-2 [&_span]:text-xs [&_span]:font-bold [&_span]:leading-4 [&_span]:text-(--color-text-muted) [&_strong]:text-[13px] [&_strong]:font-extrabold [&_strong]:leading-[18px] [&_strong]:text-(--color-text)";
const overviewMutedClassName = "overview-muted text-xs font-bold text-(--color-text-muted)";
const overviewNextStopClassName = "overview-next-stop grid gap-[5px] [&_p]:m-0 [&_p]:mt-1 [&_p]:text-[13px] [&_p]:leading-5 [&_p]:text-(--color-text-muted) [&_span]:text-xs [&_span]:font-bold [&_span]:text-(--color-text-muted) [&_strong]:text-xl [&_strong]:font-extrabold [&_strong]:leading-7 [&_strong]:text-(--color-text)";

const tripCompletedClassName = "relative overflow-hidden rounded-(--radius-md) border border-(--color-warning-border) bg-(--color-warning-soft) bg-[image:var(--paper-grain)] bg-[length:120px_120px] p-5";
const overviewTaskMetaClassName = "overview-task-meta inline-flex flex-wrap justify-end gap-1.5";
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

const cockpitCardBaseClassName = "overview-cockpit-card relative grid min-h-[126px] min-w-0 content-start gap-2 overflow-hidden rounded-(--radius-lg) border border-[color-mix(in_srgb,var(--overview-cockpit-accent)_16%,var(--color-border))] bg-[linear-gradient(150deg,var(--color-surface)_0%,var(--overview-cockpit-wash)_100%)] p-3.5 text-left text-inherit shadow-[inset_0_1px_0_rgb(255_255_255_/_0.72)] [--overview-cockpit-accent:var(--color-primary)] [--overview-cockpit-wash:var(--color-surface-subtle)] max-[1199px]:rounded-none max-[1199px]:border-x-0 max-[1199px]:border-t-0 max-[1199px]:shadow-none max-[767px]:min-h-[104px] [&_small]:min-w-0 [&_small]:text-xs [&_small]:font-bold [&_small]:leading-[17px] [&_small]:text-(--color-text-muted) [&_strong]:min-w-0 [&_strong]:text-[22px] [&_strong]:font-black [&_strong]:leading-7 [&_strong]:text-(--color-text)";
const cockpitCardButtonClassName = "overview-cockpit-card--button cursor-pointer transition-[border-color,box-shadow,transform] duration-150 hover:-translate-y-px hover:border-(--overview-cockpit-accent) hover:shadow-[0_4px_8px_rgb(15_23_42_/_0.06)] focus-visible:-translate-y-px focus-visible:border-(--overview-cockpit-accent) focus-visible:shadow-[0_0_0_3px_rgb(15_118_110_/_0.16)] focus-visible:outline-none";

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

export function ViewerNextStopPanel({
  item,
  startDate,
  locale,
  emptyMessage,
  detailFallback,
}: {
  item: ItineraryItem | undefined;
  startDate: string;
  locale: Locale;
  emptyMessage: string;
  detailFallback: string;
}) {
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

interface TaskAssigneeLabels {
  private: string;
  shared: string;
  tripMember: string;
  unassigned: string;
}

export function OverviewStopList({ items, startDate, locale, emptyMessage }: { items: ItineraryItem[]; startDate: string; locale: Locale; emptyMessage: string }) {
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

export function OverviewFocusList({ items, startDate, locale, label }: { items: ItineraryItem[]; startDate: string; locale: Locale; label: string }) {
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

export function TripCompletedPostcard({ trip, items, groupSpendLabel, locale }: { trip: Trip; items: ItineraryItem[]; groupSpendLabel: string; locale: Locale }) {
  const dayCount = getTripDates(trip.startDate, trip.endDate).length;
  const stopCount = items.length;

  return (
    <div className={tripCompletedClassName}>
      <div className="absolute top-4 right-4 flex h-14 w-12 rotate-[6deg] select-none flex-col items-center justify-center rounded-(--radius-sm) border-2 border-dashed border-(--color-warning-border) opacity-70">
        <Icon name="location" className="size-5 text-(--color-warning-strong)" />
        <span className="mt-0.5 font-mono text-[7px] font-black uppercase tracking-normal text-(--color-warning-strong)">Joii Map</span>
      </div>

      <div className="flex max-w-[85%] flex-col gap-2.5">
        <strong className="flex items-center gap-1.5 text-base font-extrabold leading-tight text-(--color-text)">
          <Icon name="calendar" className="size-4.5 text-(--color-warning-strong)" />
          {locale === "th" ? "ขอบคุณสำหรับการเดินทาง!" : "Thank you for traveling!"}
        </strong>
        <p className="m-0 text-xs font-bold leading-relaxed text-(--color-text-muted)">
          {locale === "th"
            ? `ทริป ${trip.name} ได้เสร็จสิ้นลงแล้วอย่างสมบูรณ์แบบ หวังว่าคุณจะได้รับความทรงจำและมิตรภาพที่ยอดเยี่ยมระหว่างเดินทาง!`
            : `The ${trip.name} has completed. Hope this journey left you with beautiful memories and meaningful connections!`}
        </p>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2 border-t border-(--color-warning-border) pt-4 text-center">
        <div className="flex flex-col gap-0.5">
          <span className="text-[10px] font-extrabold uppercase tracking-normal text-(--color-warning-strong)">{locale === "th" ? "ระยะเวลา" : "Duration"}</span>
          <strong className="text-lg font-black text-(--color-text)">{dayCount} {locale === "th" ? "วัน" : "Days"}</strong>
        </div>
        <div className="flex flex-col gap-0.5 border-x border-(--color-warning-border)">
          <span className="text-[10px] font-extrabold uppercase tracking-normal text-(--color-warning-strong)">{locale === "th" ? "สถานที่เช็คอิน" : "Places Visited"}</span>
          <strong className="text-lg font-black text-(--color-text)">{stopCount} {locale === "th" ? "จุด" : "Stops"}</strong>
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-[10px] font-extrabold uppercase tracking-normal text-(--color-warning-strong)">{locale === "th" ? "ยอดใช้จ่ายรวม" : "Total Budget"}</span>
          <strong className="text-lg font-black text-(--color-text)">{groupSpendLabel}</strong>
        </div>
      </div>
    </div>
  );
}

export function TaskAssigneeBadge({ task, trip, labels }: { task: TripTask; trip: Trip; labels: TaskAssigneeLabels }) {
  const isPrivate = task.visibility === "private";
  const member = task.assigneeId ? trip.members.find((m) => m.id === task.assigneeId) : null;
  const name = member?.displayName ?? labels.tripMember;
  const color = member?.color ?? "var(--color-text-subtle)";
  const initial = name.slice(0, 1).toUpperCase();

  return (
    <div className={overviewTaskMetaClassName}>
      <small className={cn(
        "inline-flex items-center rounded-sm border px-1.5 py-0.5 text-[10px] font-bold",
        isPrivate
          ? "border-(--color-primary-border) bg-(--color-primary-soft) text-(--color-primary-strong)"
          : "border-(--color-route-border) bg-(--color-route-soft) text-(--color-route)",
      )}>
        {isPrivate ? labels.private : labels.shared}
      </small>

      {task.visibility !== "private" && (
        task.assigneeId ? (
          <div className="inline-flex items-center gap-1">
            <span
              className="flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full text-[9px] font-black text-white"
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
          <small className="inline-flex items-center rounded-sm border border-(--color-border) bg-(--color-surface-subtle) px-1.5 py-0.5 text-[10px] font-bold text-(--color-text-muted)">
            {labels.unassigned}
          </small>
        )
      )}
    </div>
  );
}

export function OverviewHero({
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
            countdown.type === "completed" && "bg-(--color-surface-muted) text-(--color-text-muted) border-(--color-border)",
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

interface CockpitCardProps {
  icon: "calendar" | "location" | "users" | "wallet" | "route" | "check";
  label: string;
  ariaLabel?: string;
  value: string;
  detail: ReactNode;
  onClick?: () => void;
}

export function CockpitCard({ icon, label, ariaLabel, value, detail, onClick }: CockpitCardProps) {
  const iconColors = {
    route: "border border-(--color-route-border) bg-(--color-route-soft) text-(--color-route)",
    wallet: "border border-(--color-warning-border) bg-(--color-warning-soft) text-(--color-warning-strong)",
    users: "border border-(--color-route-border) bg-(--color-route-soft) text-(--color-route)",
    calendar: "border border-(--color-primary-border) bg-(--color-primary-soft) text-(--color-primary-strong)",
    location: "border border-(--color-primary-border) bg-(--color-primary-soft) text-(--color-primary-strong)",
    check: "border border-(--color-success-border) bg-(--color-success-soft) text-(--color-success)",
  }[icon] || "border border-(--color-border) bg-(--color-surface-subtle) text-(--color-text-muted)";
  const cardTone = {
    route: "[--overview-cockpit-accent:var(--color-route)] [--overview-cockpit-wash:var(--color-route-soft)]",
    wallet: "[--overview-cockpit-accent:var(--color-warning-strong)] [--overview-cockpit-wash:var(--color-warning-soft)]",
    users: "[--overview-cockpit-accent:var(--color-primary)] [--overview-cockpit-wash:var(--color-primary-soft)]",
    calendar: "[--overview-cockpit-accent:var(--color-primary)] [--overview-cockpit-wash:var(--color-primary-soft)]",
    location: "[--overview-cockpit-accent:var(--color-route)] [--overview-cockpit-wash:var(--color-route-soft)]",
    check: "[--overview-cockpit-accent:var(--color-success)] [--overview-cockpit-wash:var(--color-success-soft)]",
  }[icon] || "";

  const content = (
    <div className="flex flex-col gap-2 w-full">
      <div className="flex items-center gap-2">
        <div className={cn("flex size-8 shrink-0 items-center justify-center rounded-full", iconColors)}>
          <Icon name={icon} className="size-4" />
        </div>
        <span className="text-[11px] font-extrabold uppercase tracking-normal text-(--color-text-muted)">
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
        className={cn(cockpitCardBaseClassName, cardTone, cockpitCardButtonClassName, "active:translate-y-px")}
        type="button"
        aria-label={ariaLabel}
        onClick={onClick}
      >
        {content}
      </button>
    );
  }

  return (
    <div className={cn(cockpitCardBaseClassName, cardTone)}>
      {content}
    </div>
  );
}

export function HighlightBoard({ items, startDate, locale, emptyMessage, title, subtitle }: { items: ItineraryItem[]; startDate: string; locale: Locale; emptyMessage: string; title: string; subtitle: string }) {
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
                  imgUrl && "border-(--color-border-strong) bg-(--color-text)",
                  "group cursor-pointer transition-[border-color,box-shadow,transform] duration-150 hover:-translate-y-0.5 hover:border-(--color-primary-border)",
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
                    <div className="absolute inset-0 z-[1] bg-[linear-gradient(180deg,rgb(15_23_42_/_0.12),rgb(15_23_42_/_0.82))]" />
                  </>
                )}
                <span className={cn("relative z-10 mb-1 text-[11px] font-bold uppercase tracking-normal", imgUrl ? "text-white/82" : "text-(--overview-highlight-accent)")}>
                  {formatDayLabel(item.day, startDate, locale)} · {item.startTime}
                </span>
                <strong className={cn("relative z-10 mb-0.5 text-sm font-black leading-snug [overflow-wrap:anywhere]", imgUrl ? "text-white" : "text-(--color-text)")}>
                  {item.activity}
                </strong>
                <small className={cn("relative z-10 overflow-hidden text-ellipsis whitespace-nowrap text-[11px] font-bold", imgUrl ? "text-white/78" : "text-(--color-text-muted)")}>
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
