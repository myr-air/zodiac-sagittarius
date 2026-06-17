import { Icon } from "@/src/ui/icons";
import { overviewPanelButtonClassName, overviewPanelClassName, overviewPanelTitleClassName } from "./overview-page.styles";

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
      <div className={overviewPanelTitleClassName}>
        <Icon name={icon} />
        <h2 id={titleId}>{title}</h2>
      </div>
      <strong>{value}</strong>
      <span>{detail}</span>
    </button>
  );
}
