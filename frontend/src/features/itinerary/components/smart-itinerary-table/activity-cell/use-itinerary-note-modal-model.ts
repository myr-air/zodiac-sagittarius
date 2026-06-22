import { type FormEvent, useState } from "react";

import type { Locale } from "@/src/i18n/types";
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
  const copy =
    locale === "th"
      ? {
          cancel: "ยกเลิก",
          close: "ปิด modal โน้ต",
          label: "โน้ต",
          placeholder: "เช่น นัดเจอกันที่ทางออก A, เตรียมพาสปอร์ต",
          save: "บันทึกโน้ต",
          subtitle: "เก็บรายละเอียดสั้น ๆ ที่เกี่ยวกับ activity นี้",
          title: `โน้ตสำหรับ ${item.activity}`,
        }
      : {
          cancel: "Cancel",
          close: "Close note modal",
          label: "Note",
          placeholder: "Example: Meet at exit A, keep passports ready",
          save: "Save note",
          subtitle: "Capture a short note tied to this activity.",
          title: `Note for ${item.activity}`,
        };

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
