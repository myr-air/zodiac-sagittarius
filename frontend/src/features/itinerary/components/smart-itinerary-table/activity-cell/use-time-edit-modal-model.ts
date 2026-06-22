import { type FormEvent, useState } from "react";

import {
  endOffsetDaysBetweenTimes,
} from "@/src/features/itinerary/domain/itinerary-item-editing";
import { buildTimeEditModalModel } from "@/src/features/itinerary/domain/time-edit-modal-model";

import type { TimeEditModalProps } from "./time-components.types";

export function useTimeEditModalModel({
  item,
  locale,
  onClose,
  onSave,
}: Pick<TimeEditModalProps, "item" | "locale" | "onClose" | "onSave">) {
  const [startTime, setStartTime] = useState(item.startTime ?? "");
  const [endTime, setEndTime] = useState(item.endTime ?? "");
  const [endOffsetDays, setEndOffsetDays] = useState(
    item.endTime ? item.endOffsetDays ?? 0 : 0,
  );
  const [saving, setSaving] = useState(false);
  const model = buildTimeEditModalModel({
    endOffsetDays,
    endTime,
    locale,
    startTime,
  });

  function updateStartTime(nextStartTime: string) {
    setStartTime(nextStartTime);
    if (!endTime) return;
    setEndOffsetDays(endOffsetDaysBetweenTimes(nextStartTime, endTime));
  }

  function updateEndTime(nextEndTime: string) {
    setEndTime(nextEndTime);
    setEndOffsetDays(
      nextEndTime ? endOffsetDaysBetweenTimes(startTime, nextEndTime) : 0,
    );
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving || model.errorMessage) return;
    const trimmedEndTime = endTime.trim();
    setSaving(true);
    try {
      await onSave({
        startTime: startTime.trim(),
        endTime: trimmedEndTime || null,
        endOffsetDays: trimmedEndTime ? endOffsetDays : 0,
        durationMinutes: trimmedEndTime ? model.derivedDuration : null,
      });
      onClose();
    } finally {
      setSaving(false);
    }
  }

  return {
    endOffsetDays,
    endTime,
    model,
    save,
    saving,
    startTime,
    toggleEndOffsetDays: () =>
      setEndOffsetDays((current) => (current > 0 ? 0 : 1)),
    updateEndTime,
    updateStartTime,
  };
}
