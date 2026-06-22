import { type FormEvent, useState } from "react";

import type { Locale } from "@/src/i18n/types";
import { itineraryNoteModalCopy } from "@/src/features/itinerary/domain/itinerary-note-display";
import type { ItineraryItem } from "@/src/trip/types";

import type { ItineraryAsyncVoidResult } from "../itinerary-action.types";
import {
  initialItineraryNoteModalState,
  setItineraryNoteModalSaving,
  updateItineraryNoteModalBody,
} from "./itinerary-note-modal-state";

export function useItineraryNoteModalModel({
  item,
  locale,
  onSave,
}: {
  item: ItineraryItem;
  locale: Locale;
  onSave: (body: string) => ItineraryAsyncVoidResult;
}) {
  const [state, setState] = useState(initialItineraryNoteModalState);
  const copy = itineraryNoteModalCopy(item, locale);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = state.body.trim();
    if (!trimmed || state.saving) return;
    setState((current) => setItineraryNoteModalSaving(current, true));
    try {
      await onSave(trimmed);
    } finally {
      setState((current) => setItineraryNoteModalSaving(current, false));
    }
  }

  return {
    body: state.body,
    copy,
    saving: state.saving,
    setBody: (body: string) =>
      setState((current) => updateItineraryNoteModalBody(current, body)),
    submit,
  };
}
