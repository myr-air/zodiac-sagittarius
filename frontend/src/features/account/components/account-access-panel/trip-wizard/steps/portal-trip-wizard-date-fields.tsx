"use client";

import type { Dispatch, SetStateAction } from "react";
import type { AccountTripCreateRequest } from "@/src/account/api-client";
import { DatePickerField } from "@/src/shared/components/date-time-pickers";
import { tripPartySizeRange } from "@/src/trip/settings";
import type { TripCity } from "@/src/trip/types";
import {
  tripWizardDefaultTimezone,
  tripWizardPartySizeFromInput,
} from "../model/account-trip-dates";
import * as wizardStyles from "../layout/portal-trip-wizard-styles";

interface TripWizardDateFieldsProps {
  selectedDestinationCities: TripCity[];
  t: {
    access: {
      dashboard: {
        createTrip: {
          labels: {
            endDate: string;
            startDate: string;
          };
        };
      };
    };
  };
  tripForm: AccountTripCreateRequest;
  wizard: {
    fields: {
      defaultTimezone: string;
      depart: string;
      partySize: string;
      return: string;
    };
  };
  onChange: Dispatch<SetStateAction<AccountTripCreateRequest>>;
  onUpdateEndDate: (date: string) => void;
  onUpdateStartDate: (date: string) => void;
}

export function TripWizardDateFields({
  onChange,
  onUpdateEndDate,
  onUpdateStartDate,
  selectedDestinationCities,
  t,
  tripForm,
  wizard,
}: TripWizardDateFieldsProps) {
  return (
    <>
      <div className={wizardStyles.tripCalendarSummaryClassName}>
        <label>
          <span>{wizard.fields.depart}</span>
          <DatePickerField aria-label={t.access.dashboard.createTrip.labels.startDate} value={tripForm.startDate} onChange={onUpdateStartDate} />
        </label>
        <label>
          <span>{wizard.fields.return}</span>
          <DatePickerField aria-label={t.access.dashboard.createTrip.labels.endDate} value={tripForm.endDate} onChange={onUpdateEndDate} />
        </label>
      </div>
      <div className={wizardStyles.tripCalendarSummaryClassName}>
        <label>
          <span>{wizard.fields.partySize}</span>
          <input
            type="number"
            min={tripPartySizeRange.min}
            max={99}
            value={tripForm.partySize ?? tripPartySizeRange.min}
            onChange={(event) => onChange((current) => ({ ...current, partySize: tripWizardPartySizeFromInput(event.target.value) }))}
          />
        </label>
        <label>
          <span>{wizard.fields.defaultTimezone}</span>
          <input
            value={tripWizardDefaultTimezone(tripForm, selectedDestinationCities)}
            onChange={(event) => onChange((current) => ({ ...current, defaultTimezone: event.target.value }))}
          />
        </label>
      </div>
    </>
  );
}
