import type { Messages } from "@/src/i18n/messages";
import type { Locale } from "@/src/i18n/types";
import {
  PageHeader,
  PageHeaderMetaItem,
  PageHeaderTripDateMetaItem,
} from "@/src/shared/components/page-header";
import { SelectOptions } from "@/src/shared/components/select-options";
import { TravelMotif } from "@/src/shared/components/travel-motifs";
import { buildTripPlanSelectOptions } from "@/src/trip/trip-plans";
import type { Trip, TripPlan } from "@/src/trip/types";
import { Select } from "@/src/ui";
import * as expenseStyles from "../TripExpensesPage.styles";

interface ExpensePageHeaderProps {
  canEditExpenses: boolean;
  currentTripPlanId: string;
  locale: Locale;
  onTripPlanChange?: (tripPlanId: string) => void;
  t: Messages;
  trip: Trip;
}

export function ExpensePageHeader({
  canEditExpenses,
  currentTripPlanId,
  locale,
  onTripPlanChange,
  t,
  trip,
}: ExpensePageHeaderProps) {
  const tripPlanOptions = trip.tripPlans ?? trip.planVariants;

  return (
    <PageHeader
      allowOverflow
      title={t.expenses.title}
      subtitle={trip.name}
      meta={(
        <>
          <PageHeaderTripDateMetaItem startDate={trip.startDate} endDate={trip.endDate} locale={locale} />
          <PageHeaderMetaItem icon="users">{t.dates.memberCount({ count: trip.members.length })}</PageHeaderMetaItem>
          <PageHeaderMetaItem icon="wallet">{canEditExpenses ? t.expenses.canEdit : t.expenses.readOnly}</PageHeaderMetaItem>
        </>
      )}
      aside={(
        <ExpenseTripPlanPicker
          currentTripPlanId={currentTripPlanId}
          label={t.expenses.fields.tripPlan}
          tripPlanOptions={tripPlanOptions}
          onTripPlanChange={onTripPlanChange}
        />
      )}
      motif={<TravelMotif tone="route" />}
    />
  );
}

interface ExpenseTripPlanPickerProps {
  currentTripPlanId: string;
  label: string;
  tripPlanOptions: TripPlan[] | undefined;
  onTripPlanChange?: (tripPlanId: string) => void;
}

export function ExpenseTripPlanPicker({
  currentTripPlanId,
  label,
  tripPlanOptions,
  onTripPlanChange,
}: ExpenseTripPlanPickerProps) {
  return (
    <label className={expenseStyles.headerPlanSelectClassName}>
      <span>{label}</span>
      <Select
        aria-label={label}
        value={currentTripPlanId}
        onChange={(event) => onTripPlanChange?.(event.target.value)}
      >
        <SelectOptions options={buildTripPlanSelectOptions(tripPlanOptions ?? [])} />
      </Select>
    </label>
  );
}
