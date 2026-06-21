import { type FormEvent, useState } from "react";
import { createPortal } from "react-dom";
import type { Locale } from "@/src/i18n/types";
import { Icon } from "@/src/ui/icons";
import { useEscapeToClose } from "./use-escape-close";
import { cn } from "@/src/lib/cn";
import { subActivityModalCloseClassName } from "../smart-itinerary-table.styles";
import {
  noteModalSaveButtonClassName,
  ticketModalCancelButtonClassName,
  ticketFieldClassName,
  ticketModalBackdropClassName,
  ticketModalBodyClassName,
  ticketModalClassName,
  ticketModalFooterClassName,
  ticketModalHeaderClassName,
  ticketModalTitleClassName,
} from "../smart-itinerary-table.styles";
import type { ItineraryItem } from "@/src/trip/types";
import type { ItineraryAsyncVoidResult } from "../itinerary-action.types";

export function ItineraryNoteModal({
  item,
  locale,
  onClose,
  onSave,
}: {
  item: ItineraryItem;
  locale: Locale;
  onClose: () => void;
  onSave: (body: string) => ItineraryAsyncVoidResult;
}) {
  const [body, setBody] = useState("");
  const [saving, setSaving] = useState(false);
  const title = locale === "th" ? `โน้ตสำหรับ ${item.activity}` : `Note for ${item.activity}`;
  const subtitle =
    locale === "th"
      ? "เก็บรายละเอียดสั้น ๆ ที่เกี่ยวกับ activity นี้"
      : "Capture a short note tied to this activity.";
  const placeholder =
    locale === "th"
      ? "เช่น นัดเจอกันที่ทางออก A, เตรียมพาสปอร์ต"
      : "Example: Meet at exit A, keep passports ready";

  useEscapeToClose(onClose);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = body.trim();
    if (!trimmed || saving) return;
    setSaving(true);
    try {
      await onSave(trimmed);
    } finally {
      setSaving(false);
    }
  }

  if (typeof document === "undefined") return null;

  return createPortal(
    <div className={ticketModalBackdropClassName} role="presentation" onClick={onClose}>
      <div
        className={cn(ticketModalClassName, "max-w-[480px]")}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(event) => event.stopPropagation()}
      >
        <form className="contents" onSubmit={(event) => void submit(event)}>
          <header className={ticketModalHeaderClassName}>
            <strong className={ticketModalTitleClassName}>
              <span>{title}</span>
              <small>{subtitle}</small>
            </strong>
            <button
              type="button"
              className={subActivityModalCloseClassName}
              aria-label={locale === "th" ? "ปิด modal โน้ต" : "Close note modal"}
              onClick={onClose}
            >
              <Icon name="x" />
            </button>
          </header>
          <div className={ticketModalBodyClassName}>
            <label className={cn(ticketFieldClassName, "col-span-full")}>
              <span>{locale === "th" ? "โน้ต" : "Note"}</span>
              <textarea
                autoFocus
                value={body}
                onChange={(event) => setBody(event.target.value)}
                placeholder={placeholder}
              />
            </label>
          </div>
          <footer className={ticketModalFooterClassName}>
            <button
              type="button"
              className={ticketModalCancelButtonClassName}
              onClick={onClose}
            >
              {locale === "th" ? "ยกเลิก" : "Cancel"}
            </button>
            <button
              type="submit"
              className={noteModalSaveButtonClassName}
              disabled={saving || !body.trim()}
            >
              <Icon name="note" />
              {locale === "th" ? "บันทึกโน้ต" : "Save note"}
            </button>
          </footer>
        </form>
      </div>
    </div>,
    document.body,
  );
}
