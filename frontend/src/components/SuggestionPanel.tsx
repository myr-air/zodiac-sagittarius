import type { Member, Suggestion } from "@/src/trip/types";
import { Icon } from "./icons";

export function SuggestionPanel({ suggestions, members }: { suggestions: Suggestion[]; members: Member[] }) {
  const openSuggestions = suggestions.filter((suggestion) => suggestion.status === "pending" || suggestion.status === "conflicted");

  return (
    <section className="detail-section suggestion-module" aria-label="Suggestion queue">
      <div className="module-title-row">
        <h3>คำแนะนำ ({openSuggestions.length})</h3>
        <button type="button">ดูเพิ่มเติม</button>
      </div>
      <div className="suggestion-list">
        {openSuggestions.map((suggestion) => {
          const proposer = members.find((member) => member.id === suggestion.proposerId);
          return (
            <article className={`suggestion-item suggestion-item--${suggestion.status}`} key={suggestion.id}>
              <Icon name={suggestion.status === "conflicted" ? "alertCircle" : "check"} />
              <div>
                <strong>{suggestion.proposedPatch.activity ?? "แนะนำให้จองคิวล่วงหน้า"}</strong>
                <span>{proposer?.displayName ?? "Traveler"} suggested an update</span>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
