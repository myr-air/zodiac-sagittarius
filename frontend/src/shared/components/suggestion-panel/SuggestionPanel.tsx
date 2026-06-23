import { useI18n } from "@/src/i18n/I18nProvider";
import { cn } from "@/src/lib/cn";
import { Icon } from "@/src/ui/icons";
import type { SuggestionPanelProps } from "./suggestion-panel.types";
import {
  copyClassName,
  itemBaseClassName,
  itemMetaClassName,
  itemTitleClassName,
  listClassName,
  panelClassName,
  titleButtonClassName,
  titleClassName,
  titleRowClassName,
} from "./suggestion-panel.styles";

export function SuggestionPanel({ suggestions, members }: SuggestionPanelProps) {
  const { t } = useI18n();
  const openSuggestions = suggestions.filter((suggestion) => suggestion.status === "pending" || suggestion.status === "conflicted");

  return (
    <section className={panelClassName} aria-label={t.suggestions.queueLabel}>
      <div className={titleRowClassName}>
        <h3 className={titleClassName}>{t.suggestions.title({ count: openSuggestions.length })}</h3>
        <button className={titleButtonClassName} type="button">{t.suggestions.seeMore}</button>
      </div>
      <div className={listClassName}>
        {openSuggestions.map((suggestion) => {
          const proposer = members.find((member) => member.id === suggestion.proposerId);
          return (
            <article className={cn(itemBaseClassName, `suggestion-item--${suggestion.status}`)} key={suggestion.id}>
              <Icon
                name={suggestion.status === "conflicted" ? "alertCircle" : "check"}
                className={suggestion.status === "conflicted" ? "text-(--color-warning)" : "text-(--color-success)"}
              />
              <div className={copyClassName}>
                <strong className={itemTitleClassName}>{suggestion.proposedPatch.activity ?? t.suggestions.fallback}</strong>
                <span className={itemMetaClassName}>{t.suggestions.suggestedUpdate({ name: proposer?.displayName ?? t.appShell.roles.traveler })}</span>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
