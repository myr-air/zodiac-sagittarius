import { cn } from "@/src/lib/cn";
import { Icon, type IconName } from "@/src/ui/icons";
import {
  tripAccessNotesClassName,
  tripAccessPhotoClassName,
  tripAccessPhotoKrabiClassName,
  tripAccessPhotoKyotoClassName,
  tripAccessPhotoSantoriniClassName,
  tripAccessPhotoStackClassName,
  tripAccessRouteCardClassName,
  tripAccessRouteLineClassName,
  tripAccessRouteStopClassName,
  tripAccessVisualClassName,
  tripAccessVisualWashClassName,
} from "./layout/trip-join-gate.styles";

interface TripJoinVisualNote {
  detail: string;
  icon: IconName;
  title: string;
}

interface TripJoinGateVisualProps {
  label: string;
  notes: TripJoinVisualNote[];
}

export function TripJoinGateVisual({ label, notes }: TripJoinGateVisualProps) {
  return (
    <div className={tripAccessVisualClassName} role="group" aria-label={label}>
      <span className={tripAccessVisualWashClassName} />
      <div className={tripAccessPhotoStackClassName} aria-hidden="true">
        <span className={cn(tripAccessPhotoClassName, tripAccessPhotoKrabiClassName)} />
        <span className={cn(tripAccessPhotoClassName, tripAccessPhotoKyotoClassName)} />
        <span className={cn(tripAccessPhotoClassName, tripAccessPhotoSantoriniClassName)} />
      </div>
      <div className={tripAccessRouteCardClassName} aria-hidden="true">
        <span className={tripAccessRouteStopClassName}>Joii</span>
        <span className={tripAccessRouteLineClassName} />
        <span className={tripAccessRouteStopClassName}>Trip</span>
      </div>
      <ul className={tripAccessNotesClassName}>
        {notes.map((note) => (
          <li key={note.title}>
            <Icon name={note.icon} />
            <span>
              <strong>{note.title}</strong>
              <small>{note.detail}</small>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
