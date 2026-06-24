import { useState } from "react";

import type { Locale } from "@/src/i18n/types";
import { itineraryNoteModalCopy } from "@/src/features/itinerary/domain/itinerary-note-display";
import type { ItineraryItem } from "@/src/trip/types";

import {
  initialItineraryNoteModalState,
  updateItineraryNoteModalBody,
} from "./itinerary-note-modal-state";
import { useItineraryNoteModalActions } from "./use-itinerary-note-modal-actions";
import type { ItineraryAsyncVoidResult } from "../itinerary-action.types";

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
  const { submit } = useItineraryNoteModalActions({
    onSave,
    setState,
    state,
  });

  return {
    body: state.body,
    copy,
    saving: state.saving,
    setBody: (body: string) =>
      setState((current) => updateItineraryNoteModalBody(current, body)),
    submit,
  };
}
