import type { ExpenseSplitMode } from "@/src/trip/expenses";
import type { Expense, ItineraryItem, Trip, TripPlan } from "@/src/trip/types";
import {
  buildItineraryItemSelectOptions,
  buildMemberSelectOptions,
} from "@/src/features/workspace/model/related-checkbox-options";
import { SelectOptions } from "@/src/shared/components/select-options";
import { buildTripPlanSelectOptions } from "@/src/trip/trip-plans";
import { SegmentedControl, Select } from "@/src/ui";
import { cn } from "@/src/lib/cn";
import * as expenseStyles from "../TripExpensesPage.styles";
import {
  categoryTone,
  expenseCategorySelectOptions,
  expenseSplitModeSelectOptions,
} from "../model/expense-page-options";

interface ExpenseLinkingFieldsProps {
  category: Expense["category"];
  effectiveTripPlanId: string;
  itemId: string;
  linkedItem: ItineraryItem | null;
  paidBy: string;
  splitMode: ExpenseSplitMode;
  trip: Trip;
  tripPlanOptions: TripPlan[];
  copy: {
    dialog: {
      planLockedToLinkedStop: string;
    };
    fields: {
      category: string;
      linkedStop: string;
      noLinkedStop: string;
      paidBy: string;
      splitMode: string;
      tripPlan: string;
    };
    splitModes: Record<ExpenseSplitMode, string>;
  };
  onCategoryChange: (value: Expense["category"]) => void;
  onItemIdChange: (value: string) => void;
  onPaidByChange: (value: string) => void;
  onSplitModeChange: (value: ExpenseSplitMode) => void;
  onTripPlanIdChange: (value: string) => void;
}

export function ExpenseLinkingFields({
  category,
  copy,
  effectiveTripPlanId,
  itemId,
  linkedItem,
  paidBy,
  splitMode,
  trip,
  tripPlanOptions,
  onCategoryChange,
  onItemIdChange,
  onPaidByChange,
  onSplitModeChange,
  onTripPlanIdChange,
}: ExpenseLinkingFieldsProps) {
  const splitModeOptions = expenseSplitModeSelectOptions(copy.splitModes);
  const categoryOptions = expenseCategorySelectOptions();

  return (
    <>
      <label className={expenseStyles.fieldClassName}>
        <span>{copy.fields.paidBy}</span>
        <Select value={paidBy} onChange={(event) => onPaidByChange(event.target.value)}>
          <SelectOptions options={buildMemberSelectOptions(trip.members)} />
        </Select>
      </label>
      <fieldset className={expenseStyles.dialogChoiceFieldClassName}>
        <legend>{copy.fields.splitMode}</legend>
        <SegmentedControl
          aria-label={copy.fields.splitMode}
          className={expenseStyles.dialogSegmentedControlClassName}
          itemClassName={expenseStyles.dialogSegmentedItemClassName}
          selectedItemClassName={expenseStyles.dialogSegmentedItemActiveClassName}
          value={splitMode}
          options={splitModeOptions}
          onChange={onSplitModeChange}
        />
      </fieldset>
      <fieldset className={expenseStyles.dialogChoiceFieldClassName}>
        <legend>{copy.fields.category}</legend>
        <div className={expenseStyles.dialogCategoryGridClassName} role="group" aria-label={copy.fields.category}>
          {categoryOptions.map((option) => {
            const tone = categoryTone(option.value);
            const selected = option.value === category;
            return (
              <button
                key={option.value}
                type="button"
                aria-pressed={selected}
                className={cn(
                  expenseStyles.dialogCategoryButtonClassName,
                  selected && expenseStyles.dialogCategoryButtonActiveClassName,
                )}
                style={{
                  borderColor: selected ? tone.border : undefined,
                }}
                onClick={() => onCategoryChange(option.value)}
              >
                <span className={expenseStyles.dialogCategoryButtonLabelClassName}>
                  <span
                    className={expenseStyles.dialogCategoryDotLargeClassName}
                    style={{ backgroundColor: tone.dot }}
                  />
                  {option.label}
                </span>
              </button>
            );
          })}
        </div>
      </fieldset>
      <div className={expenseStyles.dialogSecondaryGridClassName}>
        <div className="grid gap-1.5">
          <label className={expenseStyles.fieldClassName}>
            <span>{copy.fields.linkedStop}</span>
            <Select value={itemId} onChange={(event) => onItemIdChange(event.target.value)}>
              <SelectOptions
                options={buildItineraryItemSelectOptions(trip.itineraryItems, {
                  leadingOption: { value: "", label: copy.fields.noLinkedStop },
                })}
              />
            </Select>
          </label>
        </div>
        <div className="grid gap-1.5">
          <label className={expenseStyles.fieldClassName}>
            <span>{copy.fields.tripPlan}</span>
            <Select value={effectiveTripPlanId} disabled={Boolean(linkedItem)} onChange={(event) => onTripPlanIdChange(event.target.value)}>
              <SelectOptions options={buildTripPlanSelectOptions(tripPlanOptions)} />
            </Select>
          </label>
          {linkedItem ? <span className={expenseStyles.balanceMetaClassName}>{copy.dialog.planLockedToLinkedStop}</span> : null}
        </div>
      </div>
    </>
  );
}
