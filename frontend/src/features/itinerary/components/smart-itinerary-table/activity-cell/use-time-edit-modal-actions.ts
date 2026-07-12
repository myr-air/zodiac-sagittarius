import type { Dispatch, FormEvent, SetStateAction } from "react";
import type { InlineItineraryItemPatch } from "@/src/trip/itinerary-items";
import type { TimeEditModalModel } from "@/src/features/itinerary/domain/time-edit-modal-model";
import type { TimeEditModalProps } from "./time-components.types";
import {
  setTimeEditModalSaving,
  type TimeEditModalFormState,
} from "./time-edit-modal-state";

interface UseTimeEditModalActionsOptions {
  model: TimeEditModalModel;
  onClose: () => void;
  onSave: TimeEditModalProps["onSave"];
  setState: Dispatch<SetStateAction<TimeEditModalFormState>>;
  state: TimeEditModalFormState;
}

export function buildTimeEditModalSavePatch({
  derivedDuration,
  state,
}: {
  derivedDuration: number | null;
  state: TimeEditModalFormState;
}): InlineItineraryItemPatch {
  const trimmedEndTime = state.endTime.trim();

  return {
    startTime: state.startTime.trim(),
    endTime: trimmedEndTime || null,
    endOffsetDays: trimmedEndTime ? state.endOffsetDays : 0,
    durationMinutes: trimmedEndTime ? derivedDuration : null,
  };
}

export function useTimeEditModalActions({
  model,
  onClose,
  onSave,
  setState,
  state,
}: UseTimeEditModalActionsOptions) {
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (state.saving || model.startError || model.endError) return;
    setState((current) => setTimeEditModalSaving(current, true));
    try {
      await onSave(
        buildTimeEditModalSavePatch({
          derivedDuration: model.derivedDuration,
          state,
        }),
      );
      onClose();
    } finally {
      setState((current) => setTimeEditModalSaving(current, false));
    }
  }

  return {
    save,
  };
}
