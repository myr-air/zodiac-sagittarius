import { type FormEvent, useState } from "react";

import { buildTimeEditModalModel } from "@/src/features/itinerary/domain/time-edit-modal-model";

import type { TimeEditModalProps } from "./time-components.types";
import {
  initialTimeEditModalFormState,
  setTimeEditModalSaving,
  toggleTimeEditModalEndOffsetDays,
  updateTimeEditModalEndTime,
  updateTimeEditModalStartTime,
} from "./time-edit-modal-state";

export function useTimeEditModalModel({
  item,
  locale,
  onClose,
  onSave,
}: Pick<TimeEditModalProps, "item" | "locale" | "onClose" | "onSave">) {
  const [state, setState] = useState(() =>
    initialTimeEditModalFormState(item),
  );
  const model = buildTimeEditModalModel({
    endOffsetDays: state.endOffsetDays,
    endTime: state.endTime,
    locale,
    startTime: state.startTime,
  });

  function updateStartTime(nextStartTime: string) {
    setState((current) =>
      updateTimeEditModalStartTime(current, nextStartTime),
    );
  }

  function updateEndTime(nextEndTime: string) {
    setState((current) => updateTimeEditModalEndTime(current, nextEndTime));
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (state.saving || model.errorMessage) return;
    const trimmedEndTime = state.endTime.trim();
    setState((current) => setTimeEditModalSaving(current, true));
    try {
      await onSave({
        startTime: state.startTime.trim(),
        endTime: trimmedEndTime || null,
        endOffsetDays: trimmedEndTime ? state.endOffsetDays : 0,
        durationMinutes: trimmedEndTime ? model.derivedDuration : null,
      });
      onClose();
    } finally {
      setState((current) => setTimeEditModalSaving(current, false));
    }
  }

  return {
    endOffsetDays: state.endOffsetDays,
    endTime: state.endTime,
    model,
    save,
    saving: state.saving,
    startTime: state.startTime,
    toggleEndOffsetDays: () =>
      setState((current) => toggleTimeEditModalEndOffsetDays(current)),
    updateEndTime,
    updateStartTime,
  };
}
