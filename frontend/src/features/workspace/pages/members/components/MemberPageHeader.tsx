import {
  formatTripRange,
  PageHeader,
} from "@/src/shared/components/page-header";
import { TravelMotif } from "@/src/shared/components/travel-motifs";
import { Icon } from "@/src/ui/icons";
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
          <span>
            <Icon name="calendar" />{" "}
            {formatTripRange(tripStartDate, tripEndDate, locale)}
          </span>
          <span>
            <Icon name="users" /> {memberCountLabel}
          </span>
        </>
      }
      motif={<TravelMotif tone="sunshine" />}
    />
  );
}
