"use client";

import { useI18n } from "@/src/i18n/I18nProvider";
import { WorkspacePage } from "@/src/ui";
import { Icon } from "@/src/ui/icons";
import { PageHeader } from "@/src/shared/components/page-header";
import { TripSettingsForm } from "./components/TripSettingsForm";
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
  const { t } = useI18n();
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
        <PageHeader
          title={t.tripSettings.title}
          subtitle={trip.name}
          description={t.tripSettings.detail}
          meta={<span><Icon name="settings" /> {t.tripSettings.currentRole({ role: currentMember.role })}</span>}
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

          <TripSettingsImpactCard outsideStopCount={outsideStopCount} />
        </div>
      </div>
    </WorkspacePage>
  );
}
