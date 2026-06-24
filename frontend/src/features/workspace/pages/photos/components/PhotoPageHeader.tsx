import type { Locale } from "@/src/i18n/types";
import {
  formatTripRange,
  PageHeader,
  PageHeaderMetaItem,
} from "@/src/shared/components/page-header";
import type { PhotoCopy } from "../content/TripPhotosPage.copy";

interface PhotoPageHeaderProps {
  albumCount: number;
  copy: PhotoCopy;
  locale: Locale;
  tripEndDate: string;
  tripName: string;
  tripStartDate: string;
}

export function PhotoPageHeader({
  albumCount,
  copy,
  locale,
  tripEndDate,
  tripName,
  tripStartDate,
}: PhotoPageHeaderProps) {
  return (
    <PageHeader
      title={copy.title}
      subtitle={tripName}
      meta={
        <>
          <PageHeaderMetaItem icon="calendar">
            {formatTripRange(tripStartDate, tripEndDate, locale)}
          </PageHeaderMetaItem>
          <PageHeaderMetaItem icon="cloud">{copy.albumLinks(albumCount)}</PageHeaderMetaItem>
        </>
      }
    />
  );
}
