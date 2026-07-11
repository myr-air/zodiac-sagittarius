import { useCallback, useEffect, useRef, useState } from "react";
import { useT } from "@/src/i18n/use-t";
import { parseItineraryImportDocument } from "@/src/trip/itinerary-import-export/itinerary-import-parser";
import type { ItineraryExportItem } from "@/src/trip/itinerary-import-export/itinerary-import-export-types";
import type { InlineImportAreaProps } from "./InlineImportArea.types";
import {
  inlineImportAreaActionsClassName,
  inlineImportAreaApplyButtonClassName,
  inlineImportAreaCancelButtonClassName,
  inlineImportAreaEmptyClassName,
  inlineImportAreaErrorClassName,
  inlineImportAreaMoreRowsClassName,
  inlineImportAreaNoteCellClassName,
  inlineImportAreaPanelClassName,
  inlineImportAreaPreviewTitleClassName,
  inlineImportAreaTableCellClassName,
  inlineImportAreaTableClassName,
  inlineImportAreaTableHeaderCellClassName,
  inlineImportAreaTableHeaderClassName,
  inlineImportAreaTableRowClassName,
  inlineImportAreaTextareaClassName,
} from "./InlineImportArea.styles";

const PREVIEW_ROW_LIMIT = 3;
const PARSE_DEBOUNCE_MS = 300;

export function InlineImportArea({ onApply, onCancel }: InlineImportAreaProps) {
  const { t } = useT();
  const [text, setText] = useState("");
  const [parseError, setParseError] = useState<string | null>(null);
  const [parsedItems, setParsedItems] = useState<ItineraryExportItem[]>([]);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const handleChange = useCallback((value: string) => {
    setText(value);
    setParseError(null);

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (!value.trim()) {
      setParsedItems([]);
      return;
    }

    debounceRef.current = setTimeout(() => {
      try {
        const doc = parseItineraryImportDocument(value);
        setParsedItems(doc.items.slice(0, 100));
        setParseError(null);
      } catch (err) {
        setParseError(err instanceof Error ? err.message : "Parse error");
        setParsedItems([]);
      }
    }, PARSE_DEBOUNCE_MS);
  }, []);

  const handleApply = useCallback(() => {
    if (text.trim()) {
      onApply(text);
    }
  }, [text, onApply]);

  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  const previewRows = parsedItems.slice(0, PREVIEW_ROW_LIMIT);
  const hasText = text.trim().length > 0;
  const isWhitespaceOnly = text.length > 0 && !text.trim();

  return (
    <div className={inlineImportAreaPanelClassName} data-testid="inline-import-area">
      <label className="mb-1 block text-sm font-semibold text-(--color-text)">
        {t.detailPlanner.importPasteLabel}
      </label>
      <textarea
        className={inlineImportAreaTextareaClassName}
        value={text}
        onChange={(event) => handleChange(event.target.value)}
        placeholder={t.detailPlanner.importPastePlaceholder}
        rows={6}
        aria-label={t.detailPlanner.importPasteLabel}
      />

      {parseError ? (
        <div className={inlineImportAreaErrorClassName} role="alert">
          {parseError}
        </div>
      ) : null}

      {previewRows.length > 0 ? (
        <div className="mt-3">
          <div className={inlineImportAreaPreviewTitleClassName}>
            {`${t.detailPlanner.importPreviewRows} (${parsedItems.length} items)`}
          </div>
          <table className={inlineImportAreaTableClassName}>
            <thead>
              <tr className={inlineImportAreaTableHeaderClassName}>
                <th className={inlineImportAreaTableHeaderCellClassName}>Day</th>
                <th className={inlineImportAreaTableHeaderCellClassName}>Activity</th>
                <th className={inlineImportAreaTableHeaderCellClassName}>Time</th>
                <th className={inlineImportAreaTableHeaderCellClassName}>Place</th>
                <th className={inlineImportAreaTableHeaderCellClassName}>Notes</th>
              </tr>
            </thead>
            <tbody>
              {previewRows.map((item, index) => (
                <tr
                  key={`${item.id}-${index}`}
                  className={inlineImportAreaTableRowClassName}
                >
                  <td className={inlineImportAreaTableCellClassName}>
                    {item.day || "—"}
                  </td>
                  <td className={inlineImportAreaTableCellClassName}>
                    {item.activity || "—"}
                  </td>
                  <td className={inlineImportAreaTableCellClassName}>
                    {item.startTime || "—"}
                  </td>
                  <td className={inlineImportAreaTableCellClassName}>
                    {item.place || "—"}
                  </td>
                  <td
                    className={`${inlineImportAreaTableCellClassName} ${inlineImportAreaNoteCellClassName}`}
                  >
                    {item.note || "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {parsedItems.length > PREVIEW_ROW_LIMIT ? (
            <div className={inlineImportAreaMoreRowsClassName}>
              +{parsedItems.length - PREVIEW_ROW_LIMIT} more rows
            </div>
          ) : null}
        </div>
      ) : isWhitespaceOnly && !parseError ? (
        <div className={inlineImportAreaEmptyClassName}>No data detected</div>
      ) : null}

      <div className={inlineImportAreaActionsClassName}>
        <button
          type="button"
          onClick={handleApply}
          disabled={!hasText || parsedItems.length === 0}
          className={inlineImportAreaApplyButtonClassName}
        >
          {t.detailPlanner.conversionAccept}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className={inlineImportAreaCancelButtonClassName}
        >
          {t.common.actions.cancel}
        </button>
      </div>
    </div>
  );
}
