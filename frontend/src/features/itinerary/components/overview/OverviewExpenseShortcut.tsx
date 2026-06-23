import { OverviewPanelTitle } from "./OverviewPanelTitle";
import { overviewPanelButtonClassName, overviewPanelClassName } from "./overview-page.styles";

interface OverviewExpenseShortcutProps {
  icon: "wallet" | "plus";
  title: string;
  value: React.ReactNode;
  detail: string;
  onClick: () => void;
  ariaLabel?: string;
  titleId?: string;
}

export function OverviewExpenseShortcut({
  icon,
  title,
  value,
  detail,
  onClick,
  ariaLabel,
  titleId,
}: OverviewExpenseShortcutProps) {
  return (
    <button
      className={`${overviewPanelClassName} ${overviewPanelButtonClassName}`}
      type="button"
      aria-label={ariaLabel}
      onClick={onClick}
    >
      <OverviewPanelTitle icon={icon} title={title} titleId={titleId} />
      <strong>{value}</strong>
      <span>{detail}</span>
    </button>
  );
}
