"use client";

/**
 * ItineraryImportDialog — paste → normalize → preview → Confirm append (M81HY2YR T4/T5).
 * Landmarks from places-bulk-ingest-draft-v1.html #dlg-import.
 * Confirm calls applyItineraryImport (sequential CRUD + id remap).
 */

import { useEffect, useId, useRef, useState } from "react";
import {
  normalizeItineraryImport,
  type ItineraryImportItem,
} from "../../src/trip/itinerary-import-api";
import { applyItineraryImport } from "../../src/trip/itinerary-import-apply";

export type ItineraryImportDialogProps = {
  open: boolean;
  tripId: string;
  sessionToken: string;
  apiBaseUrl: string;
  planVariantId: string;
  planLabel: string;
  onClose: () => void;
  /** Optional — shell reloads cockpit after a fully successful import. */
  onImported?: () => void;
  fetch?: typeof fetch;
};

/**
 * Draft import dialog — Preview POSTs itinerary-imports (mode auto/json)
 * and Confirm appends via applyItineraryImport into the visible plan.
 * Parent remounts via `key` on each open so fields start fresh (no reset effect).
 */
export function ItineraryImportDialog({
  open,
  tripId,
  sessionToken,
  apiBaseUrl,
  planVariantId,
  planLabel,
  onClose,
  onImported,
  fetch: fetchImpl = fetch,
}: ItineraryImportDialogProps) {
  const titleId = useId();
  const restoreFocusRef = useRef<HTMLElement | null>(null);
  const [content, setContent] = useState("");
  const [previewItems, setPreviewItems] = useState<ItineraryImportItem[]>([]);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [previewing, setPreviewing] = useState(false);
  const [applying, setApplying] = useState(false);
  const [applyError, setApplyError] = useState<string | null>(null);

  // Mirror AccountSettings*: Escape closes; cleanup restores focus to the opener.
  useEffect(() => {
    if (!open) return;

    const active = document.activeElement;
    if (active instanceof HTMLElement) {
      restoreFocusRef.current = active;
    }

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    }

    document.addEventListener("keydown", onKeyDown, true);
    return () => {
      document.removeEventListener("keydown", onKeyDown, true);
      const restore = restoreFocusRef.current;
      restoreFocusRef.current = null;
      if (restore && typeof restore.focus === "function") {
        restore.focus();
      }
    };
  }, [open, onClose]);

  if (!open) return null;

  const errorMessage = applyError ?? previewError;

  async function handlePreview() {
    if (previewing) return;
    setPreviewing(true);
    setPreviewError(null);
    setApplyError(null);
    try {
      const outcome = await normalizeItineraryImport(
        {
          tripId,
          sessionToken,
          content,
          mode: "auto",
        },
        { fetch: fetchImpl, apiBaseUrl },
      );
      if (!outcome.ok) {
        setPreviewItems([]);
        setPreviewError(
          outcome.error ||
            "Could not read that import. Check the JSON, or try again later if text import is unavailable.",
        );
        return;
      }
      setPreviewItems(outcome.document.items);
      setPreviewError(null);
    } finally {
      setPreviewing(false);
    }
  }

  async function handleConfirm() {
    if (applying || previewItems.length === 0) return;
    setApplying(true);
    setApplyError(null);
    try {
      const outcome = await applyItineraryImport(
        {
          tripId,
          sessionToken,
          planVariantId,
          items: previewItems,
        },
        { fetch: fetchImpl, apiBaseUrl },
      );
      if (!outcome.ok) {
        const detail = outcome.failures
          .map((f) => `${f.importId} (${f.phase}): ${f.error}`)
          .join("; ");
        setApplyError(
          detail ||
            "Some stops could not be imported. Check the list and try again.",
        );
        return;
      }
      onClose();
      onImported?.();
    } finally {
      setApplying(false);
    }
  }

  return (
    <div className="stop-dlg open" id="dlg-import">
      <div className="stop-dlg-backdrop" onClick={onClose} />
      <div
        className="stop-dlg-card import-dlg-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <div className="dlg-head flex items-start justify-between gap-3">
          <div>
            <h3 id={titleId} className="m-0 text-base font-semibold">
              Import itinerary
            </h3>
            <p className="m-0 mt-0.5 text-[12px] text-(--color-text-muted)">
              Paste JSON or free text · appends to {planLabel}
            </p>
          </div>
          <button
            type="button"
            className="dlg-close text-lg leading-none text-(--color-text-muted)"
            aria-label="Close"
            onClick={onClose}
          >
            ×
          </button>
        </div>

        <div className="stop-dlg-body mt-3 flex flex-col gap-3.5">
          <div>
            <div className="step-label mb-1.5 text-[12px] font-bold text-(--color-text-subtle)">
              1 · Paste
            </div>
            <textarea
              aria-label="Import content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="min-h-[120px] w-full resize-y rounded-[var(--radius-sm,10px)] border border-(--color-border) bg-(--color-surface-subtle) px-3 py-3 text-[13px] leading-[1.45] text-(--color-text)"
            />
          </div>

          <div>
            <div className="mb-1.5 flex items-center justify-between gap-2">
              <div className="step-label text-[12px] font-bold text-(--color-text-subtle)">
                2 · Preview
              </div>
              <button
                type="button"
                className="btn"
                disabled={previewing || !content.trim()}
                onClick={() => void handlePreview()}
              >
                Preview
              </button>
            </div>
            {errorMessage ? (
              <div className="error-box" role="alert">
                {errorMessage}
              </div>
            ) : null}
            <div className="preview-list grid gap-2">
              {previewItems.map((item) => (
                <div
                  key={item.id}
                  className="preview-row grid grid-cols-[72px_1fr] gap-2.5 rounded-[var(--radius-sm,10px)] border border-(--color-border) bg-(--color-surface-subtle) px-3 py-2.5"
                >
                  <div className="t text-[12px] font-bold tabular-nums text-(--color-text-muted)">
                    {item.startTime}
                  </div>
                  <div>
                    <strong className="block text-[13px] font-bold text-(--color-text)">
                      {item.activity}
                    </strong>
                    <span className="mt-0.5 block text-[12px] text-(--color-text-subtle)">
                      {item.place}
                      {item.activityType ? ` · ${item.activityType}` : ""}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <p className="hint m-0 text-[12px] leading-[1.45] text-(--color-text-subtle)">
            Confirm appends stops one by one. Existing stops are kept.
          </p>
        </div>

        <div className="stop-dlg-foot mt-4">
          <button type="button" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className="btn-primary"
            disabled={applying || previewItems.length === 0}
            onClick={() => void handleConfirm()}
          >
            Confirm append
          </button>
        </div>
      </div>
    </div>
  );
}
