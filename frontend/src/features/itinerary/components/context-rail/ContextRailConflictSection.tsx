import { Button } from "@/src/ui";
import { Icon } from "@/src/ui/icons";
import { useI18n } from "@/src/i18n/I18nProvider";
import {
  conflictRowClassName,
  conflictSummaryClassName,
} from "./context-rail.styles";
import { ContextRailDetailSection } from "./ContextRailDetailSection";

interface ContextRailConflictSectionProps {
  canReviewSuggestions: boolean;
}

export function ContextRailConflictSection({
  canReviewSuggestions,
}: ContextRailConflictSectionProps) {
  const { t } = useI18n();

  return (
    <ContextRailDetailSection
      className="conflict-section"
      ariaLabel={t.contextRail.conflicts.label}
      title={t.contextRail.conflicts.title}
    >
      <div className={conflictRowClassName}>
        <span className={conflictSummaryClassName}>
          <Icon name="alertCircle" /> {t.contextRail.conflicts.peakWarning}
        </span>
        <Button
          type="button"
          variant="ghost"
          className="min-h-8 px-2.5 py-1 text-[11px]"
          disabled={!canReviewSuggestions}
        >
          {t.contextRail.conflicts.autoFix}
        </Button>
      </div>
    </ContextRailDetailSection>
  );
}
