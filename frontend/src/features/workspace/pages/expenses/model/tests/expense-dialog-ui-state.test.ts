import { describe, expect, it } from "vitest";
import { seedTrip } from "@/src/trip/seed";
import type { Expense } from "@/src/trip/types";

import {
  initialExpenseDialogUiState,
  setExpenseDialogSaving,
  updateExpenseDialogTripPlanId,
} from "../expense-dialog-ui-state";

describe("expense dialog ui state", () => {
  it("initializes saving status and selected trip plan from defaults", () => {
    expect(
      initialExpenseDialogUiState({
        expense: null,
        selectedTripPlanId: "plan-rain",
        trip: seedTrip,
      }),
    ).toEqual({
      isSaving: false,
      tripPlanId: "plan-rain",
    });
  });

  it("prefers an expense trip plan over the selected workspace trip plan", () => {
    expect(
      initialExpenseDialogUiState({
        expense: { id: "expense-plan", tripPlanId: "plan-expense" } as Expense,
        selectedTripPlanId: "plan-rain",
        trip: seedTrip,
      }).tripPlanId,
    ).toBe("plan-expense");
  });

  it("updates trip plan and saving status independently", () => {
    const state = initialExpenseDialogUiState({
      expense: null,
      selectedTripPlanId: "plan-main",
      trip: seedTrip,
    });

    expect(updateExpenseDialogTripPlanId(state, "plan-rain")).toEqual({
      isSaving: false,
      tripPlanId: "plan-rain",
    });
    expect(setExpenseDialogSaving(state, true)).toEqual({
      isSaving: true,
      tripPlanId: "plan-main",
    });
  });
});
