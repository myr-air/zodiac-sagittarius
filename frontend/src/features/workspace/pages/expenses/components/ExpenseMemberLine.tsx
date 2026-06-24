import { PersonAvatar } from "@/src/shared/components/person-avatar";
import * as expenseStyles from "../TripExpensesPage.styles";

interface ExpenseMemberLineProps {
  color: string;
  name: string;
  meta?: string;
}

export function ExpenseMemberLine({ color, name, meta }: ExpenseMemberLineProps) {
  return (
    <span className={expenseStyles.memberLineClassName}>
      <PersonAvatar
        className={expenseStyles.avatarClassName}
        color={color}
        name={name}
      />
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
