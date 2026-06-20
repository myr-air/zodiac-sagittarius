import type { ExpenseSplitMode } from "@/src/trip/expenses";
import type { Expense, ItineraryItem, Trip, TripPlan } from "@/src/trip/types";
import { Select } from "@/src/ui";
import * as expenseStyles from "../TripExpensesPage.styles";
import { expenseCategories, expenseSplitModes } from "../expense-page-options";

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
  return (
    <>
      <label className={expenseStyles.fieldClassName}>
        <span>{copy.fields.paidBy}</span>
        <Select value={paidBy} onChange={(event) => onPaidByChange(event.target.value)}>
          {trip.members.map((member) => <option key={member.id} value={member.id}>{member.displayName}</option>)}
        </Select>
      </label>
      <label className={expenseStyles.fieldClassName}>
        <span>{copy.fields.category}</span>
        <Select value={category} onChange={(event) => onCategoryChange(event.target.value as Expense["category"])}>
          {expenseCategories.map((candidate) => <option key={candidate} value={candidate}>{candidate}</option>)}
        </Select>
      </label>
      <div className="grid gap-1.5">
        <label className={expenseStyles.fieldClassName}>
          <span>{copy.fields.tripPlan}</span>
          <Select value={effectiveTripPlanId} disabled={Boolean(linkedItem)} onChange={(event) => onTripPlanIdChange(event.target.value)}>
            {tripPlanOptions.map((plan) => (
              <option key={plan.id} value={plan.id}>{plan.name}</option>
            ))}
          </Select>
        </label>
        {linkedItem ? <span className={expenseStyles.balanceMetaClassName}>{copy.dialog.planLockedToLinkedStop}</span> : null}
      </div>
      <label className={expenseStyles.fieldClassName}>
        <span>{copy.fields.linkedStop}</span>
        <Select value={itemId} onChange={(event) => onItemIdChange(event.target.value)}>
          <option value="">{copy.fields.noLinkedStop}</option>
          {trip.itineraryItems.map((item) => <option key={item.id} value={item.id}>{item.activity}</option>)}
        </Select>
      </label>
      <label className={expenseStyles.fieldClassName}>
        <span>{copy.fields.splitMode}</span>
        <Select value={splitMode} onChange={(event) => onSplitModeChange(event.target.value as ExpenseSplitMode)}>
          {expenseSplitModes.map((mode) => <option key={mode} value={mode}>{copy.splitModes[mode]}</option>)}
        </Select>
      </label>
    </>
  );
}
