import { describe, expect, it } from "vitest";
import { seedTrip } from "@/src/trip/seed";
import {
  expenseDialogEffectiveTripPlanId,
  expenseDialogItemSelectionFields,
  expenseDialogLinkedItem,
  expenseDialogTripPlanIdForItemSelection,
  expenseDialogTripPlanOptions,
} from "../expense-dialog-linking";

describe("expense dialog linking helpers", () => {
  it("resolves linked itinerary items and falls back for empty or unknown item ids", () => {
    expect(expenseDialogLinkedItem(seedTrip, "item-arrive-hkg")).toMatchObject({
      id: "item-arrive-hkg",
    });
    expect(expenseDialogLinkedItem(seedTrip, "")).toBeNull();
    expect(expenseDialogLinkedItem(seedTrip, "missing-item")).toBeNull();
  });

  it("uses the linked itinerary item's plan before the editable dialog plan", () => {
    const linkedItem = {
      ...seedTrip.itineraryItems[0],
      planVariantId: "plan-rain",
    };

    expect(expenseDialogEffectiveTripPlanId({
      linkedItem,
      tripPlanId: "plan-main",
    })).toBe("plan-rain");
    expect(expenseDialogEffectiveTripPlanId({
      linkedItem: null,
      tripPlanId: "plan-main",
    })).toBe("plan-main");
  });

  it("derives the locked Trip Plan when selecting a linked itinerary item", () => {
    expect(expenseDialogTripPlanIdForItemSelection(seedTrip, "item-arrive-hkg")).toBe("plan-main");
    expect(expenseDialogTripPlanIdForItemSelection(seedTrip, "")).toBeNull();
    expect(expenseDialogTripPlanIdForItemSelection(seedTrip, "missing-item")).toBeNull();
  });

  it("builds item selection fields while preserving the current plan fallback", () => {
    expect(expenseDialogItemSelectionFields({
      currentTripPlanId: "plan-rain",
      itemId: "item-arrive-hkg",
      trip: seedTrip,
    })).toEqual({
      itemId: "item-arrive-hkg",
      tripPlanId: "plan-main",
    });

    expect(expenseDialogItemSelectionFields({
      currentTripPlanId: "plan-rain",
      itemId: "",
      trip: seedTrip,
    })).toEqual({
      itemId: "",
      tripPlanId: "plan-rain",
    });
  });

  it("prefers canonical Trip Plans over legacy plan variants for dialog options", () => {
    const canonicalTripPlans = [
      {
        ...seedTrip.planVariants[0],
        id: "canonical-main",
      },
    ];

    expect(expenseDialogTripPlanOptions({
      ...seedTrip,
      tripPlans: canonicalTripPlans,
    })).toBe(canonicalTripPlans);
    expect(expenseDialogTripPlanOptions({
      ...seedTrip,
      tripPlans: undefined,
    })).toBe(seedTrip.planVariants);
  });
});
