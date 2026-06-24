import type { TripApiClient } from "../api-client";
import type { ItineraryItem } from "../types";

interface PatchApiItineraryBranchItemsInput {
  apiClient: TripApiClient;
  items: ItineraryItem[];
  nextClientMutationId: (prefix: string) => string;
  sessionToken: string;
  tripId: string;
}

export async function patchApiItineraryBranchItems({
  apiClient,
  items,
  nextClientMutationId,
  sessionToken,
  tripId,
}: PatchApiItineraryBranchItemsInput): Promise<ItineraryItem[]> {
  const patchedItems: ItineraryItem[] = [];
  const changedItemIds = new Set(items.map((item) => item.id));
  const itemsToPatch = items.filter(
    (item) => !item.parentItemId || !changedItemIds.has(item.parentItemId),
  );
  for (const item of itemsToPatch) {
    patchedItems.push(
      await apiClient.patchItineraryItem(tripId, item.id, sessionToken, {
        clientMutationId: nextClientMutationId("itinerary-branch"),
        expectedVersion: item.version,
        patch: {
          pathGroupId: item.pathGroupId,
          pathId: item.pathId,
          pathName: item.pathName,
          pathRole: item.pathRole,
        },
      }),
    );
  }
  return patchedItems;
}
