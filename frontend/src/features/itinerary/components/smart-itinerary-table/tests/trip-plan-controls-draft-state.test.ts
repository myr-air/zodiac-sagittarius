import { describe, expect, it } from "vitest";
import type { PlanVariant } from "@/src/trip/types";
import {
  changeTripPlanEditedNameDraft,
  changeTripPlanNewNameDraft,
  clearTripPlanDraftError,
  closeTripPlanCreateMode,
  failTripPlanDraft,
  initialTripPlanControlDraftState,
  markTripPlanRenamed,
  resetTripPlanSelectionDraft,
  resolveEditedTripPlanName,
  setTripPlanCreateMode,
} from "../trip-plan-controls-draft-state";

const mainPlan = {
  id: "main",
  name: "Main path",
} as PlanVariant;

const rainPlan = {
  id: "rain",
  name: "Rain plan",
} as PlanVariant;

describe("trip plan controls draft state", () => {
  it("starts with no create or rename draft", () => {
    expect(initialTripPlanControlDraftState).toEqual({
      createError: null,
      editedNameDraft: null,
      isCreating: false,
      newName: "",
    });
  });

  it("tracks create mode and closes it by clearing transient create fields", () => {
    const creating = changeTripPlanNewNameDraft(
      setTripPlanCreateMode(initialTripPlanControlDraftState, true),
      "Rain plan",
    );
    const failed = failTripPlanDraft(creating, "Name required");

    expect(closeTripPlanCreateMode(failed)).toEqual({
      ...initialTripPlanControlDraftState,
      editedNameDraft: null,
    });
  });

  it("clears create errors when changing create and rename drafts", () => {
    const failed = failTripPlanDraft(
      initialTripPlanControlDraftState,
      "Name required",
    );

    expect(changeTripPlanNewNameDraft(failed, "Rain plan")).toEqual({
      ...initialTripPlanControlDraftState,
      newName: "Rain plan",
    });
    expect(changeTripPlanEditedNameDraft(failed, rainPlan.id, "Dry plan")).toEqual({
      ...initialTripPlanControlDraftState,
      editedNameDraft: {
        name: "Dry plan",
        planId: rainPlan.id,
      },
    });
  });

  it("resets only selection-scoped draft when changing trip plans", () => {
    const draft = {
      createError: "Name required",
      editedNameDraft: {
        name: "Dry plan",
        planId: rainPlan.id,
      },
      isCreating: true,
      newName: "Backup",
    };

    expect(resetTripPlanSelectionDraft(draft)).toEqual({
      ...draft,
      createError: null,
      editedNameDraft: null,
    });
  });

  it("resolves edited names for the selected plan only", () => {
    const draft = markTripPlanRenamed(
      initialTripPlanControlDraftState,
      rainPlan.id,
      "Storm plan",
    );

    expect(resolveEditedTripPlanName(draft, rainPlan)).toBe("Storm plan");
    expect(resolveEditedTripPlanName(draft, mainPlan)).toBe("Main path");
    expect(resolveEditedTripPlanName(draft, null)).toBe("");
  });

  it("clears draft errors without changing draft values", () => {
    const failed = failTripPlanDraft(
      changeTripPlanNewNameDraft(initialTripPlanControlDraftState, "Rain plan"),
      "Name required",
    );

    expect(clearTripPlanDraftError(failed)).toEqual({
      ...failed,
      createError: null,
    });
  });
});
