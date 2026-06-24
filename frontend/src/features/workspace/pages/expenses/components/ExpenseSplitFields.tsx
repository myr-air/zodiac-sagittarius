import type { ExpenseSplitMode } from "@/src/trip/expenses";
import type { Member } from "@/src/trip/types";
import { Button } from "@/src/ui";
import * as expenseStyles from "../TripExpensesPage.styles";
import type { EditableExpenseLineItem } from "../model/expense-dialog-line-items";

interface ExpenseSplitFieldsProps {
  splitMode: ExpenseSplitMode;
  members: Member[];
  lineItems: EditableExpenseLineItem[];
  splitValues: Record<string, string>;
  copy: {
    actions: {
      addLineItem: string;
    };
    fields: {
      lineAmount: string;
      lineGroup: (input: { number: number }) => string;
      lineParticipants: string;
      lineTitle: string;
      memberShare: (input: { name: string }) => string;
    };
  };
  onAddLineItem: () => void;
  onToggleLineParticipant: (index: number, memberId: string) => void;
  onUpdateLineItem: (index: number, patch: Partial<EditableExpenseLineItem>) => void;
  onUpdateSplitValue: (memberId: string, value: string) => void;
}

export function ExpenseSplitFields({
  splitMode,
  members,
  lineItems,
  splitValues,
  copy,
  onAddLineItem,
  onToggleLineParticipant,
  onUpdateLineItem,
  onUpdateSplitValue,
}: ExpenseSplitFieldsProps) {
  if (splitMode === "itemized") {
    return (
      <div className={expenseStyles.itemizedListClassName}>
        {lineItems.map((lineItem, index) => (
          <fieldset className={expenseStyles.itemizedLineClassName} key={lineItem.id} role="group" aria-label={copy.fields.lineGroup({ number: index + 1 })}>
            <div className={expenseStyles.dialogSecondaryGridClassName}>
              <label className={expenseStyles.fieldClassName}>
                <span>{copy.fields.lineTitle}</span>
                <input
                  placeholder="Taxi van"
                  value={lineItem.title}
                  onChange={(event) => onUpdateLineItem(index, { title: event.target.value })}
                />
              </label>
              <label className={expenseStyles.fieldClassName}>
                <span>{copy.fields.lineAmount}</span>
                <input inputMode="decimal" value={lineItem.amount} onChange={(event) => onUpdateLineItem(index, { amount: event.target.value })} />
              </label>
            </div>
            <div className={expenseStyles.participantChecksClassName} aria-label={copy.fields.lineParticipants}>
              {members.map((member) => (
                <label key={member.id}>
                  <input
                    type="checkbox"
                    checked={lineItem.participantIds.includes(member.id)}
                    onChange={() => onToggleLineParticipant(index, member.id)}
                  />
                  {member.displayName}
                </label>
              ))}
            </div>
          </fieldset>
        ))}
        <Button type="button" variant="ghost" onClick={onAddLineItem}>{copy.actions.addLineItem}</Button>
      </div>
    );
  }

  if (splitMode === "equal" || splitMode === "personal") {
    return null;
  }

  return (
    <div className={expenseStyles.splitMemberFieldGridClassName}>
      {members.map((member) => (
        <label className={expenseStyles.splitMemberFieldClassName} key={member.id}>
          <span>{copy.fields.memberShare({ name: member.displayName })}</span>
          <input
            inputMode="decimal"
            value={splitValues[member.id] ?? ""}
            onChange={(event) => onUpdateSplitValue(member.id, event.target.value)}
          />
        </label>
      ))}
    </div>
  );
}
