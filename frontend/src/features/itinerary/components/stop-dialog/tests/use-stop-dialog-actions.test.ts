import type { FormEvent } from "react";
import { useState } from "react";
import { act, renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { StopFormValues } from "@/src/features/itinerary/domain/stop-form-values";
import { initialStopDialogSubmitState } from "../stop-dialog-submit-state";
import { useStopDialogActions } from "../use-stop-dialog-actions";

const submitValues: StopFormValues = {
  activity: "Dim sum",
  activityType: "food",
  day: "2026-06-18",
  details: {},
  durationMinutes: null,
  endOffsetDays: 0,
  endTime: null,
  isPlanBlock: false,
  itemKind: "activity",
  note: "",
  place: "",
  priority: "normal",
  startTime: "",
  status: "idea",
  timeMode: "flexible",
  transportation: "",
};

function createHook(options: {
  onSubmit?: (values: StopFormValues) => void | Promise<void>;
} = {}) {
  const buildSubmitValues = vi.fn((saveUnresolved: boolean) => ({
    ...submitValues,
    saveUnresolved,
  }));
  const onSubmit = vi.fn(options.onSubmit ?? (() => undefined));
  const hook = renderHook(() => {
    const [submitState, setSubmitState] = useState(
      initialStopDialogSubmitState,
    );
    const actions = useStopDialogActions({
      buildSubmitValues,
      onSubmit,
      saveFailedMessage: "Could not save stop",
      setSubmitState,
    });

    return {
      ...actions,
      submitState,
    };
  });

  return { ...hook, buildSubmitValues, onSubmit };
}

function submitForm(result: ReturnType<typeof createHook>["result"]) {
  const preventDefault = vi.fn();

  act(() => {
    result.current.handleSubmit({
      preventDefault,
    } as unknown as FormEvent<HTMLFormElement>);
  });

  return preventDefault;
}

describe("useStopDialogActions", () => {
  it("submits draft values and returns to idle on success", async () => {
    const { result, buildSubmitValues, onSubmit } = createHook();
    const preventDefault = submitForm(result);

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({
        ...submitValues,
        saveUnresolved: false,
      });
    });

    expect(preventDefault).toHaveBeenCalledTimes(1);
    expect(buildSubmitValues).toHaveBeenCalledWith(false);
    await waitFor(() => {
      expect(result.current.submitState).toBe(initialStopDialogSubmitState);
    });
  });

  it("submits unresolved drafts with the unresolved flag", async () => {
    const { result, buildSubmitValues, onSubmit } = createHook();

    act(() => {
      result.current.submitUnresolved();
    });

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({
        ...submitValues,
        saveUnresolved: true,
      });
    });

    expect(buildSubmitValues).toHaveBeenCalledWith(true);
  });

  it("keeps the failure message after a rejected submit", async () => {
    const { result } = createHook({
      onSubmit: async () => {
        throw new Error("save failed");
      },
    });

    submitForm(result);

    await waitFor(() => {
      expect(result.current.submitState).toEqual({
        isSubmitting: false,
        submitError: "Could not save stop",
      });
    });
  });
});
