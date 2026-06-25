import type { Locale } from "@/src/i18n/types";
import { formatTripRange } from "@/src/shared/components/page-header";
import { Icon } from "@/src/ui/icons";

interface MemberPageHeaderProps {
  locale: Locale;
  memberCountLabel: string;
  subtitle: string;
  title: string;
  tripEndDate: string;
  tripStartDate: string;
}

export function MemberPageHeader({
  locale,
  memberCountLabel,
  subtitle,
  title,
  tripEndDate,
  tripStartDate,
}: MemberPageHeaderProps) {
  return (
    <header className="members-page-header flex flex-wrap items-end justify-between gap-3 rounded-(--radius-lg) border border-(--color-border) bg-(--color-surface) px-4 py-3 max-[1199px]:rounded-none max-[1199px]:border-x-0 max-[1199px]:border-t-0">
      <div className="grid min-w-0 gap-0.5">
        <h1 className="m-0 text-2xl font-black leading-8 text-(--color-text) max-[767px]:text-xl">
          {title}
        </h1>
        <span className="truncate text-sm font-extrabold text-(--color-text-muted)">
          {subtitle}
        </span>
      </div>
      <div className="flex flex-wrap items-center gap-1.5 text-xs font-extrabold text-(--color-text-muted)">
        <span className="inline-flex min-h-8 items-center gap-1.5 rounded-(--radius-sm) border border-(--color-border) bg-(--color-surface-subtle) px-2.5">
          <Icon name="calendar" /> {formatTripRange(tripStartDate, tripEndDate, locale)}
        </span>
        <span className="inline-flex min-h-8 items-center gap-1.5 rounded-(--radius-sm) border border-(--color-border) bg-(--color-surface-subtle) px-2.5">
          <Icon name="users" /> {memberCountLabel}
        </span>
      </div>
    </header>
  );
}
