import { noop } from "@/src/testing/storybook-actions";
import { tripFixture } from "@/src/trip/trip-fixtures";
import type { ItineraryItem } from "@/src/trip/types";
import type { StopDialog } from "@/src/features/itinerary/components";

export type StopDialogStoryArgs = Parameters<typeof StopDialog>[0];

export const stopDialogStoryItem = tripFixture.planItems[0];

export const stopDialogCreateArgs = {
  mode: "create",
  startDate: tripFixture.trip.startDate,
  endDate: tripFixture.trip.endDate,
  initialDay: tripFixture.trip.startDate,
  manualPathOptions: [
    { id: "main", name: "Main" },
    { id: "path-plan-a", name: "Plan A" },
  ],
  onClose: noop,
  onSubmit: noop,
} satisfies StopDialogStoryArgs;

export const stopDialogEditArgs = {
  ...stopDialogCreateArgs,
  mode: "edit",
  initialItem: stopDialogStoryItem,
  onDelete: noop,
} satisfies StopDialogStoryArgs;

export const ambiguousPlaceResolution = {
  state: "ambiguous" as const,
  candidates: [
    {
      name: "Central Market Kuala Lumpur",
      address: "Jalan Hang Kasturi, Kuala Lumpur",
      coordinates: { lat: 3.1459, lng: 101.6956 },
      mapLink: "https://maps.example.test/central-market-kl",
      confidence: 0.92,
      source: "storybook",
      evidence: ["Name and district match"],
    },
    {
      name: "Central Market Annexe",
      address: "Pasar Seni, Kuala Lumpur",
      coordinates: { lat: 3.1447, lng: 101.6962 },
      mapLink: "https://maps.example.test/central-market-annexe",
      confidence: 0.74,
      source: "storybook",
      evidence: ["Nearby alternate venue"],
    },
  ],
};

export function stopDialogCategoryItem(
  overrides: Partial<ItineraryItem>,
): ItineraryItem {
  return {
    ...stopDialogStoryItem,
    ...overrides,
    details: {
      ...stopDialogStoryItem.details,
      ...overrides.details,
    },
  };
}
