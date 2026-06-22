import { stopDialogFieldIds } from "./stop-dialog-field-ids";
import type { StopDetailFieldsProps } from "./stop-dialog.types";

export function StopDialogDetails({ detailLabels, detailType, detailValues, updateDetail }: StopDetailFieldsProps) {
  if (detailType === "transportation") {
    return (
      <>
        <DetailInput
          id={stopDialogFieldIds.origin}
          label={detailLabels.fields.origin}
          value={detailValues.origin}
          onChange={(value) => updateDetail("origin", value)}
        />
        <DetailInput
          id={stopDialogFieldIds.destination}
          label={detailLabels.fields.destination}
          value={detailValues.destination}
          onChange={(value) => updateDetail("destination", value)}
        />
        <DetailInput
          id={stopDialogFieldIds.mode}
          label={detailLabels.fields.mode}
          value={detailValues.mode}
          onChange={(value) => updateDetail("mode", value)}
        />
        <DetailInput
          id={stopDialogFieldIds.ticketRef}
          label={detailLabels.fields.ticketRef}
          value={detailValues.ticketRef}
          onChange={(value) => updateDetail("ticketRef", value)}
        />
        <DetailInput
          id={stopDialogFieldIds.costNote}
          label={detailLabels.fields.costNote}
          value={detailValues.costNote}
          onChange={(value) => updateDetail("costNote", value)}
        />
      </>
    );
  }

  if (detailType === "stay") {
    return (
      <>
        <DetailInput
          id={stopDialogFieldIds.entryWindow}
          label={detailLabels.fields.checkWindow}
          value={detailValues.entryWindow}
          onChange={(value) => updateDetail("entryWindow", value)}
        />
        <DetailInput
          id={stopDialogFieldIds.bookingRef}
          label={detailLabels.fields.bookingRef}
          value={detailValues.bookingRef}
          onChange={(value) => updateDetail("bookingRef", value)}
        />
        <DetailInput
          id={stopDialogFieldIds.detail}
          label={detailLabels.fields.luggageDetail}
          value={detailValues.detail}
          onChange={(value) => updateDetail("detail", value)}
        />
      </>
    );
  }

  if (detailType === "task") {
    return (
      <>
        <DetailInput
          id={stopDialogFieldIds.detail}
          label={detailLabels.fields.detail}
          value={detailValues.detail}
          onChange={(value) => updateDetail("detail", value)}
        />
        <DetailInput
          id={stopDialogFieldIds.meetingPoint}
          label={detailLabels.fields.relatedPlace}
          value={detailValues.meetingPoint}
          onChange={(value) => updateDetail("meetingPoint", value)}
        />
      </>
    );
  }

  return (
    <>
      <DetailInput
        id={stopDialogFieldIds.provider}
        label={detailLabels.fields.provider}
        value={detailValues.provider}
        onChange={(value) => updateDetail("provider", value)}
      />
      <DetailInput
        id={stopDialogFieldIds.meetingPoint}
        label={detailLabels.fields.meetingPoint}
        value={detailValues.meetingPoint}
        onChange={(value) => updateDetail("meetingPoint", value)}
      />
      <DetailInput
        id={stopDialogFieldIds.bookingRef}
        label={detailLabels.fields.bookingRef}
        value={detailValues.bookingRef}
        onChange={(value) => updateDetail("bookingRef", value)}
      />
    </>
  );
}

function DetailInput({ id, label, onChange, value }: { id: string; label: string; onChange: (value: string) => void; value: string }) {
  return (
    <label htmlFor={id}>
      <span>{label}</span>
      <input id={id} value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}
