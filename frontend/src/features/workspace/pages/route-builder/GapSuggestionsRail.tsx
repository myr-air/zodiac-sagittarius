import { useMemo } from "react";
import { useI18n } from "@/src/i18n/I18nProvider";
import { Icon } from "@/src/ui";
import { cn } from "@/src/lib/cn";
import type { GapSuggestion, GapSuggestionsRailProps } from "./RouteBuilderPage.types";
import {
  emptyStateClassName,
  railClassName,
  railTitleClassName,
  suggestionDetourClassName,
  suggestionItemClassName,
  suggestionItemSelectedClassName,
  suggestionListClassName,
  suggestionNameClassName,
} from "./RouteBuilderPage.styles";
import { computeGapSuggestions, sortWaypoints } from "./route-builder.utils";

function FoodIcon() {
  return <Icon name="utensils" />;
}

function AttractionIcon() {
  return (
    <svg
      className="icon size-[18px] shrink-0"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path d="M12 2 8 10h8z" />
      <path d="M12 10v10" />
      <path d="M6 22h12" />
    </svg>
  );
}

function RestIcon() {
  return (
    <svg
      className="icon size-[18px] shrink-0"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path d="M2 20v-8a2 2 0 0 1 2-2h12v10" />
      <path d="M2 10h12" />
      <path d="M7 15h2" />
    </svg>
  );
}

function SuggestionCategoryIcon({ category }: { category: GapSuggestion["category"] }) {
  if (category === "food") return <FoodIcon />;
  if (category === "attraction") return <AttractionIcon />;
  return <RestIcon />;
}

export function GapSuggestionsRail({
  waypoints,
  selectedSuggestionId,
  onSelect,
  className,
}: GapSuggestionsRailProps) {
  const { t } = useI18n();
  const sorted = useMemo(() => sortWaypoints(waypoints), [waypoints]);
  const suggestions = useMemo(() => computeGapSuggestions(sorted), [sorted]);

  return (
    <aside className={cn(railClassName, className)} aria-label={t.routeBuilder.gapSuggestionsTitle}>
      <h2 className={railTitleClassName}>{t.routeBuilder.gapSuggestionsTitle}</h2>
      {suggestions.length === 0 ? (
        <div className={emptyStateClassName}>
          <Icon name="map" />
          <span>{t.routeBuilder.noSuggestionsFallback}</span>
        </div>
      ) : (
        <ul className={suggestionListClassName}>
          {suggestions.map((suggestion) => (
            <li key={suggestion.id}>
              <button
                type="button"
                className={cn(
                  suggestionItemClassName,
                  selectedSuggestionId === suggestion.id && suggestionItemSelectedClassName,
                )}
                onClick={() => onSelect(suggestion)}
                data-testid="gap-suggestion"
              >
                <SuggestionCategoryIcon category={suggestion.category} />
                <span className={suggestionNameClassName}>{suggestion.name}</span>
                <span className={suggestionDetourClassName}>
                  +{suggestion.detourMinutes}m
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </aside>
  );
}
