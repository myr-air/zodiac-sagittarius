export interface Waypoint {
  id: string;
  tripId: string;
  name: string;
  lat: number;
  lng: number;
  sortOrder: number;
  category?: string;
}

export interface WaypointCreateInput {
  tripId: string;
  name: string;
  lat: number;
  lng: number;
  sortOrder: number;
  category?: string;
}
