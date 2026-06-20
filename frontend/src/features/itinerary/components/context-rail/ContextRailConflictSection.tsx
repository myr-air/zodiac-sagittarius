import { Button } from "@/src/ui";
import { Icon } from "@/src/ui/icons";
import { useI18n } from "@/src/i18n/I18nProvider";
import {
  conflictRowClassName,
  conflictSummaryClassName,
  detailHeadingClassName,
  detailSectionClassName,
} from "./context-rail.styles";

interface ContextRailConflictSectionProps {
  canReviewSuggestions: boolean;
}

export function ContextRailConflictSection({
  canReviewSuggestions,
}: ContextRailConflictSectionProps) {
  const { t } = useI18n();

  return (
    <section
      className={`${detailSectionClassName} conflict-section`}
      aria-label={t.contextRail.conflicts.label}
    >
      <h3 className={detailHeadingClassName}>
        {t.contextRail.conflicts.title}
      </h3>
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
    </section>
  );
}
