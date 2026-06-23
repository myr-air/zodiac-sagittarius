import type { Messages } from "@/src/i18n/messages";
import type { Locale } from "@/src/i18n/types";
import { formatTripRange, PageHeader } from "@/src/shared/components/page-header";
import { TravelMotif } from "@/src/shared/components/travel-motifs";
import type { Trip } from "@/src/trip/types";
import { Icon } from "@/src/ui/icons";

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
          <span><Icon name="calendar" /> {formatTripRange(trip.startDate, trip.endDate, locale)}</span>
          <span><Icon name="users" /> {t.dates.memberCount({ count: trip.members.length })}</span>
          <span><Icon name="wallet" /> {canEditExpenses ? t.expenses.canEdit : t.expenses.readOnly}</span>
        </>
      )}
      motif={<TravelMotif tone="route" />}
    />
  );
}
