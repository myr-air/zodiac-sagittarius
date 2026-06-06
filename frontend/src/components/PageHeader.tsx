import type { ReactNode } from "react";
import type { Locale } from "@/src/i18n/types";

interface PageHeaderProps {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  description?: string;
  meta?: ReactNode;
  aside?: ReactNode;
  motif?: ReactNode;
}

const pageHeaderClassName = "page-header relative flex min-h-[126px] min-w-0 items-center justify-between justify-self-stretch gap-6 overflow-hidden rounded-(--radius-md) border border-(--color-border) bg-(--color-surface) bg-[image:var(--watercolor-surface-wash),var(--paper-grain)] bg-[length:auto,120px_120px] px-6 py-[22px] shadow-[0_12px_30px_rgb(15_23_42_/_0.04)] mb-[18px] max-[1199px]:items-start max-[1199px]:flex-col";
const pageHeaderCopyClassName = "page-header-copy relative z-[1] grid min-w-0 gap-[5px]";
const eyebrowClassName = "eyebrow m-0 mb-[5px] text-xs font-black uppercase leading-4 text-(--color-primary-strong)";
const titleClassName = "m-0 text-[30px] font-black leading-[38px] text-(--color-text) max-[1199px]:text-[22px] max-[1199px]:leading-[30px]";
const subtitleClassName = "m-0 text-sm font-bold leading-5 text-(--color-text-muted)";
const descriptionClassName = "page-header-description m-0 max-w-[560px] text-[13px] font-semibold leading-5 text-(--color-text-muted)";
const metaClassName = "page-header-meta mt-2 inline-flex flex-wrap gap-2 text-xs font-extrabold text-(--color-text-muted) [&_.icon]:text-(--color-text-muted) [&>span]:inline-flex [&>span]:min-h-7 [&>span]:items-center [&>span]:gap-1.5 [&>span]:rounded-(--radius-sm) [&>span]:border [&>span]:border-(--color-border) [&>span]:bg-(--color-surface-subtle) [&>span]:px-[9px] [&>span]:py-1";
const motifClassName = "page-header-motif relative z-[1] grid max-w-60 flex-none place-items-center max-[1199px]:hidden";
const userCardClassName = "page-current-user relative z-[1] grid min-w-[252px] grid-cols-[40px_minmax(0,1fr)] items-center gap-3 rounded-(--radius-md) border border-(--color-border) bg-[linear-gradient(135deg,rgb(255_255_255_/_0.82),rgb(248_250_252_/_0.86)),var(--paper-grain),var(--color-surface-subtle)] bg-[length:auto,120px_120px,auto] px-3.5 py-[13px] max-[1199px]:w-full max-[1199px]:min-w-0";
const userAvatarClassName = "person-avatar !size-10";
const userCopyClassName = "grid min-w-0 gap-0.5";
const userNameClassName = "overflow-hidden text-ellipsis whitespace-nowrap text-[13px] font-extrabold leading-[18px] text-(--color-text)";
const userLabelClassName = "text-xs text-(--color-text-muted)";

export function PageHeader({ eyebrow, title, subtitle, description, meta, aside, motif }: PageHeaderProps) {
  return (
    <header className={pageHeaderClassName}>
      <div className={pageHeaderCopyClassName}>
        {eyebrow ? <p className={eyebrowClassName}>{eyebrow}</p> : null}
        <h1 className={titleClassName}>{title}</h1>
        {subtitle ? <h2 className={subtitleClassName}>{subtitle}</h2> : null}
        {description ? <p className={descriptionClassName}>{description}</p> : null}
        {meta ? <div className={metaClassName}>{meta}</div> : null}
      </div>
      {motif ? <div className={motifClassName}>{motif}</div> : null}
      {aside}
    </header>
  );
}

interface PageUserCardProps {
  color: string;
  label: string;
  name: string;
}

export function PageUserCard({ color, label, name }: PageUserCardProps) {
  return (
    <div className={userCardClassName}>
      <span className={userAvatarClassName} style={{ backgroundColor: color }} aria-hidden="true">
        {name.slice(0, 1)}
      </span>
      <div className={userCopyClassName}>
        <strong className={userNameClassName}>{name}</strong>
        <span className={userLabelClassName}>{label}</span>
      </div>
    </div>
  );
}

export function formatTripRange(startDate: string, endDate: string, locale: Locale = "en"): string {
  const start = new Date(`${startDate}T00:00:00.000Z`);
  const end = new Date(`${endDate}T00:00:00.000Z`);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return `${startDate} – ${endDate}`;
  }

  if (locale === "th") {
    if (start.getFullYear() !== end.getFullYear()) {
      return `${start.getUTCDate()} ${formatThaiMonth(start)} ${start.getUTCFullYear()} – ${end.getUTCDate()} ${formatThaiMonth(end)} ${end.getUTCFullYear()}`;
    }
    if (start.getUTCMonth() !== end.getUTCMonth()) {
      return `${start.getUTCDate()} ${formatThaiMonth(start)} – ${end.getUTCDate()} ${formatThaiMonth(end)} ${end.getUTCFullYear()}`;
    }
    return `${start.getUTCDate()}–${end.getUTCDate()} ${formatThaiMonth(end)} ${end.getUTCFullYear()}`;
  }

  const monthDay = new Intl.DateTimeFormat("en-US", { day: "numeric", month: "short", timeZone: "UTC" });
  if (start.getUTCFullYear() !== end.getUTCFullYear()) {
    return `${monthDay.format(start)}, ${start.getUTCFullYear()} – ${monthDay.format(end)}, ${end.getUTCFullYear()}`;
  }
  if (start.getUTCMonth() !== end.getUTCMonth()) {
    return `${monthDay.format(start)} – ${monthDay.format(end)}, ${end.getUTCFullYear()}`;
  }
  return `${new Intl.DateTimeFormat("en-US", { month: "short", timeZone: "UTC" }).format(end)} ${start.getUTCDate()}–${end.getUTCDate()}, ${end.getUTCFullYear()}`;
}

function formatThaiMonth(date: Date): string {
  const months = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];
  return months[date.getUTCMonth()] ?? "";
}
