"use client";

import { Button } from "@/src/ui";
import { Icon } from "@/src/ui/icons";
import * as wizardStyles from "../layout/portal-trip-wizard-styles";

interface TripWizardManualCityEntryProps {
  countryQuery: string;
  wizard: {
    actions: {
      addCity: string;
    };
    fields: {
      addCityManually: string;
      addCityOrStop: string;
    };
    placeholders: {
      manualCity: string;
    };
  };
  onAddCityStop: () => void;
  onCountryQueryChange: (value: string) => void;
}

export function TripWizardManualCityEntry({
  countryQuery,
  onAddCityStop,
  onCountryQueryChange,
  wizard,
}: TripWizardManualCityEntryProps) {
  return (
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
  );
}
