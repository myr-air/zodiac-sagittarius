import {
  type StopDetailType,
  type StopDetailValues,
  stopDetailLabels,
} from "@/src/features/itinerary/domain/stop-details";
import {
  advancedDetailsClassName,
  advancedDetailsGridClassName,
  dialogFieldWideClassName,
} from "./stop-dialog.styles";
import { stopDialogFieldIds } from "./stop-dialog-field-ids";
import { StopDialogDetails } from "./StopDialogDetails";

export function StopDialogDetailSection({
  detailLabels,
  detailType,
  detailValues,
  isFocusedEdit,
  mapLink,
  mapLinkLabel,
  moreDetailsLabel,
  onMapLinkChange,
  updateDetail,
}: {
  detailLabels: ReturnType<typeof stopDetailLabels>;
  detailType: StopDetailType;
  detailValues: StopDetailValues;
  isFocusedEdit: boolean;
  mapLink: string | null | undefined;
  mapLinkLabel: string;
  moreDetailsLabel: string;
  onMapLinkChange: (mapLink: string) => void;
  updateDetail: <K extends keyof StopDetailValues>(
    key: K,
    value: StopDetailValues[K],
  ) => void;
}) {
  const fields = (
    <>
      <label
        className={dialogFieldWideClassName}
        htmlFor={stopDialogFieldIds.mapLink}
      >
        <span>{mapLinkLabel}</span>
        <input
          id={stopDialogFieldIds.mapLink}
          type="url"
          inputMode="url"
          value={mapLink ?? ""}
          onChange={(event) => onMapLinkChange(event.target.value)}
          placeholder="https://maps.google.com/... or https://uri.amap.com/..."
        />
      </label>
      <StopDialogDetails
        detailLabels={detailLabels}
        detailType={detailType}
        detailValues={detailValues}
        updateDetail={updateDetail}
      />
    </>
  );

  if (!isFocusedEdit) return fields;

  return (
    <details className={advancedDetailsClassName}>
      <summary>{moreDetailsLabel}</summary>
      <div className={advancedDetailsGridClassName}>
        {fields}
      </div>
    </details>
  );
}
