import {
  activityHeaderActivityClassName,
  activityHeaderGridClassName,
} from "../smart-itinerary-table.styles";

interface SmartItineraryTableHeadProps {
  labels: {
    time: string;
    type: string;
    activity: string;
    actions: string;
  };
}

export function SmartItineraryTableHead({ labels }: SmartItineraryTableHeadProps) {
  return (
    <thead>
      <tr>
        <th>
          <span className="sr-only">Path graph</span>
        </th>
        <th>
          <span className="sr-only">Activity</span>
          <div className={activityHeaderGridClassName} aria-hidden="true">
            <span>{labels.time}</span>
            <span>{labels.type}</span>
            <span className={activityHeaderActivityClassName}>
              <span>{labels.activity}</span>
              <span>{labels.actions}</span>
            </span>
          </div>
        </th>
      </tr>
    </thead>
  );
}
