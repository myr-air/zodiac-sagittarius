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
import {
  cockpitCardBaseClassName,
  cockpitCardButtonClassName,
  overviewBoardTitleClassName,
  overviewFocusListClassName,
  overviewHeroAsideClassName,
  overviewHeroBaseClassName,
  overviewHeroCopyClassName,
  overviewHeroKickerClassName,
  overviewHeroMetaClassName,
  overviewHeroRoleClassName,
  overviewHeroSettlementsClassName,
  overviewHeroToneClassNames,
  overviewHighlightBoardClassName,
  overviewHighlightItemClassName,
  overviewHighlightListClassName,
  overviewHighlightToneClassNames,
  overviewMutedClassName,
  overviewNextStopClassName,
  overviewHeroTitleClassName,
  overviewStopListClassName,
  overviewTaskMetaClassName,
  tripCompletedClassName,
} from "./overview.styles";

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
