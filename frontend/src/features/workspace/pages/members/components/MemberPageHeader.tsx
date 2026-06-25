import type { Locale } from "@/src/i18n/types";
import {
  PageHeader,
  PageHeaderMetaItem,
  PageHeaderTripDateMetaItem,
} from "@/src/shared/components/page-header";

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
    <PageHeader
      className="members-page-header"
      variant="compact"
      title={title}
      subtitle={subtitle}
      meta={(
        <>
          <PageHeaderTripDateMetaItem
            startDate={tripStartDate}
            endDate={tripEndDate}
            locale={locale}
          />
          <PageHeaderMetaItem icon="users">{memberCountLabel}</PageHeaderMetaItem>
        </>
      )}
    />
  );
}
