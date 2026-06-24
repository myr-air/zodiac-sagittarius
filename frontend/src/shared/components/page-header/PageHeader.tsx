import type { ReactNode } from "react";
import { cn } from "@/src/lib/cn";
import type { Locale } from "@/src/i18n/types";
import { PersonAvatar } from "@/src/shared/components/person-avatar";
import { Icon, type IconName } from "@/src/ui/icons";
import { formatTripRange } from "./page-header-date";
import {
  descriptionClassName,
  eyebrowClassName,
  metaClassName,
  motifClassName,
  pageHeaderAsideClassName,
  pageHeaderClassName,
  pageHeaderCopyClassName,
  pageHeaderWithAsideClassName,
  pageHeaderWithoutAsideClassName,
  subtitleClassName,
  titleClassName,
  userAvatarClassName,
  userCardClassName,
  userCopyClassName,
  userLabelClassName,
  userNameClassName,
} from "./PageHeader.styles";

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

export function PageHeader({ allowOverflow = false, eyebrow, title, subtitle, description, meta, aside, motif }: PageHeaderProps) {
  return (
    <header className={cn(pageHeaderClassName, aside ? pageHeaderWithAsideClassName : pageHeaderWithoutAsideClassName, allowOverflow ? "z-[40] overflow-visible" : "overflow-hidden")}>
      <div className={pageHeaderCopyClassName}>
        {eyebrow ? <p className={eyebrowClassName}>{eyebrow}</p> : null}
        <h1 className={titleClassName}>{title}</h1>
        {subtitle ? <h2 className={subtitleClassName}>{subtitle}</h2> : null}
        {description ? <p className={descriptionClassName}>{description}</p> : null}
        {meta ? <div className={metaClassName}>{meta}</div> : null}
      </div>
      {motif ? <div className={motifClassName}>{motif}</div> : null}
      {aside ? <div className={pageHeaderAsideClassName}>{aside}</div> : null}
    </header>
  );
}

interface PageHeaderMetaItemProps {
  children: ReactNode;
  icon: IconName;
}

export function PageHeaderMetaItem({ children, icon }: PageHeaderMetaItemProps) {
  return (
    <span>
      <Icon name={icon} /> {children}
    </span>
  );
}

interface PageHeaderTripDateMetaItemProps {
  endDate: string;
  locale?: Locale;
  startDate: string;
}

export function PageHeaderTripDateMetaItem({
  endDate,
  locale,
  startDate,
}: PageHeaderTripDateMetaItemProps) {
  return (
    <PageHeaderMetaItem icon="calendar">
      {formatTripRange(startDate, endDate, locale)}
    </PageHeaderMetaItem>
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
      <PersonAvatar className={userAvatarClassName} color={color} name={name} />
      <div className={userCopyClassName}>
        <strong className={userNameClassName}>{name}</strong>
        <span className={userLabelClassName}>{label}</span>
      </div>
    </div>
  );
}
