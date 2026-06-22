import { Icon, type IconName } from "@/src/ui/icons";
import {
  noteActionButtonClassName,
  noteActionsClassName,
} from "./context-rail.styles";

interface ContextRailItemAction {
  ariaLabel: string;
  disabled?: boolean;
  icon: IconName;
  onClick: () => void;
}

interface ContextRailItemActionButtonsProps {
  actions: ContextRailItemAction[];
}

export function ContextRailItemActionButtons({
  actions,
}: ContextRailItemActionButtonsProps) {
  return (
    <span className={noteActionsClassName}>
      {actions.map((action) => (
        <button
          aria-label={action.ariaLabel}
          className={noteActionButtonClassName}
          disabled={action.disabled}
          key={action.ariaLabel}
          onClick={action.onClick}
          type="button"
        >
          <Icon name={action.icon} />
        </button>
      ))}
    </span>
  );
}
