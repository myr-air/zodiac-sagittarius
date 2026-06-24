import { SmartItineraryTableBody } from "./SmartItineraryTableBody";
import type { SmartItineraryTableBodyProps } from "./SmartItineraryTableBody";
import { tableScrollClassName } from "./smart-itinerary-table.styles";

interface SmartItineraryTableViewportProps extends SmartItineraryTableBodyProps {
  scrollLabel: string;
}

export function SmartItineraryTableViewport({
  scrollLabel,
  ...bodyProps
}: SmartItineraryTableViewportProps) {
  return (
    <div
      className={tableScrollClassName}
      tabIndex={0}
      aria-label={scrollLabel}
    >
      <SmartItineraryTableBody {...bodyProps} />
    </div>
  );
}
