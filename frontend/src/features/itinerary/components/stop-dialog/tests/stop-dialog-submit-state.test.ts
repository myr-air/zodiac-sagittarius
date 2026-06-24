import { describe, expect, it } from "vitest";

import {
  beginStopDialogSubmit,
  clearStopDialogSubmitError,
  completeStopDialogSubmit,
  failStopDialogSubmit,
  initialStopDialogSubmitState,
} from "../stop-dialog-submit-state";

describe("stop dialog submit state", () => {
  it("starts idle with no submit error", () => {
    expect(initialStopDialogSubmitState).toEqual({
      isSubmitting: false,
      submitError: null,
    });
  });

  it("clears stale errors when submission begins", () => {
    expect(beginStopDialogSubmit()).toEqual({
      isSubmitting: true,
      submitError: null,
    });
  });

  it("stores save failures and returns to idle", () => {
    expect(failStopDialogSubmit("Could not save")).toEqual({
      isSubmitting: false,
      submitError: "Could not save",
    });
  });

  it("clears existing errors without changing already clean state", () => {
    expect(
      clearStopDialogSubmitError({
        isSubmitting: false,
        submitError: "Could not save",
      }),
    ).toEqual({
      isSubmitting: false,
      submitError: null,
    });

    expect(clearStopDialogSubmitError(initialStopDialogSubmitState)).toBe(
      initialStopDialogSubmitState,
    );
  });

  it("completes successful submissions back to the initial state", () => {
    expect(completeStopDialogSubmit()).toBe(initialStopDialogSubmitState);
  });
});
