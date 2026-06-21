import type { ItineraryItem, Trip } from "@/src/trip/types";
import type { Locale } from "@/src/i18n/types";
import { getTripDates } from "@/src/trip/itinerary";
import { CockpitCard } from "./OverviewCockpitCard";
import {
  overviewCockpitClassName,
  overviewReadinessChipsClassName,
} from "./overview-page.styles";
import { formatOverviewStopSchedule } from "./overview-stop-labels";

interface OverviewCockpitLabels {
  alertSummary: (params: { warnings: number; suggestions: number }) => string;
  budget: string;
  crewReadiness: string;
  dayCount: (params: { count: number }) => string;
  memberCount: (params: { count: number }) => string;
  nextStop: string;
  openExpenses: string;
  settlementSuggestions: (params: { count: number }) => string;
  stopCount: (params: { count: number }) => string;
}

interface OverviewCockpitProps {
  activeMembers: number;
  groupSpendLabel: string;
  itemCount: number;
  labels: OverviewCockpitLabels;
  locale: Locale;
  nextStop: ItineraryItem | undefined;
  onOpenExpenses: () => void;
  pendingSuggestions: number;
  settlementCount: number;
  trip: Trip;
  warningCount: number;
}

export function OverviewCockpit({
  activeMembers,
  groupSpendLabel,
  itemCount,
  labels,
  locale,
  nextStop,
  onOpenExpenses,
  pendingSuggestions,
  settlementCount,
  trip,
  warningCount,
}: OverviewCockpitProps) {
  const tripDays = getTripDates(trip.startDate, trip.endDate);

  return (
    <section className={overviewCockpitClassName} aria-label="travel cockpit">
      <CockpitCard
        icon="route"
        label={labels.nextStop}
        value={nextStop?.place ?? trip.destinationLabel}
        detail={nextStop ? formatOverviewStopSchedule(nextStop, trip.startDate, locale) : labels.stopCount({ count: itemCount })}
      />
      <CockpitCard
        icon="wallet"
        label={labels.budget}
        ariaLabel={labels.openExpenses}
        value={groupSpendLabel}
        detail={labels.settlementSuggestions({ count: settlementCount })}
        onClick={onOpenExpenses}
      />
      <CockpitCard
        icon="users"
        label={labels.crewReadiness}
        value={labels.memberCount({ count: activeMembers })}
        detail={(
          <span className={overviewReadinessChipsClassName}>
            <span>{labels.dayCount({ count: tripDays.length })}</span>
            <span>{labels.alertSummary({ warnings: warningCount, suggestions: pendingSuggestions })}</span>
          </span>
        )}
      />
    </section>
  );
}
