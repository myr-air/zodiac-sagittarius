import type { Dispatch, FormEventHandler, SetStateAction } from "react";
import { useI18n } from "@/src/i18n/I18nProvider";
import { cn } from "@/src/lib/cn";
import { Button, FieldLabel, WorkspaceSurface } from "@/src/ui";
import { DatePickerField } from "@/src/shared/components/date-time-pickers";
import { tripPartySizeRange } from "@/src/trip/settings";
import * as settingsStyles from "../TripSettingsPage.styles";
import type { TripSettingsFormValues } from "../TripSettingsPage.types";

interface TripSettingsFormProps {
  canEdit: boolean;
  canSubmit: boolean;
  error: string | null;
  form: TripSettingsFormValues;
  invalidDateRange: boolean;
  setForm: Dispatch<SetStateAction<TripSettingsFormValues>>;
  status: "idle" | "saving" | "saved" | "error";
  onSubmit: FormEventHandler<HTMLFormElement>;
}

export function TripSettingsForm({
  canEdit,
  canSubmit,
  error,
  form,
  invalidDateRange,
  setForm,
  status,
  onSubmit,
}: TripSettingsFormProps) {
  const { t } = useI18n();

  return (
    <WorkspaceSurface
      as="form"
      className={settingsStyles.formClassName}
      aria-label={t.tripSettings.tripDetails}
      onSubmit={onSubmit}
    >
      <h2 className="text-[16px] font-[900] text-(--color-text)">{t.tripSettings.tripDetails}</h2>
      <FieldLabel>
        <span>{t.tripSettings.tripName}</span>
        <input
          className={settingsStyles.inputClassName}
          disabled={!canEdit}
          value={form.name}
          onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
        />
      </FieldLabel>
      <FieldLabel>
        <span>{t.tripSettings.destination}</span>
        <input
          className={settingsStyles.inputClassName}
          disabled={!canEdit}
          value={form.destinationLabel}
          onChange={(event) => setForm((current) => ({ ...current, destinationLabel: event.target.value }))}
        />
      </FieldLabel>
      <div className={settingsStyles.fieldGridClassName}>
        <FieldLabel>
          <span>{t.tripSettings.startDate}</span>
          <DatePickerField
            className={settingsStyles.inputClassName}
            disabled={!canEdit}
            value={form.startDate}
            onChange={(value) => setForm((current) => ({ ...current, startDate: value }))}
          />
        </FieldLabel>
        <FieldLabel>
          <span>{t.tripSettings.endDate}</span>
          <DatePickerField
            className={settingsStyles.inputClassName}
            disabled={!canEdit}
            value={form.endDate}
            onChange={(value) => setForm((current) => ({ ...current, endDate: value }))}
          />
        </FieldLabel>
      </div>
      <div className={settingsStyles.fieldGridClassName}>
        <FieldLabel>
          <span>{t.tripSettings.partySize}</span>
          <input
            className={settingsStyles.inputClassName}
            disabled={!canEdit}
            min={tripPartySizeRange.min}
            type="number"
            value={form.partySize}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                partySize: Number(event.target.value),
              }))
            }
          />
        </FieldLabel>
        <FieldLabel>
          <span>{t.tripSettings.defaultTimezone}</span>
          <input
            className={settingsStyles.inputClassName}
            disabled={!canEdit}
            value={form.defaultTimezone}
            onChange={(event) => setForm((current) => ({ ...current, defaultTimezone: event.target.value }))}
          />
        </FieldLabel>
      </div>
      {!canEdit ? (
        <p className={cn(settingsStyles.messageClassName, settingsStyles.errorClassName)}>
          {t.tripSettings.editLocked}
        </p>
      ) : null}
      {invalidDateRange ? (
        <p className={cn(settingsStyles.messageClassName, settingsStyles.errorClassName)}>
          {t.tripSettings.invalidDate}
        </p>
      ) : null}
      {error ? <p className={cn(settingsStyles.messageClassName, settingsStyles.errorClassName)}>{error}</p> : null}
      {status === "saved" ? (
        <p className={cn(settingsStyles.messageClassName, settingsStyles.successClassName)}>
          {t.tripSettings.saved}
        </p>
      ) : null}
      <div className={settingsStyles.actionRowClassName}>
        <Button type="submit" disabled={!canSubmit}>
          {status === "saving" ? t.tripSettings.saving : t.tripSettings.save}
        </Button>
      </div>
    </WorkspaceSurface>
  );
}
