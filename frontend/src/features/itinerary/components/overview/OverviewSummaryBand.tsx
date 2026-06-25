import type { ReactNode } from "react";
import type {
  DailyBriefingOverrides,
  ItineraryItem,
  Trip,
  TripDailyBriefing,
} from "@/src/trip/types";
import { useI18n } from "@/src/i18n/I18nProvider";
import { formatTripRange } from "@/src/shared/components/page-header";
import type { OverviewRoleLens } from "@/src/features/itinerary/domain/overview";
import { OverviewHero, type OverviewHeroProps } from "./OverviewHero";
import { OverviewCockpit } from "./OverviewCockpit";
import { OverviewWeatherBriefing } from "./OverviewWeatherBriefing";
import {
  overviewSummaryBentoClassName,
  overviewWeatherBentoClassName,
} from "./overview-page.styles";

interface OverviewSummaryBandProps {
  activeMembers: number;
  countdown: OverviewHeroProps["countdown"];
  currentMemberCard: ReactNode;
  dailyBriefings: TripDailyBriefing[];
  groupSpendLabel: string;
  heroVisual: OverviewHeroProps["visual"];
  isManagerLens: boolean;
  items: ItineraryItem[];
  nextStop?: ItineraryItem;
  pendingSuggestions: number;
  roleLens: OverviewRoleLens;
  settlementCount: number;
  trip: Trip;
  warningCount: number;
  onOpenExpenses: () => void;
  onSaveDailyBriefingOverrides?: (
    date: string,
    version: number,
    overrides: DailyBriefingOverrides,
  ) => void;
}

export function OverviewSummaryBand({
  activeMembers,
  countdown,
  currentMemberCard,
  dailyBriefings,
  groupSpendLabel,
  heroVisual,
  isManagerLens,
  items,
  nextStop,
  pendingSuggestions,
  roleLens,
  settlementCount,
  trip,
  warningCount,
  onOpenExpenses,
  onSaveDailyBriefingOverrides,
}: OverviewSummaryBandProps) {
  const { locale, t } = useI18n();
  const activeMembersLabel = t.dates.activeMembers({ count: activeMembers });

  return (
    <div className={overviewSummaryBentoClassName}>
      <OverviewHero
        title={trip.name}
        roleTitle={t.overview.roleHeadings[roleLens]}
        destinationLabel={trip.destinationLabel}
        dateRange={formatTripRange(trip.startDate, trip.endDate, locale)}
        activeMembersLabel={activeMembersLabel}
        groupSpendLabel={groupSpendLabel}
        settlementCount={settlementCount}
        visual={heroVisual}
        currentMemberCard={currentMemberCard}
        countdown={countdown}
      />
      <div className={overviewWeatherBentoClassName}>
        <OverviewWeatherBriefing
          canEdit={isManagerLens}
          dailyBriefings={dailyBriefings}
          locale={locale}
          onSaveDailyBriefingOverrides={onSaveDailyBriefingOverrides}
        />
      </div>

      <OverviewCockpit
        activeMembers={activeMembers}
        groupSpendLabel={groupSpendLabel}
        itemCount={items.length}
        labels={{
          alertSummary: t.overview.readiness.alertSummary,
          budget: t.overview.cockpit.budget,
          crewReadiness: t.overview.cockpit.crewReadiness,
          dayCount: t.dates.dayCount,
          memberCount: t.dates.memberCount,
          nextStop:
            countdown.type === "completed"
              ? t.overview.cockpit.completedStops
              : t.overview.cockpit.nextStop,
          openExpenses: t.overview.money.openExpenses,
          settlementSuggestions: t.overview.money.settlementSuggestions,
          stopCount: t.dates.stopCount,
        }}
        locale={locale}
        nextStop={nextStop}
        onOpenExpenses={onOpenExpenses}
        pendingSuggestions={pendingSuggestions}
        settlementCount={settlementCount}
        trip={trip}
        warningCount={warningCount}
      />
    </div>
  );
}
