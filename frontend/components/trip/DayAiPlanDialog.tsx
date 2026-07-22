"use client";

/**
 * DayAiPlanDialog — Why + Affects + Accept/Reject (M80VKAX5 T10).
 * Accept/Reject hit day-plan-assist only; Accept dismisses sibling batch options.
 * No parallel frontend itinerary-items write path.
 */

import { useId, useState } from "react";
import {
  acceptDayPlanAssistOption,
  rejectDayPlanAssistOption,
  type DayPlanAssistOption,
} from "../../src/trip/day-plan-assist-api";

export type DayAiPlanDialogProps = {
  open: boolean;
  tripId: string;
  batchId: string;
  sessionToken: string;
  apiBaseUrl?: string;
  fetch?: typeof fetch;
  option: DayPlanAssistOption;
  batchOptions: DayPlanAssistOption[];
  affectLabels: string[];
  subtitle?: string;
  onClose: () => void;
  onBatchResolved: (result: { openOptionIds: string[] }) => void;
};

function nextClientMutationId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `day-plan-assist-${Date.now()}`;
}

function openOptionIdsFromStatuses(
  options: { id: string; status: string }[],
): string[] {
  return options
    .filter((row) => row.status === "open")
    .map((row) => row.id);
}

/**
 * Full plan dialog — Accept applies via assist; Reject does not mutate itinerary.
 */
export function DayAiPlanDialog({
  open,
  tripId,
  batchId,
  sessionToken,
  apiBaseUrl = "",
  fetch: fetchImpl = fetch,
  option,
  affectLabels,
  subtitle,
  onClose,
  onBatchResolved,
}: DayAiPlanDialogProps) {
  const titleId = useId();
  const [busy, setBusy] = useState(false);

  if (!open) return null;

  const title = `Plan ${option.label} · ${option.title}`;
  const affectsText =
    affectLabels.length > 0
      ? `Affects: ${affectLabels.join(" · ")}`
      : "Affects:";

  async function handleAccept() {
    if (busy) return;
    setBusy(true);
    try {
      const outcome = await acceptDayPlanAssistOption(
        {
          tripId,
          batchId,
          optionId: option.id,
          sessionToken,
          clientMutationId: nextClientMutationId(),
        },
        { fetch: fetchImpl, apiBaseUrl },
      );
      if (!outcome.ok) return;
      onBatchResolved({
        openOptionIds: openOptionIdsFromStatuses(outcome.options),
      });
    } finally {
      setBusy(false);
    }
  }

  async function handleReject() {
    if (busy) return;
    setBusy(true);
    try {
      const outcome = await rejectDayPlanAssistOption(
        {
          tripId,
          batchId,
          optionId: option.id,
          sessionToken,
          clientMutationId: nextClientMutationId(),
        },
        { fetch: fetchImpl, apiBaseUrl },
      );
      if (!outcome.ok) return;
      onBatchResolved({
        openOptionIds: openOptionIdsFromStatuses(outcome.options),
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="stop-dlg open" id="plan-dialog">
      <div className="stop-dlg-backdrop" onClick={onClose} />
      <div
        className="stop-dlg-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <div className="dlg-head flex items-start justify-between gap-3">
          <div>
            <h3 id={titleId} className="m-0 text-base font-semibold">
              {title}
            </h3>
            {subtitle ? (
              <p className="m-0 mt-0.5 text-[12px] text-(--color-text-muted)">
                {subtitle}
              </p>
            ) : null}
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

        <div className="stop-dlg-body mt-3 flex flex-col gap-3">
          {option.summary ? (
            <p className="change m-0 text-[13px] text-(--color-text)">
              {option.summary}
            </p>
          ) : null}
          <div className="plan-reason">
            <strong className="block text-[12px] font-semibold text-(--color-text)">
              Why
            </strong>
            <span className="mt-1 block text-[13px] text-(--color-text-muted)">
              {option.why}
            </span>
          </div>
          <p className="plan-affects m-0 text-[12px] font-medium text-(--color-text)">
            {affectsText}
          </p>
        </div>

        <div className="stop-dlg-foot mt-4 flex justify-end gap-2">
          <button
            type="button"
            className="reject"
            disabled={busy}
            onClick={() => void handleReject()}
          >
            Reject
          </button>
          <button
            type="button"
            className="accept btn-primary"
            disabled={busy}
            onClick={() => void handleAccept()}
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  );
}
