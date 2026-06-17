"use client";

import type { Dispatch, RefObject, SetStateAction } from "react";
import type { AccountTripCreateRequest } from "@/src/account/api-client";
import { DatePickerField } from "@/src/shared/components/date-time-pickers";
import type { TripCity } from "@/src/trip/types";
import { Button, SwapButton } from "@/src/ui";
import { Icon } from "@/src/ui/icons";
import {
  citySuggestions,
  routeCalendarDays,
  tripDestinationCards,
  tripWizardSteps,
  type TripCityOption,
} from "./account-trip-wizard-support";
import { DestinationCardMeta } from "./destination-card-meta";
import * as wizardStyles from "./portal-trip-wizard-styles";

interface TripWizardDestinationStepProps {
  activeMobileStep: string;
  cityQuery: string;
  countryQuery: string;
  destinationCards: ReturnType<typeof tripDestinationCards>;
  destinationSearchRef: RefObject<HTMLInputElement | null>;
  mobileStepClassName: (stepId: "place") => string;
  selectedCityNames: string[];
  selectedDestinationCities: TripCity[];
  wizard: {
    actions: {
      addCity: string;
    };
    empty: {
      selectedDestinations: string;
    };
    fields: {
      addCityManually: string;
      addCityOrStop: string;
      originCity: string;
      searchDestinationCities: string;
    };
    placeholders: {
      destinationSearch: string;
      manualCity: string;
    };
    steps: {
      place: {
        detail: string;
        title: string;
      };
    };
  };
  tripForm: AccountTripCreateRequest;
  onAddCityStop: () => void;
  onCityQueryChange: (value: string) => void;
  onCountryQueryChange: (value: string) => void;
  onRemoveCityStop: (cityName: string) => void;
  onSelectDestinationCity: (city: TripCityOption) => void;
}

export function TripWizardDestinationStep({
  activeMobileStep,
  cityQuery,
  countryQuery,
  destinationCards,
  destinationSearchRef,
  mobileStepClassName,
  onAddCityStop,
  onCityQueryChange,
  onCountryQueryChange,
  onRemoveCityStop,
  onSelectDestinationCity,
  selectedCityNames,
  selectedDestinationCities,
  tripForm,
  wizard,
}: TripWizardDestinationStepProps) {
  const suggestedCities = citySuggestions(cityQuery || countryQuery, selectedDestinationCities);

  return (
    <section className={mobileStepClassName("place")} role="region" aria-label={tripWizardSteps[1].regionLabel} data-mobile-active={activeMobileStep === "place" ? "true" : "false"}>
      <div className={wizardStyles.tripStepHeadingClassName}>
        <strong>{wizard.steps.place.title}</strong>
        <span>{wizard.steps.place.detail}</span>
      </div>
      <div className={wizardStyles.tripCountryPickerClassName}>
        <label className={wizardStyles.tripCountrySearchClassName}>
          <span>{wizard.fields.originCity}</span>
          <input aria-label={wizard.fields.originCity} value={tripForm.originLabel} readOnly />
        </label>
        <div className={wizardStyles.tripCountrySearchClassName}>
          <label>
            <span className="sr-only">{wizard.fields.searchDestinationCities}</span>
            <input
              aria-label={wizard.fields.searchDestinationCities}
              ref={destinationSearchRef}
              value={cityQuery}
              onChange={(event) => onCityQueryChange(event.target.value)}
              placeholder={wizard.placeholders.destinationSearch}
            />
          </label>
          {suggestedCities.length ? (
            <div className={wizardStyles.tripCountrySuggestionsClassName} aria-label="Destination city suggestions">
              {suggestedCities.map((city) => (
                <button type="button" key={`${city.city}-${city.countryCode}`} aria-label={`${city.city}, ${city.country}`} onClick={() => onSelectDestinationCity(city)}>
                  <strong>{city.city}</strong>
                  <span>{city.country} · {city.countryCode} · {city.timezone}</span>
                </button>
              ))}
            </div>
          ) : null}
        </div>
        {selectedCityNames.length ? (
          <div className={wizardStyles.tripFormDestinationRowClassName} aria-label="Selected destinations">
            {destinationCards.map((card) => (
              <article key={card.title} className={wizardStyles.tripMiniDestinationClassName}>
                <span className={wizardStyles.tripPlaceThumbClassName} aria-hidden="true" />
                <div>
                  <strong>{card.title}</strong>
                  <DestinationCardMeta detail={card.detail} meta={card.meta} />
                </div>
                <button type="button" aria-label={`Remove ${card.title}`} onClick={() => onRemoveCityStop(card.title)}>
                  <Icon name="x" />
                </button>
              </article>
            ))}
          </div>
        ) : (
          <div className={wizardStyles.tripSelectedCountriesClassName} aria-label="Selected destinations">
            <span>{wizard.empty.selectedDestinations}</span>
          </div>
        )}
        <div className={wizardStyles.tripCityEntryClassName}>
          <label>
            <span>{wizard.fields.addCityManually}</span>
            <input
              aria-label={wizard.fields.addCityOrStop}
              value={countryQuery}
              onChange={(event) => onCountryQueryChange(event.target.value)}
              placeholder={wizard.placeholders.manualCity}
            />
          </label>
          <Button type="button" variant="secondary" onClick={onAddCityStop} disabled={!countryQuery.trim()}>
            <Icon name="plus" />
            {wizard.actions.addCity}
          </Button>
        </div>
      </div>
    </section>
  );
}

interface TripWizardDatesStepProps {
  activeMobileStep: string;
  calendarDays: ReturnType<typeof routeCalendarDays>;
  mobileStepClassName: (stepId: "dates") => string;
  previewEndDate: string;
  previewStartDate: string;
  selectedDestinationCities: TripCity[];
  selectingDateStep: "depart" | "return";
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
              min={1}
              max={99}
              value={tripForm.partySize ?? 1}
              onChange={(event) => onChange((current) => ({ ...current, partySize: Math.max(1, Number(event.target.value) || 1) }))}
            />
          </label>
          <label>
            <span>{wizard.fields.defaultTimezone}</span>
            <input
              value={tripForm.defaultTimezone || selectedDestinationCities[0]?.timezone || "Asia/Bangkok"}
              onChange={(event) => onChange((current) => ({ ...current, defaultTimezone: event.target.value }))}
            />
          </label>
        </div>
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

interface TripWizardInviteStepProps {
  activeMobileStep: string;
  defaultOwnerDisplayName: string;
  effectiveOwnerDisplayName: string;
  generatedJoinId: string;
  generatedJoinPassword: string;
  mobileStepClassName: (stepId: "invite", baseClassName?: string) => string;
  t: {
    access: {
      dashboard: {
        createTrip: {
          labels: {
            joinId: string;
            joinPassword: string;
            ownerDisplayName: string;
          };
        };
      };
    };
  };
  wizard: {
    actions: {
      regenerate: string;
    };
    helper: {
      joinIdHint: string;
      ownerDefault: string;
    };
    steps: {
      invite: {
        title: string;
      };
    };
  };
  onOwnerDisplayNameChange: (value: string) => void;
  onRegenerateCredentials: () => void;
}

export function TripWizardInviteStep({
  activeMobileStep,
  defaultOwnerDisplayName,
  effectiveOwnerDisplayName,
  generatedJoinId,
  generatedJoinPassword,
  mobileStepClassName,
  onOwnerDisplayNameChange,
  onRegenerateCredentials,
  t,
  wizard,
}: TripWizardInviteStepProps) {
  return (
    <section className={mobileStepClassName("invite", wizardStyles.tripStepSectionCompactClassName)} role="region" aria-label={tripWizardSteps[3].regionLabel} data-mobile-active={activeMobileStep === "invite" ? "true" : "false"}>
      <details className={wizardStyles.tripAccessPanelClassName} {...(activeMobileStep === "invite" ? { open: true } : {})}>
        <summary>
          <span>{wizard.steps.invite.title}</span>
          <strong>{effectiveOwnerDisplayName || defaultOwnerDisplayName}</strong>
        </summary>
        <label>
          <span>{t.access.dashboard.createTrip.labels.ownerDisplayName}</span>
          <input
            value={effectiveOwnerDisplayName}
            onChange={(event) => onOwnerDisplayNameChange(event.target.value)}
            autoComplete="name"
            required
          />
          <small>{wizard.helper.ownerDefault}</small>
        </label>
        <div className={wizardStyles.tripGeneratedAccessClassName}>
          <label>
            <span>{t.access.dashboard.createTrip.labels.joinId}</span>
            <input value={generatedJoinId} readOnly />
            <small>{wizard.helper.joinIdHint}</small>
          </label>
          <label>
            <span>{t.access.dashboard.createTrip.labels.joinPassword}</span>
            <input value={generatedJoinPassword} readOnly />
          </label>
          <Button type="button" variant="secondary" onClick={onRegenerateCredentials}>
            <Icon name="route" />
            {wizard.actions.regenerate}
          </Button>
        </div>
      </details>
    </section>
  );
}

interface TripWizardReviewSummaryProps {
  destinationSummary: string;
  tripForm: AccountTripCreateRequest;
  wizard: {
    empty: {
      missingDates: string;
      newTrip: string;
    };
    helper: {
      postCreateEditable: string;
    };
    review: {
      dates: string;
      destinations: string;
      trip: string;
    };
  };
}

export function TripWizardReviewSummary({ destinationSummary, tripForm, wizard }: TripWizardReviewSummaryProps) {
  return (
    <>
      <div className={wizardStyles.tripAccessNoteClassName}>
        <Icon name="key" />
        <span>{wizard.helper.postCreateEditable}</span>
      </div>
      <div className={wizardStyles.tripTicketReviewClassName}>
        <div>
          <span>{wizard.review.trip}</span>
          <strong>{tripForm.name || wizard.empty.newTrip}</strong>
        </div>
        <div>
          <span>{wizard.review.destinations}</span>
          <strong>{destinationSummary}</strong>
        </div>
        <div>
          <span>{wizard.review.dates}</span>
          <strong>{tripForm.startDate && tripForm.endDate ? `${tripForm.startDate} - ${tripForm.endDate}` : wizard.empty.missingDates}</strong>
        </div>
      </div>
    </>
  );
}
