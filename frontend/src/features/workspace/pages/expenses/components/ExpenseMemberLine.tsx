import { memberInitial } from "@/src/trip/members";
import * as expenseStyles from "../TripExpensesPage.styles";

interface ExpenseMemberLineProps {
  color: string;
  name: string;
  meta?: string;
}

export function ExpenseMemberLine({ color, name, meta }: ExpenseMemberLineProps) {
  return (
    <span className={expenseStyles.memberLineClassName}>
      <span
        className={expenseStyles.avatarClassName}
        style={{ backgroundColor: color }}
        aria-hidden="true"
      >
        {memberInitial(name)}
      </span>
      {meta ? (
        <span className="min-w-0">
          <span className={expenseStyles.balanceNameClassName}>{name}</span>
          <br />
          <span className={expenseStyles.balanceMetaClassName}>{meta}</span>
        </span>
      ) : (
        <span className={expenseStyles.balanceNameClassName}>{name}</span>
      )}
    </span>
  );
}
