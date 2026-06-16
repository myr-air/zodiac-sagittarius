"use client";

import { useMemo, useState, type FormEvent } from "react";
import { useI18n } from "@/src/i18n/I18nProvider";
import { cn } from "@/src/lib/cn";
import { daysBetweenIsoDates, shiftIsoDate } from "@/src/trip/itinerary-time";
import type { Member, Trip } from "@/src/trip/types";
import { Button, FieldLabel, WorkspacePage, WorkspaceSurface, fieldControlClassName } from "./ui";
import { Icon } from "./icons";
import { DatePickerField } from "./DateTimePickers";
import { PageHeader } from "./PageHeader";

export interface TripSettingsFormValues {
  name: string;
  destinationLabel: string;
  startDate: string;
  endDate: string;
  partySize: number;
  defaultTimezone: string;
}

interface TripSettingsPageProps {
  canEdit: boolean;
  currentMember: Member;
  trip: Trip;
  onSave: (values: TripSettingsFormValues) => Promise<void>;
}

const pageClassName = "trip-settings-page";
const shellClassName = "grid w-full gap-3 max-[1199px]:gap-0";
const contentGridClassName = "content-grid grid grid-cols-[minmax(0,1fr)_300px] gap-3 max-[1199px]:grid-cols-1 max-[1199px]:gap-0 max-[920px]:grid-cols-1";
const formClassName = "grid gap-3.5";
const fieldGridClassName = "field-grid grid grid-cols-2 gap-3 max-[767px]:grid-cols-1";
const inputClassName = cn(fieldControlClassName);
const sideCardClassName = "grid content-start gap-3 bg-(--color-surface)";
const impactLineClassName = "flex items-start gap-2 rounded-(--radius-md) border border-(--color-border) bg-(--color-surface-subtle) p-3 text-[13px] leading-5 text-(--color-text-muted)";
const actionRowClassName = "flex items-center justify-end gap-2 pt-1 max-[767px]:grid max-[767px]:grid-cols-1";
const messageClassName = "text-[13px] font-bold leading-5";
const errorClassName = "text-[#b91c1c]";
const successClassName = "text-[#15803d]";

export function TripSettingsPage({ canEdit, currentMember, trip, onSave }: TripSettingsPageProps) {
  return (
    <TripSettingsPageContent
      key={tripSettingsStateKey(trip)}
      canEdit={canEdit}
      currentMember={currentMember}
      trip={trip}
      onSave={onSave}
    />
  );
}

function TripSettingsPageContent({ canEdit, currentMember, trip, onSave }: TripSettingsPageProps) {
  const { t } = useI18n();
  const [form, setForm] = useState<TripSettingsFormValues>(() => tripToForm(trip));
  const [status, setStatus] = useState<"idle" | "saving" | "saved">("idle");
  const [error, setError] = useState<string | null>(null);

  const invalidDateRange = Boolean(form.startDate && form.endDate && form.endDate < form.startDate);
  const outsideStopCount = useMemo(() => {
    if (!form.startDate || !form.endDate || invalidDateRange) return 0;
    const dayShift = daysBetweenIsoDates(trip.startDate, form.startDate);
    return trip.itineraryItems.filter((item) => {
      const shiftedDay = shiftIsoDate(item.day, dayShift);
      return shiftedDay < form.startDate || shiftedDay > form.endDate;
    }).length;
  }, [form.endDate, form.startDate, invalidDateRange, trip.itineraryItems, trip.startDate]);
  const canSubmit = Boolean(
    canEdit &&
      !invalidDateRange &&
      form.name.trim() &&
      form.destinationLabel.trim() &&
      form.defaultTimezone.trim() &&
      Number.isFinite(form.partySize) &&
      form.partySize >= 1 &&
      status !== "saving",
  );

  async function submitSettings(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSubmit) return;
    setStatus("saving");
    setError(null);
    try {
      await onSave({
        name: form.name.trim(),
        destinationLabel: form.destinationLabel.trim(),
        startDate: form.startDate,
        endDate: form.endDate,
        partySize: Math.max(1, Math.floor(form.partySize || 1)),
        defaultTimezone: form.defaultTimezone.trim(),
      });
      setStatus("saved");
    } catch {
      setStatus("idle");
      setError(t.tripSettings.saveFailed);
    }
  }

  return (
    <WorkspacePage className={pageClassName} aria-label={t.tripSettings.pageLabel}>
      <div className={shellClassName}>
        <PageHeader
          title={t.tripSettings.title}
          subtitle={trip.name}
          description={t.tripSettings.detail}
          meta={<span><Icon name="settings" /> {t.tripSettings.currentRole({ role: currentMember.role })}</span>}
        />

        <div className={contentGridClassName}>
          <WorkspaceSurface as="form" className={formClassName} aria-label={t.tripSettings.tripDetails} onSubmit={submitSettings}>
            <h2 className="text-[16px] font-[900] text-(--color-text)">{t.tripSettings.tripDetails}</h2>
            <FieldLabel>
              <span>{t.tripSettings.tripName}</span>
              <input
                className={inputClassName}
                disabled={!canEdit}
                value={form.name}
                onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
              />
            </FieldLabel>
            <FieldLabel>
              <span>{t.tripSettings.destination}</span>
              <input
                className={inputClassName}
                disabled={!canEdit}
                value={form.destinationLabel}
                onChange={(event) => setForm((current) => ({ ...current, destinationLabel: event.target.value }))}
              />
            </FieldLabel>
            <div className={fieldGridClassName}>
              <FieldLabel>
                <span>{t.tripSettings.startDate}</span>
                <DatePickerField
                  className={inputClassName}
                  disabled={!canEdit}
                  value={form.startDate}
                  onChange={(value) => setForm((current) => ({ ...current, startDate: value }))}
                />
              </FieldLabel>
              <FieldLabel>
                <span>{t.tripSettings.endDate}</span>
                <DatePickerField
                  className={inputClassName}
                  disabled={!canEdit}
                  value={form.endDate}
                  onChange={(value) => setForm((current) => ({ ...current, endDate: value }))}
                />
              </FieldLabel>
            </div>
            <div className={fieldGridClassName}>
              <FieldLabel>
                <span>{t.tripSettings.partySize}</span>
                <input
                  className={inputClassName}
                  disabled={!canEdit}
                  min={1}
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
                  className={inputClassName}
                  disabled={!canEdit}
                  value={form.defaultTimezone}
                  onChange={(event) => setForm((current) => ({ ...current, defaultTimezone: event.target.value }))}
                />
              </FieldLabel>
            </div>
            {!canEdit ? <p className={cn(messageClassName, errorClassName)}>{t.tripSettings.editLocked}</p> : null}
            {invalidDateRange ? <p className={cn(messageClassName, errorClassName)}>{t.tripSettings.invalidDate}</p> : null}
            {error ? <p className={cn(messageClassName, errorClassName)}>{error}</p> : null}
            {status === "saved" ? <p className={cn(messageClassName, successClassName)}>{t.tripSettings.saved}</p> : null}
            <div className={actionRowClassName}>
              <Button type="submit" disabled={!canSubmit}>
                {status === "saving" ? t.tripSettings.saving : t.tripSettings.save}
              </Button>
            </div>
          </WorkspaceSurface>

          <WorkspaceSurface className={sideCardClassName} aria-label={t.tripSettings.planImpact}>
            <h2 className="text-[16px] font-[900] text-(--color-text)">{t.tripSettings.planImpact}</h2>
            <div className={impactLineClassName}>
              <Icon name={outsideStopCount ? "warning" : "check"} />
              <span>{outsideStopCount ? t.tripSettings.outsideStops({ count: outsideStopCount }) : t.tripSettings.noImpact}</span>
            </div>
          </WorkspaceSurface>
        </div>
      </div>
    </WorkspacePage>
  );
}

function tripSettingsStateKey(trip: Trip): string {
  return [
    trip.id,
    trip.name,
    trip.destinationLabel,
    trip.startDate,
    trip.endDate,
    trip.partySize,
    trip.defaultTimezone,
  ].join(":");
}

function tripToForm(trip: Trip): TripSettingsFormValues {
  return {
    name: trip.name,
    destinationLabel: trip.destinationLabel,
    startDate: trip.startDate,
    endDate: trip.endDate,
    partySize: trip.partySize ?? 1,
    defaultTimezone: trip.defaultTimezone ?? "Asia/Bangkok",
  };
}
