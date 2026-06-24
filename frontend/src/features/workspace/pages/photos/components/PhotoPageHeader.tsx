import type { Locale } from "@/src/i18n/types";
import {
  formatTripRange,
  PageHeader,
} from "@/src/shared/components/page-header";
import { Icon } from "@/src/ui/icons";
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
          <span>
            <Icon name="calendar" />{" "}
            {formatTripRange(tripStartDate, tripEndDate, locale)}
          </span>
          <span>
            <Icon name="cloud" /> {copy.albumLinks(albumCount)}
          </span>
        </>
      }
    />
  );
}
