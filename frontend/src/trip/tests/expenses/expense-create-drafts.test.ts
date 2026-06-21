import { describe, expect, it } from "vitest";
import { resolveExpenseCreateDraftTripPlanId } from "../../expenses";
import type { Trip } from "../../types";

describe("expense create drafts", () => {
  it("resolves create draft trip plan ids with linked item, explicit, and selected fallbacks", () => {
    const trip = {
      itineraryItems: [
        {
          id: "item-linked",
          planVariantId: "plan-linked",
        },
      ],
      mainTripPlanId: "plan-main",
      activePlanVariantId: "plan-main",
    } as Pick<Trip, "itineraryItems" | "mainTripPlanId" | "activePlanVariantId">;
    const resolveTripPlanId = (
      targetTrip: typeof trip,
      itemId: string | null | undefined,
      preferredTripPlanId?: string | null,
    ) =>
      targetTrip.itineraryItems.find((item) => item.id === itemId)
        ?.planVariantId ??
      preferredTripPlanId ??
      targetTrip.mainTripPlanId;

    expect(
      resolveExpenseCreateDraftTripPlanId(
        trip,
        { itemId: "item-linked", tripPlanId: "plan-explicit" },
        {
          selectedTripPlanId: "plan-selected",
          resolveTripPlanId,
        },
      ),
    ).toBe("plan-linked");

    expect(
      resolveExpenseCreateDraftTripPlanId(
        trip,
        { itemId: null, tripPlanId: "plan-explicit" },
        {
          selectedTripPlanId: "plan-selected",
          resolveTripPlanId,
        },
      ),
    ).toBe("plan-explicit");

    expect(
      resolveExpenseCreateDraftTripPlanId(
        trip,
        { itemId: null, tripPlanId: null },
        {
          selectedTripPlanId: "plan-selected",
          resolveTripPlanId,
        },
      ),
    ).toBe("plan-selected");
  });
});
