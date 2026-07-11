import type { Trip } from "@/src/trip/types";

export interface DreamerPageProps {
  trip: Trip;
  onStartPlanning: () => void;
}
