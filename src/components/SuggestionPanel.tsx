import type { Member, Suggestion } from "@/src/trip/types";
import { Badge, Panel } from "./ui";
import { Icon } from "./icons";

export function SuggestionPanel({ suggestions, members }: { suggestions: Suggestion[]; members: Member[] }) {
  const openSuggestions = suggestions.filter((suggestion) => suggestion.status === "pending" || suggestion.status === "conflicted");

  return (
    <Panel className="context-module" aria-label="Suggestion queue">
      <div className="module-title-row">
        <span className="section-kicker">Review queue</span>
        <Icon name="lightbulb" />
      </div>
      <div className="suggestion-list">
        {openSuggestions.map((suggestion) => {
          const proposer = members.find((member) => member.id === suggestion.proposerId);
          return (
            <article className="suggestion-item" key={suggestion.id}>
              <div>
                <strong>{suggestion.proposedPatch.activity ?? "Plan change"}</strong>
                <span>{proposer?.displayName ?? "Traveler"} suggested an update</span>
              </div>
              <Badge tone={suggestion.status === "conflicted" ? "warning" : "primary"}>{suggestion.status}</Badge>
            </article>
          );
        })}
      </div>
    </Panel>
  );
}
