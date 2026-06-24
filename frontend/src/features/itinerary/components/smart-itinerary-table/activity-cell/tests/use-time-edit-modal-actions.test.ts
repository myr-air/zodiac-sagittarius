import type { FormEvent } from "react";
import { useState } from "react";
import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { TimeEditModalModel } from "@/src/features/itinerary/domain/time-edit-modal-model";
import type { InlineItineraryItemPatch } from "@/src/trip/itinerary-items";
import type { ItineraryAsyncVoidResult } from "../../itinerary-action.types";
import type { TimeEditModalFormState } from "../time-edit-modal-state";
import {
  buildTimeEditModalSavePatch,
  useTimeEditModalActions,
} from "../use-time-edit-modal-actions";

type SaveTimePatch = (patch: InlineItineraryItemPatch) => ItineraryAsyncVoidResult;

const baseState: TimeEditModalFormState = {
  endOffsetDays: 0,
  endTime: "09:30",
  saving: false,
  startTime: " 08:00 ",
};

const validModel: TimeEditModalModel = {
  closeLabel: "Close time editor",
  derivedDuration: 90,
  durationLabel: "Duration: 1h 30m",
  endLabel: "End time",
  errorMessage: null,
  nextDayEndLabel: "Next day end",
  optionalEndHint: "End time is optional.",
  previewLabel: "1h 30m",
  previewWindow: "08:00-09:30",
  startLabel: "Start time",
  timeFormatHint: "Use 24-hour time.",
};

function createHook(options: {
  model?: TimeEditModalModel;
  onSave?: SaveTimePatch;
  state?: TimeEditModalFormState;
} = {}) {
  const onClose = vi.fn();
  const onSave = options.onSave ?? vi.fn<SaveTimePatch>();
  const hook = renderHook(() => {
    const [state, setState] = useState(options.state ?? baseState);
    const actions = useTimeEditModalActions({
      model: options.model ?? validModel,
      onClose,
      onSave,
      setState,
      state,
    });

    return {
      ...actions,
      state,
    };
  });

  return { ...hook, onClose, onSave };
}

function submit(result: ReturnType<typeof createHook>["result"]) {
  const preventDefault = vi.fn();

  act(() => {
    void result.current.save({
      preventDefault,
    } as unknown as FormEvent<HTMLFormElement>);
  });

  return preventDefault;
}

describe("time edit modal actions", () => {
  it("builds a trimmed save patch with derived duration", () => {
    expect(
      buildTimeEditModalSavePatch({
        derivedDuration: 90,
        state: baseState,
      }),
    ).toEqual({
      startTime: "08:00",
      endTime: "09:30",
      endOffsetDays: 0,
      durationMinutes: 90,
    });
  });

  it("clears end time fields when the end time is blank", () => {
    expect(
      buildTimeEditModalSavePatch({
        derivedDuration: 90,
        state: {
          ...baseState,
          endOffsetDays: 1,
          endTime: "   ",
        },
      }),
    ).toEqual({
      startTime: "08:00",
      endTime: null,
      endOffsetDays: 0,
      durationMinutes: null,
    });
  });

  it("saves valid patches and closes the modal", async () => {
    const { result, onClose, onSave } = createHook();
    const preventDefault = submit(result);

    await vi.waitFor(() => {
      expect(onSave).toHaveBeenCalledWith({
        startTime: "08:00",
        endTime: "09:30",
        endOffsetDays: 0,
        durationMinutes: 90,
      });
    });

    expect(preventDefault).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("does not save while already saving or invalid", async () => {
    const alreadySaving = createHook({
      state: {
        ...baseState,
        saving: true,
      },
    });
    const invalid = createHook({
      model: {
        ...validModel,
        errorMessage: "End time must be after start time",
      },
    });

    submit(alreadySaving.result);
    submit(invalid.result);

    expect(alreadySaving.onSave).not.toHaveBeenCalled();
    expect(invalid.onSave).not.toHaveBeenCalled();
    expect(alreadySaving.onClose).not.toHaveBeenCalled();
    expect(invalid.onClose).not.toHaveBeenCalled();
  });
});
