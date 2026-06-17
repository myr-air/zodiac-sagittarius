import { useI18n } from "@/src/i18n/I18nProvider";
import type { Suggestion, Trip } from "@/src/trip/types";
import {
  detailHeadingClassName,
  detailSectionClassName,
  emptyWarningClassName,
  suggestionActionButtonClassName,
  suggestionActionsClassName,
  suggestionItemBaseClassName,
  suggestionItemToneClassNames,
  suggestionListClassName,
} from "../context-rail.styles";
import { memberDisplayName, suggestionLabel } from "../context-rail.utils";
import { Icon } from "@/src/ui/icons";

interface ContextRailSuggestionsSectionProps {
  suggestions: Suggestion[];
  tripMembers: Trip["members"];
  canReviewSuggestions: boolean;
  onReviewSuggestion: (
    suggestionId: string,
    decision: "approved" | "rejected",
  ) => void;
}

export function ContextRailSuggestionsSection({
  suggestions,
  tripMembers,
  canReviewSuggestions,
  onReviewSuggestion,
}: ContextRailSuggestionsSectionProps) {
  const { t } = useI18n();

  return (
    <section
      className={`${detailSectionClassName} suggestion-module`}
      aria-label={t.contextRail.suggestions.label}
    >
      <div className="module-title-row flex items-center justify-between gap-2.5">
        <h3 className={detailHeadingClassName}>
          {t.contextRail.suggestions.title({
            count: suggestions.length,
          })}
        </h3>
        <span>
          {canReviewSuggestions
            ? t.contextRail.suggestions.pending
            : t.contextRail.suggestions.readOnly}
        </span>
      </div>
      <div className={suggestionListClassName}>
        {suggestions.map((suggestion) => {
          const proposer = tripMembers.find(
            (member) => member.id === suggestion.proposerId,
          );
          const label = suggestionLabel(suggestion, t.contextRail.suggestions.fallback);
          return (
            <article
              className={`${suggestionItemBaseClassName} ${suggestion.status === "conflicted" ? suggestionItemToneClassNames.conflicted : suggestionItemToneClassNames.pending}`}
              key={suggestion.id}
            >
              <Icon
                name={
                  suggestion.status === "conflicted" ? "alertCircle" : "check"
                }
              />
              <div>
                <strong>{label}</strong>
                <span>
                  {t.contextRail.suggestions.suggestedUpdate({
                    name: memberDisplayName(
                      proposer,
                      t.appShell.roles.traveler,
                    ),
                  })}
                </span>
                {canReviewSuggestions ? (
                  <div className={suggestionActionsClassName}>
                    <button
                      className={suggestionActionButtonClassName}
                      type="button"
                      onClick={() =>
                        onReviewSuggestion(suggestion.id, "approved")
                      }
                    >
                      {t.contextRail.suggestions.approve({ label })}
                    </button>
                    <button
                      className={suggestionActionButtonClassName}
                      type="button"
                      onClick={() =>
                        onReviewSuggestion(suggestion.id, "rejected")
                      }
                    >
                      {t.contextRail.suggestions.reject({ label })}
                    </button>
                  </div>
                ) : null}
              </div>
            </article>
          );
        })}
        {!suggestions.length ? (
          <p className={emptyWarningClassName}>
            {t.contextRail.suggestions.empty}
          </p>
        ) : null}
      </div>
    </section>
  );
}
