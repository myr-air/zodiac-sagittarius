"use client";

import { useI18n } from "@/src/i18n/I18nProvider";
import { WorkspacePage } from "@/src/ui";
import { TripSettingsForm } from "./components/TripSettingsForm";
import { TripSettingsHeader } from "./components/TripSettingsHeader";
import { TripSettingsImpactCard } from "./components/TripSettingsImpactCard";
import * as settingsStyles from "./TripSettingsPage.styles";
import { tripSettingsStateKey } from "./model/trip-settings-state-key";
import { useTripSettingsFormState } from "./hooks/use-trip-settings-form-state";
import type { TripSettingsPageProps } from "./TripSettingsPage.types";

export type { TripSettingsFormValues, TripSettingsPageProps } from "./TripSettingsPage.types";

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
  const { locale, t } = useI18n();
  const {
    canSubmit,
    error,
    form,
    invalidDateRange,
    outsideStopCount,
    setForm,
    status,
    submitSettings,
  } = useTripSettingsFormState({
    canEdit,
    saveFailedMessage: t.tripSettings.saveFailed,
    trip,
    onSave,
  });

  return (
    <WorkspacePage className={settingsStyles.pageClassName} aria-label={t.tripSettings.pageLabel}>
      <div className={settingsStyles.shellClassName}>
        <TripSettingsHeader
          title={t.tripSettings.title}
          subtitle={trip.name}
          description={t.tripSettings.detail}
          locale={locale}
          memberCountLabel={t.dates.memberCount({ count: trip.members.length })}
          roleLabel={t.tripSettings.currentRole({ role: currentMember.role })}
          tripEndDate={trip.endDate}
          tripStartDate={trip.startDate}
        />

        <div className={settingsStyles.contentGridClassName}>
          <TripSettingsForm
            canEdit={canEdit}
            canSubmit={canSubmit}
            error={error}
            form={form}
            invalidDateRange={invalidDateRange}
            setForm={setForm}
            status={status}
            onSubmit={submitSettings}
          />

          <TripSettingsImpactCard
            defaultTimezone={form.defaultTimezone}
            endDate={form.endDate}
            outsideStopCount={outsideStopCount}
            partySize={form.partySize}
            startDate={form.startDate}
          />
        </div>
      </div>
    </WorkspacePage>
  );
}
