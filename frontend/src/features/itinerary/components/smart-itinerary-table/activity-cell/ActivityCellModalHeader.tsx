import { Icon } from "@/src/ui/icons";

import { subActivityModalCloseClassName } from "../smart-itinerary-table.styles";

interface ActivityCellModalHeaderProps {
  closeLabel: string;
  headerClassName: string;
  onClose: () => void;
  subtitle: string;
  title: string;
  titleClassName: string;
}

export function ActivityCellModalHeader({
  closeLabel,
  headerClassName,
  onClose,
  subtitle,
  title,
  titleClassName,
}: ActivityCellModalHeaderProps) {
  return (
    <header className={headerClassName}>
      <strong className={titleClassName}>
        <span>{title}</span>
        <small>{subtitle}</small>
      </strong>
      <button
        type="button"
        className={subActivityModalCloseClassName}
        aria-label={closeLabel}
        onClick={onClose}
      >
        <Icon name="x" />
      </button>
    </header>
  );
}
