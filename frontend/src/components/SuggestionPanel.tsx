import { useI18n } from "@/src/i18n/I18nProvider";
import { cn } from "@/src/lib/cn";
import type { Member, Suggestion } from "@/src/trip/types";
import { Icon } from "./icons";

const panelClassName = "detail-section suggestion-module grid gap-1.5 border-b border-(--color-border) px-4 py-2.5";
const titleRowClassName = "module-title-row flex items-center justify-between gap-2.5";
const titleButtonClassName = "min-h-8 rounded-(--radius-sm) border border-(--color-border) bg-(--color-surface) px-2.5 text-xs font-bold text-(--color-text-muted) transition-[border-color,background,color] duration-150 hover:border-(--color-primary-border) hover:bg-(--color-primary-soft) hover:text-(--color-primary-strong) focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--color-primary-border)";
const listClassName = "suggestion-list grid gap-1.5";
const itemBaseClassName = "suggestion-item grid grid-cols-[18px_minmax(0,1fr)] gap-2 text-xs leading-4 text-(--color-text-muted)";
const copyClassName = "grid gap-0.5";

export function SuggestionPanel({ suggestions, members }: { suggestions: Suggestion[]; members: Member[] }) {
  const { t } = useI18n();
  const openSuggestions = suggestions.filter((suggestion) => suggestion.status === "pending" || suggestion.status === "conflicted");

  return (
    <section className={panelClassName} aria-label={t.suggestions.queueLabel}>
      <div className={titleRowClassName}>
        <h3 className="m-0 text-[13px] font-extrabold leading-[18px] text-(--color-text)">{t.suggestions.title({ count: openSuggestions.length })}</h3>
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
                <strong className="font-semibold">{suggestion.proposedPatch.activity ?? t.suggestions.fallback}</strong>
                <span className="text-(--color-text-muted)">{t.suggestions.suggestedUpdate({ name: proposer?.displayName ?? t.appShell.roles.traveler })}</span>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
