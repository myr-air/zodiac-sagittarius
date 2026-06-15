import type { ReactNode } from "react";
import type { Locale } from "@/src/i18n/types";
import { cn } from "@/src/lib/cn";

interface PageHeaderProps {
  allowOverflow?: boolean;
  eyebrow?: string;
  title: string;
  subtitle?: string;
  description?: string;
  meta?: ReactNode;
  aside?: ReactNode;
  motif?: ReactNode;
}

const pageHeaderClassName = "page-header relative isolate mb-3 flex min-h-[92px] min-w-0 items-center justify-between justify-self-stretch gap-4 rounded-(--radius-md) border border-(--color-border) bg-(--color-surface) px-4 py-3.5 shadow-[0_1px_0_rgb(15_23_42_/_0.04)] max-[1199px]:mb-0 max-[1199px]:min-h-[88px] max-[1199px]:flex-col max-[1199px]:items-start max-[1199px]:rounded-none max-[1199px]:border-x-0 max-[1199px]:border-t-0 max-[1199px]:px-4 max-[1199px]:shadow-none max-[767px]:hidden";
const pageHeaderCopyClassName = "page-header-copy relative z-[1] grid min-w-0 gap-1";
const eyebrowClassName = "eyebrow m-0 inline-flex w-fit items-center rounded-full border border-(--color-primary-border) bg-(--color-primary-soft) px-2.5 py-0.5 text-xs font-black leading-4 text-(--color-primary-strong)";
const titleClassName = "m-0 text-[24px] font-black leading-[31px] text-(--color-text) [text-wrap:balance] max-[1199px]:text-[21px] max-[1199px]:leading-[28px]";
const subtitleClassName = "m-0 text-sm font-bold leading-5 text-(--color-text-muted) max-[767px]:hidden";
const descriptionClassName = "page-header-description m-0 max-w-[560px] text-[13px] font-semibold leading-5 text-(--color-text-muted) max-[767px]:hidden";
const metaClassName = "page-header-meta mt-1.5 inline-flex flex-wrap gap-1.5 text-xs font-extrabold text-(--color-text-muted) [&_.icon]:size-3.5 [&_.icon]:text-(--color-primary-strong) [&>span]:inline-flex [&>span]:min-h-7 [&>span]:items-center [&>span]:gap-1.5 [&>span]:rounded-(--radius-sm) [&>span]:border [&>span]:border-(--color-border) [&>span]:bg-(--color-surface-subtle) [&>span]:px-2.5 [&>span]:py-1 max-[767px]:mt-1 max-[767px]:flex-nowrap max-[767px]:gap-1.5 max-[767px]:overflow-x-auto max-[767px]:pb-0.5 max-[767px]:[scrollbar-width:none] max-[767px]:[&::-webkit-scrollbar]:hidden max-[767px]:[&>span]:min-h-6 max-[767px]:[&>span]:shrink-0 max-[767px]:[&>span]:rounded-none max-[767px]:[&>span]:border-0 max-[767px]:[&>span]:bg-transparent max-[767px]:[&>span]:px-0 max-[767px]:[&>span]:text-[11px]";
const motifClassName = "page-header-motif relative z-[1] grid max-w-44 flex-none place-items-center opacity-90 max-[1199px]:hidden";
const userCardClassName = "page-current-user relative z-[1] grid min-w-[220px] grid-cols-[34px_minmax(0,1fr)] items-center gap-2.5 rounded-(--radius-sm) border border-(--color-border) bg-(--color-surface-subtle) px-2.5 py-2 max-[1199px]:w-full max-[1199px]:min-w-0";
const userAvatarClassName = "person-avatar !size-[34px]";
const userCopyClassName = "grid min-w-0 gap-0";
const userNameClassName = "overflow-hidden text-ellipsis whitespace-nowrap text-[13px] font-extrabold leading-[18px] text-(--color-text)";
const userLabelClassName = "text-xs text-(--color-text-muted)";

export function PageHeader({ allowOverflow = false, eyebrow, title, subtitle, description, meta, aside, motif }: PageHeaderProps) {
  return (
    <header className={cn(pageHeaderClassName, allowOverflow ? "z-[40] overflow-visible" : "overflow-hidden")}>
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
