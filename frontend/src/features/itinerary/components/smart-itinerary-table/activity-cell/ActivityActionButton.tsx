import type { MouseEvent } from "react";

import { externalLinkAnchorProps } from "@/src/shared/components/external-link-action";
import { Icon, type IconName } from "@/src/ui/icons";

import { activityIconButtonClassName } from "./activity-cell.styles";

interface ActivityActionButtonProps {
  ariaLabel: string;
  href?: string;
  iconClassName?: string;
  iconName: IconName;
  onAction?: () => void;
  onActionComplete?: () => void;
}

export function ActivityActionButton({
  ariaLabel,
  href,
  iconClassName,
  iconName,
  onAction,
  onActionComplete,
}: ActivityActionButtonProps) {
  const handleClick = (event: MouseEvent) => {
    event.stopPropagation();
    onActionComplete?.();
    onAction?.();
  };

  if (href) {
    return (
      <a
        className={activityIconButtonClassName}
        href={href}
        {...externalLinkAnchorProps}
        aria-label={ariaLabel}
        title={ariaLabel}
        onClick={handleClick}
      >
        <Icon name={iconName} className={iconClassName} />
      </a>
    );
  }

  return (
    <button
      type="button"
      className={activityIconButtonClassName}
      aria-label={ariaLabel}
      title={ariaLabel}
      onClick={handleClick}
    >
      <Icon name={iconName} className={iconClassName} />
    </button>
  );
}
