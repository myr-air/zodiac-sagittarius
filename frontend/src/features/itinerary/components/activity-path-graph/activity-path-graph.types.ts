import type { ItineraryItem } from "@/src/trip/types";
import type { ItineraryPathOption } from "@/src/trip/itinerary-paths";

export interface ActivityPathGraphDayProps {
  canEdit: boolean;
  day: string;
  dayLabel: string;
  graphWidth: number;
  graphItems: ItineraryItem[];
  pathOptions: ItineraryPathOption[];
  rowItems: ItineraryItem[];
  selectedItemId: string;
  onMoveItemToPath?: (itemId: string, pathId: string) => void;
  onSelectItem: (itemId: string) => void;
}

export interface GraphPoint {
  id: string;
  pathId?: string;
  x: number;
  y: number;
}

export interface GraphNode extends GraphPoint {
  color: string;
  end: number | null;
  item: ItineraryItem;
  pathId: string;
  pathName: string;
  sourcePathId: string;
  start: number | null;
}

export interface GraphEdge {
  id: string;
  color: string;
  dashed?: boolean;
  from: GraphPoint;
  to: GraphPoint;
}

export type PushGraphEdge = (from: GraphPoint, to: GraphPoint, color: string, dashed?: boolean) => void;

export interface GraphLayout {
  endY: number;
  height: number;
  itemYById: Map<string, number>;
  startY: number;
}
