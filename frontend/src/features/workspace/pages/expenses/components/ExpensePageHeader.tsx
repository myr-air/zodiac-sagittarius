import type { Messages } from "@/src/i18n/messages";
import type { Locale } from "@/src/i18n/types";
import {
  formatTripRange,
  PageHeader,
  PageHeaderMetaItem,
} from "@/src/shared/components/page-header";
import { TravelMotif } from "@/src/shared/components/travel-motifs";
import type { Trip } from "@/src/trip/types";

interface ExpensePageHeaderProps {
  canEditExpenses: boolean;
  locale: Locale;
  t: Messages;
  trip: Trip;
}

export function ExpensePageHeader({
  canEditExpenses,
  locale,
  t,
  trip,
}: ExpensePageHeaderProps) {
  return (
    <PageHeader
      title={t.expenses.title}
      subtitle={trip.name}
      meta={(
        <>
          <PageHeaderMetaItem icon="calendar">{formatTripRange(trip.startDate, trip.endDate, locale)}</PageHeaderMetaItem>
          <PageHeaderMetaItem icon="users">{t.dates.memberCount({ count: trip.members.length })}</PageHeaderMetaItem>
          <PageHeaderMetaItem icon="wallet">{canEditExpenses ? t.expenses.canEdit : t.expenses.readOnly}</PageHeaderMetaItem>
        </>
      )}
      motif={<TravelMotif tone="route" />}
    />
  );
}
