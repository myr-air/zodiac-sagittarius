import type { ComponentProps, ReactNode } from "react";
import type {
  DailyBriefingOverrides,
  ItineraryItem,
  Trip,
  TripDailyBriefing,
} from "@/src/trip/types";
import { useI18n } from "@/src/i18n/I18nProvider";
import { formatTripRange } from "@/src/shared/components/page-header";
import { photoBoardEmptyMessage } from "@/src/features/itinerary/domain/overview";
import type { OverviewRoleLens } from "@/src/features/itinerary/domain/overview";
import { HighlightBoard, OverviewHero } from "./OverviewSections";
import { OverviewCockpit } from "./OverviewCockpit";
import { OverviewWeatherBriefing } from "./OverviewWeatherBriefing";

interface OverviewSummaryBandProps {
  activeMembers: number;
  countdown: ComponentProps<typeof OverviewHero>["countdown"];
  currentMemberCard: ReactNode;
  dailyBriefings: TripDailyBriefing[];
  groupSpendLabel: string;
  heroVisual: ComponentProps<typeof OverviewHero>["visual"];
  highlightItems: ComponentProps<typeof HighlightBoard>["items"];
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
  highlightItems,
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

  return (
    <>
      <OverviewHero
        title={trip.name}
        roleTitle={t.overview.roleHeadings[roleLens]}
        destinationLabel={trip.destinationLabel}
        dateRange={formatTripRange(trip.startDate, trip.endDate, locale)}
        activeMembersLabel={t.dates.activeMembers({ count: activeMembers })}
        groupSpendLabel={groupSpendLabel}
        settlementCount={settlementCount}
        visual={heroVisual}
        currentMemberCard={currentMemberCard}
        countdown={countdown}
      />
      <OverviewWeatherBriefing
        canEdit={isManagerLens}
        dailyBriefings={dailyBriefings}
        locale={locale}
        onSaveDailyBriefingOverrides={onSaveDailyBriefingOverrides}
      />

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
          nextStop: t.overview.cockpit.nextStop,
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

      <HighlightBoard
        items={highlightItems}
        startDate={trip.startDate}
        locale={locale}
        emptyMessage={
          isManagerLens
            ? t.overview.empty.highlights
            : photoBoardEmptyMessage(t.overview.empty.highlights)
        }
        title={t.overview.highlightBoard.title}
        subtitle={t.overview.highlightBoard.subtitle}
      />
    </>
  );
}
