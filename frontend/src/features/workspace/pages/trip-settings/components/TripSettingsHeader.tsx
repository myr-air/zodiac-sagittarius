import {
  PageHeader,
  PageHeaderMetaItem,
  PageHeaderTripDateMetaItem,
} from "@/src/shared/components/page-header";
import type { Locale } from "@/src/i18n/types";

interface TripSettingsHeaderProps {
  description: string;
  locale: Locale;
  memberCountLabel: string;
  roleLabel: string;
  subtitle: string;
  title: string;
  tripEndDate: string;
  tripStartDate: string;
}

export function TripSettingsHeader({
  description,
  locale,
  memberCountLabel,
  roleLabel,
  subtitle,
  title,
  tripEndDate,
  tripStartDate,
}: TripSettingsHeaderProps) {
  return (
    <PageHeader
      className="trip-settings-header"
      variant="compact"
      title={title}
      subtitle={subtitle}
      description={description}
      meta={(
        <>
          <PageHeaderTripDateMetaItem
            startDate={tripStartDate}
            endDate={tripEndDate}
            locale={locale}
          />
          <PageHeaderMetaItem icon="users">{memberCountLabel}</PageHeaderMetaItem>
          <PageHeaderMetaItem icon="settings">{roleLabel}</PageHeaderMetaItem>
        </>
      )}
    />
  );
}
