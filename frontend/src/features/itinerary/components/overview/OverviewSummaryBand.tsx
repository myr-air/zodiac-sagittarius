import type { ReactNode } from "react";
import type {
  DailyBriefingOverrides,
  ItineraryItem,
  Trip,
  TripDailyBriefing,
  TripTask,
} from "@/src/trip/types";
import { useI18n } from "@/src/i18n/I18nProvider";
import { cn } from "@/src/lib/cn";
import { formatTripRange } from "@/src/shared/components/page-header";
import type { OverviewRoleLens } from "@/src/features/itinerary/domain/overview";
import { Icon, type IconName } from "@/src/ui/icons";
import type { HighlightBoardProps } from "./OverviewHighlightBoard";
import { OverviewHero, type OverviewHeroProps } from "./OverviewHero";
import { OverviewCockpit } from "./OverviewCockpit";
import { OverviewWeatherBriefing } from "./OverviewWeatherBriefing";
import {
  overviewPhaseCardClassName,
  overviewPhaseFactListClassName,
  overviewPhaseHeaderClassName,
  overviewPhaseToneClassNames,
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
  highlightItems: HighlightBoardProps["items"];
  isManagerLens: boolean;
  items: ItineraryItem[];
  nextStop?: ItineraryItem;
  pendingSuggestions: number;
  roleLens: OverviewRoleLens;
  settlementCount: number;
  tasks: TripTask[];
  trip: Trip;
  warningCount: number;
  onOpenExpenses: () => void;
  onSaveDailyBriefingOverrides?: (
    date: string,
    version: number,
    overrides: DailyBriefingOverrides,
  ) => void;
}

interface PhaseFact {
  icon: IconName;
  label: string;
  value: string;
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
  tasks,
  trip,
  warningCount,
  onOpenExpenses,
  onSaveDailyBriefingOverrides,
}: OverviewSummaryBandProps) {
  const { locale, t } = useI18n();
  const activeMembersLabel = t.dates.activeMembers({ count: activeMembers });
  const routeReviewSummary = t.overview.readiness.alertSummary({
    warnings: warningCount,
    suggestions: pendingSuggestions,
  });
  const openTaskCount = tasks.filter((task) => task.status === "open").length;
  const phaseLabels = t.overview.phase[countdown.type];
  let phaseFacts: PhaseFact[];
  if (countdown.type === "incoming") {
    const labels = t.overview.phase.incoming;
    phaseFacts = [
      { icon: "warning", label: labels.facts.blockers, value: routeReviewSummary },
      {
        icon: "list",
        label: labels.facts.checklist,
        value: t.overview.readiness.openChecklistCount({ count: openTaskCount }),
      },
      { icon: "ticket", label: labels.facts.firstMove, value: nextStop?.place ?? labels.fallback },
    ];
  } else if (countdown.type === "active") {
    const labels = t.overview.phase.active;
    phaseFacts = [
      { icon: "route", label: labels.facts.nextMove, value: nextStop?.place ?? labels.fallback },
      { icon: "cloud", label: labels.facts.weather, value: t.dates.dayCount({ count: dailyBriefings.length }) },
      { icon: "users", label: labels.facts.crew, value: activeMembersLabel },
    ];
  } else {
    const labels = t.overview.phase.completed;
    phaseFacts = [
      {
        icon: "wallet",
        label: labels.facts.settlements,
        value: t.overview.money.settlementsCount({ count: settlementCount }),
      },
      { icon: "location", label: labels.facts.highlights, value: String(highlightItems.length) },
      { icon: "check", label: labels.facts.recap, value: labels.fallback },
    ];
  }

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

      <section
        className={cn(overviewPhaseCardClassName, overviewPhaseToneClassNames[countdown.type])}
        aria-label={phaseLabels.eyebrow}
      >
        <div className={overviewPhaseHeaderClassName}>
          <span>{phaseLabels.eyebrow}</span>
          <h2>{phaseLabels.title}</h2>
          <p>{phaseLabels.detail}</p>
        </div>
        <ul className={overviewPhaseFactListClassName}>
          {phaseFacts.map((fact) => (
            <li key={fact.label}>
              <Icon name={fact.icon} />
              <span>
                <small>{fact.label}</small>
                <strong>{fact.value}</strong>
              </span>
            </li>
          ))}
        </ul>
      </section>

    </div>
  );
}
