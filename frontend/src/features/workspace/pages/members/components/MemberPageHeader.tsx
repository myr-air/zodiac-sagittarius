import {
  formatTripRange,
  PageHeader,
  PageHeaderMetaItem,
} from "@/src/shared/components/page-header";
import { TravelMotif } from "@/src/shared/components/travel-motifs";
import type { Locale } from "@/src/i18n/types";

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
      title={title}
      subtitle={subtitle}
      meta={
        <>
          <PageHeaderMetaItem icon="calendar">
            {formatTripRange(tripStartDate, tripEndDate, locale)}
          </PageHeaderMetaItem>
          <PageHeaderMetaItem icon="users">{memberCountLabel}</PageHeaderMetaItem>
        </>
      }
      motif={<TravelMotif tone="sunshine" />}
    />
  );
}
