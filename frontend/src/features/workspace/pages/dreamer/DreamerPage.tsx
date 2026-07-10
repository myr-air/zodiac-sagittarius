import { useState } from "react";
import { useI18n } from "@/src/i18n/I18nProvider";
import { WorkspacePage } from "@/src/ui";
import type { DreamerPageProps } from "./DreamerPage.types";
import {
  budgetEstimateClass,
  ctaClass,
  destinationTextClass,
  pageClass,
  photoClass,
  photoContainerClass,
  photoFallbackClass,
  seasonalCardClass,
  seasonalCardSelectedClass,
  seasonalCardsRow,
  seasonalCardTextClass,
  seasonalSectionClass,
  seasonalTitleClass,
  tripNameClass,
} from "./DreamerPage.styles";

const SEASONS = [
  { key: "spring", icon: "🌸" },
  { key: "summer", icon: "☀️" },
  { key: "autumn", icon: "🍂" },
  { key: "winter", icon: "❄️" },
] as const;

export function DreamerPage({ trip, onStartPlanning }: DreamerPageProps) {
  const { t } = useI18n();
  const [selectedSeason, setSelectedSeason] = useState<string | null>(null);

  const seasonLabels: Record<string, string> = {
    spring: t.dreamer.spring,
    summer: t.dreamer.summer,
    autumn: t.dreamer.autumn,
    winter: t.dreamer.winter,
  };

  const roughMonth = trip.dateWindowStart || trip.startDate || null;
  const roughLabel = roughMonth
    ? new Date(`${roughMonth}T00:00:00`).toLocaleDateString("en-US", { month: "long", year: "numeric" })
    : "—";

  const hasImage = false; // Destination photo from trip data — deferred to later pass

  return (
    <WorkspacePage className={pageClass} aria-label={t.dreamer.title}>
      {/* Destination photo */}
      <div className={photoContainerClass} style={{ maxHeight: 280 }}>
        {hasImage ? (
          <img
            className={photoClass}
            style={{ aspectRatio: "16/9", maxHeight: 280 }}
            alt={trip.destinationLabel}
            src=""
          />
        ) : (
          <div
            className={photoFallbackClass}
            style={{ aspectRatio: "16/9", maxHeight: 280 }}
            data-testid="photo-fallback"
          >
            <span>{trip.destinationLabel || t.dreamer.noDestinationFallback}</span>
          </div>
        )}
      </div>

      {/* Trip name */}
      <h1 className={tripNameClass}>{trip.name}</h1>

      {/* Destination + rough month */}
      <p className={destinationTextClass}>
        {trip.destinationLabel} · {roughLabel}
      </p>

      {/* Seasonal cards */}
      <div className={seasonalSectionClass}>
        <h2 className={seasonalTitleClass}>{t.dreamer.seasonalTitle}</h2>
        <div className={seasonalCardsRow} data-testid="seasonal-cards">
          {SEASONS.map(({ key, icon }) => (
            <button
              key={key}
              type="button"
              className={`${seasonalCardClass} ${selectedSeason === key ? seasonalCardSelectedClass : ""}`}
              onClick={() => setSelectedSeason(selectedSeason === key ? null : key)}
              aria-pressed={selectedSeason === key}
              data-testid={`season-${key}`}
            >
              <span>{icon}</span>
              <span className={seasonalCardTextClass}>{seasonLabels[key]}</span>
            </button>
          ))}
        </div>
      </div>

      {/* CTA */}
      <button type="button" className={ctaClass} onClick={onStartPlanning} data-testid="start-planning-cta">
        {t.dreamer.startPlanningCTA}
      </button>

      {/* Budget estimate */}
      <p className={budgetEstimateClass} data-testid="budget-estimate">
        {t.dreamer.budgetEstimateLabel}: —
      </p>
    </WorkspacePage>
  );
}
