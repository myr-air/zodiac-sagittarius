import { useI18n } from "@/src/i18n/I18nProvider";
import { cn } from "@/src/lib/cn";
import type { Member, Suggestion } from "@/src/trip/types";
import { Icon } from "./icons";

const panelClassName = [
  "detail-section",
  "suggestion-module",
  "grid",
  "gap-1.5",
  "border-b",
  "border-[var(--color-border)]",
  "px-4",
  "py-2.5",
];

const titleRowClassName = ["module-title-row", "flex", "items-center", "justify-between", "gap-2.5"];
const titleButtonClassName = [
  "min-h-[30px]",
  "rounded-[var(--radius-sm)]",
  "border",
  "border-[var(--color-border)]",
  "bg-[var(--color-surface)]",
  "px-2.5",
  "text-xs",
  "font-bold",
  "text-[#334155]",
];
const listClassName = ["suggestion-list", "grid", "gap-1.5"];
const itemBaseClassName = [
  "suggestion-item",
  "grid",
  "grid-cols-[18px_minmax(0,1fr)]",
  "gap-2",
  "text-xs",
  "leading-4",
  "text-[#334155]",
];
const copyClassName = ["grid", "gap-0.5"];

export function SuggestionPanel({ suggestions, members }: { suggestions: Suggestion[]; members: Member[] }) {
  const { t } = useI18n();
  const openSuggestions = suggestions.filter((suggestion) => suggestion.status === "pending" || suggestion.status === "conflicted");

  return (
    <section className={cn(panelClassName)} aria-label={t.suggestions.queueLabel}>
      <div className={cn(titleRowClassName)}>
        <h3 className="m-0 text-[13px] font-extrabold leading-[18px] text-[#334155]">{t.suggestions.title({ count: openSuggestions.length })}</h3>
        <button className={cn(titleButtonClassName)} type="button">{t.suggestions.seeMore}</button>
      </div>
      <div className={cn(listClassName)}>
        {openSuggestions.map((suggestion) => {
          const proposer = members.find((member) => member.id === suggestion.proposerId);
          return (
            <article className={cn(itemBaseClassName, `suggestion-item--${suggestion.status}`)} key={suggestion.id}>
              <Icon
                name={suggestion.status === "conflicted" ? "alertCircle" : "check"}
                className={suggestion.status === "conflicted" ? "text-[var(--color-warning)]" : "text-[var(--color-success)]"}
              />
              <div className={cn(copyClassName)}>
                <strong className="font-semibold">{suggestion.proposedPatch.activity ?? t.suggestions.fallback}</strong>
                <span className="text-[var(--color-text-muted)]">{t.suggestions.suggestedUpdate({ name: proposer?.displayName ?? t.appShell.roles.traveler })}</span>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
