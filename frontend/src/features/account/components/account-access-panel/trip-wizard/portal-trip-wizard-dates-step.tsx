"use client";

import type { Dispatch, SetStateAction } from "react";
import type { AccountTripCreateRequest } from "@/src/account/api-client";
import type { TripCity } from "@/src/trip/types";
import { Button, SwapButton } from "@/src/ui";
import { Icon } from "@/src/ui/icons";
import {
  routeCalendarDays,
  type TripWizardDateSelectionStep,
} from "./model/account-trip-dates";
import { tripWizardSteps } from "./model/account-trip-wizard-steps";
import { TripWizardDateFields } from "./portal-trip-wizard-date-fields";
import * as wizardStyles from "./portal-trip-wizard-styles";

interface TripWizardDatesStepProps {
  activeMobileStep: string;
  calendarDays: ReturnType<typeof routeCalendarDays>;
  mobileStepClassName: (stepId: "dates") => string;
  previewEndDate: string;
  previewStartDate: string;
  selectedDestinationCities: TripCity[];
  selectingDateStep: TripWizardDateSelectionStep;
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
    actions: {
      clearDates: string;
      swapDates: string;
    };
    fields: {
      defaultTimezone: string;
      depart: string;
      partySize: string;
      return: string;
      routeCalendar: string;
    };
    helper: {
      datesWindow: string;
    };
    steps: {
      dates: {
        detail: string;
        title: string;
      };
    };
  };
  onChange: Dispatch<SetStateAction<AccountTripCreateRequest>>;
  onClearTravelDates: () => void;
  onSelectCalendarDate: (date: string) => void;
  onSwapTravelDates: () => void;
  onUpdateEndDate: (date: string) => void;
  onUpdateStartDate: (date: string) => void;
}

export function TripWizardDatesStep({
  activeMobileStep,
  calendarDays,
  mobileStepClassName,
  onChange,
  onClearTravelDates,
  onSelectCalendarDate,
  onSwapTravelDates,
  onUpdateEndDate,
  onUpdateStartDate,
  previewEndDate,
  previewStartDate,
  selectedDestinationCities,
  selectingDateStep,
  t,
  tripForm,
  wizard,
}: TripWizardDatesStepProps) {
  return (
    <section className={mobileStepClassName("dates")} role="region" aria-label={tripWizardSteps[2].regionLabel} data-mobile-active={activeMobileStep === "dates" ? "true" : "false"}>
      <div className={wizardStyles.tripStepHeadingClassName}>
        <strong>{wizard.steps.dates.title}</strong>
        <span>{wizard.steps.dates.detail}</span>
      </div>
      <fieldset className={wizardStyles.tripRouteCalendarClassName} role="group" aria-label={wizard.fields.routeCalendar}>
        <legend>{wizard.fields.routeCalendar}</legend>
        <TripWizardDateFields
          selectedDestinationCities={selectedDestinationCities}
          t={t}
          tripForm={tripForm}
          wizard={wizard}
          onChange={onChange}
          onUpdateEndDate={onUpdateEndDate}
          onUpdateStartDate={onUpdateStartDate}
        />
        <strong>{previewStartDate} - {previewEndDate}</strong>
        <div className={wizardStyles.tripCalendarGridClassName}>
          {calendarDays.map((day) => (
            <button
              type="button"
              key={day.value}
              aria-label={`${day.tourDay ? `Tour day ${day.tourDay}. ` : ""}Select ${day.label} as ${selectingDateStep} date`}
              aria-pressed={day.value === tripForm.startDate || day.value === tripForm.endDate}
              data-in-range={day.inRange ? "true" : "false"}
              data-date-state={day.dateState}
              data-tour-tone={day.tourTone}
              onClick={() => onSelectCalendarDate(day.value)}
            >
              {day.day}
            </button>
          ))}
        </div>
        <div className={wizardStyles.tripCalendarFooterClassName}>
          <Button type="button" variant="secondary" onClick={onClearTravelDates}>
            <Icon name="x" />
            {wizard.actions.clearDates}
          </Button>
          <SwapButton className={wizardStyles.tripDateArrowClassName} type="button" onClick={onSwapTravelDates} aria-label={wizard.actions.swapDates}>
            <Icon name="route" />
          </SwapButton>
        </div>
        <small className={wizardStyles.tripCalendarHelperClassName}>
          <Icon name="route" />
          <span>{wizard.helper.datesWindow}</span>
        </small>
      </fieldset>
    </section>
  );
}
