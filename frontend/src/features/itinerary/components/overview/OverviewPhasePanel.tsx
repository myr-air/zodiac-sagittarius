import type { ItineraryItem, TripDailyBriefing, TripTask } from "@/src/trip/types";
import { useI18n } from "@/src/i18n/I18nProvider";
import { cn } from "@/src/lib/cn";
import { Icon, type IconName } from "@/src/ui/icons";
import type { OverviewHeroProps } from "./OverviewHero";
import type { HighlightBoardProps } from "./OverviewHighlightBoard";
import {
  overviewPhaseCardClassName,
  overviewPhaseFactListClassName,
  overviewPhaseHeaderClassName,
  overviewPhaseToneClassNames,
} from "./overview-page.styles";

interface PhaseFact {
  icon: IconName;
  label: string;
  value: string;
}

interface OverviewPhasePanelProps {
  activeMembers: number;
  countdown: OverviewHeroProps["countdown"];
  dailyBriefings: TripDailyBriefing[];
  highlightItems: HighlightBoardProps["items"];
  nextStop?: ItineraryItem;
  pendingSuggestions: number;
  settlementCount: number;
  tasks: TripTask[];
  warningCount: number;
}

export function OverviewPhasePanel({
  activeMembers,
  countdown,
  dailyBriefings,
  highlightItems,
  nextStop,
  pendingSuggestions,
  settlementCount,
  tasks,
  warningCount,
}: OverviewPhasePanelProps) {
  const { t } = useI18n();
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
  );
}
