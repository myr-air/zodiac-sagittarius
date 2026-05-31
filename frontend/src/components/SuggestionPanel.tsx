import type { Member, Suggestion } from "@/src/trip/types";
import { useI18n } from "@/src/i18n/I18nProvider";
import { Icon } from "./icons";

export function SuggestionPanel({ suggestions, members }: { suggestions: Suggestion[]; members: Member[] }) {
  const { t } = useI18n();
  const openSuggestions = suggestions.filter((suggestion) => suggestion.status === "pending" || suggestion.status === "conflicted");

  return (
    <section className="detail-section suggestion-module" aria-label={t.suggestions.queueLabel}>
      <div className="module-title-row">
        <h3>{t.suggestions.title({ count: openSuggestions.length })}</h3>
        <button type="button">{t.suggestions.seeMore}</button>
      </div>
      <div className="suggestion-list">
        {openSuggestions.map((suggestion) => {
          const proposer = members.find((member) => member.id === suggestion.proposerId);
          return (
            <article className={`suggestion-item suggestion-item--${suggestion.status}`} key={suggestion.id}>
              <Icon name={suggestion.status === "conflicted" ? "alertCircle" : "check"} />
              <div>
                <strong>{suggestion.proposedPatch.activity ?? t.suggestions.fallback}</strong>
                <span>{t.suggestions.suggestedUpdate({ name: proposer?.displayName ?? t.appShell.roles.traveler })}</span>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
