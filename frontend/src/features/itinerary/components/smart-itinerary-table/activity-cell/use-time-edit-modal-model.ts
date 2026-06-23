import { useState } from "react";

import { buildTimeEditModalModel } from "@/src/features/itinerary/domain/time-edit-modal-model";

import type { TimeEditModalProps } from "./time-components.types";
import {
  initialTimeEditModalFormState,
  toggleTimeEditModalEndOffsetDays,
  updateTimeEditModalEndTime,
  updateTimeEditModalStartTime,
} from "./time-edit-modal-state";
import { useTimeEditModalActions } from "./use-time-edit-modal-actions";

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
  const actions = useTimeEditModalActions({
    model,
    onClose,
    onSave,
    setState,
    state,
  });

  function updateStartTime(nextStartTime: string) {
    setState((current) =>
      updateTimeEditModalStartTime(current, nextStartTime),
    );
  }

  function updateEndTime(nextEndTime: string) {
    setState((current) => updateTimeEditModalEndTime(current, nextEndTime));
  }

  return {
    endOffsetDays: state.endOffsetDays,
    endTime: state.endTime,
    model,
    save: actions.save,
    saving: state.saving,
    startTime: state.startTime,
    toggleEndOffsetDays: () =>
      setState((current) => toggleTimeEditModalEndOffsetDays(current)),
    updateEndTime,
    updateStartTime,
  };
}
