import type { Trip } from "@/src/trip/types";

export interface FlexibleHunterPageProps {
  trip: Trip;
  /** Called when the date window slider changes (debounced). */
  onDateWindowChange: (start: string, end: string) => void;
  /** Called when a budget category's estimated amount is edited inline. */
  onBudgetEdit: (categoryId: string, updates: { estimated: number }) => void;
}
