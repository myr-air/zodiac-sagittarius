import type { Member } from "@/src/trip/members/member-types";
import type { SettlementSuggestion } from "@/src/trip/expenses/expense-types";

interface ExpenseSettlementSummaryProps {
  suggestions: SettlementSuggestion[];
  members: Member[];
  settlementLabel: string;
}

export function ExpenseSettlementSummary({
  suggestions,
  members,
  settlementLabel,
}: ExpenseSettlementSummaryProps) {
  if (suggestions.length === 0) {
    return (
      <div className="flex flex-col gap-2">
        <p className="text-sm text-(--color-text-muted)">{settlementLabel}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {suggestions.map((suggestion, index) => {
        const fromName = members.find((m) => m.id === suggestion.from)?.displayName ?? suggestion.from;
        const toName = members.find((m) => m.id === suggestion.to)?.displayName ?? suggestion.to;
        const currency = suggestion.currency ?? "";
        return (
          <p
            key={`${suggestion.from}-${suggestion.to}-${index}`}
            className="text-sm text-(--color-text) [font-variant-numeric:tabular-nums]"
          >
            {fromName} → {toName}: {currency}{suggestion.amount}
          </p>
        );
      })}
    </div>
  );
}
