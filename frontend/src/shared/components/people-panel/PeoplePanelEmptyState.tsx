import { resetClaimButtonClassName, membersEmptyStateClassName } from "./people-panel.styles";
import { peoplePanelCopy } from "./people-panel.copy";

interface PeoplePanelEmptyStateProps {
  emptyMessage: string;
  locale: string;
  onResetFilters?: () => void;
}

export function PeoplePanelEmptyState({
  emptyMessage,
  locale,
  onResetFilters,
}: PeoplePanelEmptyStateProps) {
  const copy = peoplePanelCopy(locale);

  return (
    <div className={membersEmptyStateClassName}>
      <strong>{emptyMessage}</strong>
      <span>{copy.emptyHint}</span>
      {onResetFilters ? (
        <button className={resetClaimButtonClassName} type="button" onClick={onResetFilters}>
          {copy.resetFilters}
        </button>
      ) : null}
    </div>
  );
}
