"use client";

import { useMemo, useState, type FormEvent } from "react";
import { useI18n } from "@/src/i18n/I18nProvider";
import { cn } from "@/src/lib/cn";
import type { Member, Trip } from "@/src/trip/types";
import { Button, Badge } from "./ui";
import { Icon } from "./icons";
import { DatePickerField } from "./DateTimePickers";

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

const pageClassName = "trip-settings-page min-h-full bg-transparent px-6 py-[22px] pb-7 max-[767px]:px-3 max-[767px]:py-4";
const shellClassName = "mx-auto grid max-w-[980px] gap-4";
const headerClassName = "grid gap-3 rounded-(--radius-lg) border border-(--color-border) bg-(--color-surface) p-5 shadow-[0_10px_22px_rgb(55_47_38_/_0.045)]";
const headerToplineClassName = "flex min-w-0 items-start justify-between gap-3 max-[767px]:flex-wrap";
const eyebrowClassName = "inline-flex w-fit items-center gap-2 rounded-full border border-(--color-primary-border) bg-(--color-primary-soft) px-3 py-1 text-[11px] font-extrabold text-(--color-primary-strong)";
const headingClassName = "grid gap-1 [&_h1]:text-[26px] [&_h1]:font-[900] [&_h1]:leading-8 [&_h1]:text-(--color-text) [&_p]:max-w-[620px] [&_p]:text-[13px] [&_p]:leading-5 [&_p]:text-(--color-text-muted)";
const contentGridClassName = "grid grid-cols-[minmax(0,1fr)_300px] gap-4 max-[920px]:grid-cols-1";
const cardClassName = "rounded-(--radius-lg) border border-(--color-border) bg-(--color-surface) p-4 shadow-[0_10px_22px_rgb(55_47_38_/_0.045)]";
const formClassName = "grid gap-3.5";
const fieldGridClassName = "grid grid-cols-2 gap-3 max-[767px]:grid-cols-1";
const labelClassName = "grid gap-1.5 text-[12px] font-extrabold text-(--color-text)";
const inputClassName = "min-h-10 rounded-(--radius-sm) border border-(--color-border) bg-(--color-surface) px-3 text-[13px] text-(--color-text) outline-none transition-[border-color,box-shadow] focus:border-(--color-primary) focus:shadow-[0_0_0_3px_rgb(194_79_22_/_0.14)] disabled:bg-(--color-surface-muted) disabled:text-(--color-text-muted)";
const sideCardClassName = cn(cardClassName, "grid content-start gap-3 bg-(--color-surface)");
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
    <section className={pageClassName} aria-label={t.tripSettings.pageLabel}>
      <div className={shellClassName}>
        <header className={headerClassName}>
          <div className={headerToplineClassName}>
            <div className={headingClassName}>
              <span className={eyebrowClassName}><Icon name="settings" /> {t.tripSettings.pageLabel}</span>
              <h1>{t.tripSettings.title}</h1>
              <p>{t.tripSettings.detail}</p>
            </div>
            <Badge tone={canEdit ? "success" : "neutral"}>{t.tripSettings.currentRole({ role: currentMember.role })}</Badge>
          </div>
        </header>

        <div className={contentGridClassName}>
          <form className={cn(cardClassName, formClassName)} aria-label={t.tripSettings.tripDetails} onSubmit={submitSettings}>
            <h2 className="text-[16px] font-[900] text-(--color-text)">{t.tripSettings.tripDetails}</h2>
            <label className={labelClassName}>
              <span>{t.tripSettings.tripName}</span>
              <input
                className={inputClassName}
                disabled={!canEdit}
                value={form.name}
                onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
              />
            </label>
            <label className={labelClassName}>
              <span>{t.tripSettings.destination}</span>
              <input
                className={inputClassName}
                disabled={!canEdit}
                value={form.destinationLabel}
                onChange={(event) => setForm((current) => ({ ...current, destinationLabel: event.target.value }))}
              />
            </label>
            <div className={fieldGridClassName}>
              <label className={labelClassName}>
                <span>{t.tripSettings.startDate}</span>
                <DatePickerField
                  className={inputClassName}
                  disabled={!canEdit}
                  value={form.startDate}
                  onChange={(value) => setForm((current) => ({ ...current, startDate: value }))}
                />
              </label>
              <label className={labelClassName}>
                <span>{t.tripSettings.endDate}</span>
                <DatePickerField
                  className={inputClassName}
                  disabled={!canEdit}
                  value={form.endDate}
                  onChange={(value) => setForm((current) => ({ ...current, endDate: value }))}
                />
              </label>
            </div>
            <div className={fieldGridClassName}>
              <label className={labelClassName}>
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
              </label>
              <label className={labelClassName}>
                <span>{t.tripSettings.defaultTimezone}</span>
                <input
                  className={inputClassName}
                  disabled={!canEdit}
                  value={form.defaultTimezone}
                  onChange={(event) => setForm((current) => ({ ...current, defaultTimezone: event.target.value }))}
                />
              </label>
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
          </form>

          <section className={sideCardClassName} aria-label={t.tripSettings.planImpact}>
            <h2 className="text-[16px] font-[900] text-(--color-text)">{t.tripSettings.planImpact}</h2>
            <div className={impactLineClassName}>
              <Icon name={outsideStopCount ? "warning" : "check"} />
              <span>{outsideStopCount ? t.tripSettings.outsideStops({ count: outsideStopCount }) : t.tripSettings.noImpact}</span>
            </div>
          </section>
        </div>
      </div>
    </section>
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

function daysBetweenIsoDates(from: string, to: string): number {
  return Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86_400_000);
}

function shiftIsoDate(value: string, days: number): string {
  const date = new Date(`${value}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}
