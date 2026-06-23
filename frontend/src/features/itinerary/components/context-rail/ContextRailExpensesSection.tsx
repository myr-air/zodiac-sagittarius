import { useI18n } from "@/src/i18n/I18nProvider";
import {
  expenseGridClassName,
  moduleListClassName,
} from "./context-rail.styles";
import { ContextRailDetailSection } from "./ContextRailDetailSection";
import { ContextRailExpenseForm } from "./ContextRailExpenseForm";
import { ContextRailExpenseItem } from "./ContextRailExpenseItem";
import { useContextRailExpenseForm } from "./use-context-rail-expense-form";
import type { ContextRailExpensesSectionProps } from "./context-rail.types";

export function ContextRailExpensesSection({
  selectedItemId,
  expenses,
  members,
  perPerson,
  groupSpend,
  canEditExpenses,
  onCreateExpense,
  onUpdateExpense,
  onDeleteExpense,
}: ContextRailExpensesSectionProps) {
  const { t } = useI18n();
  const {
    editingExpenseId,
    expenseAmount,
    expenseCategory,
    expensePaidBy,
    expenseTitle,
    onAmountChange,
    setExpenseCategory,
    setExpensePaidBy,
    setExpenseTitle,
    startEditingExpense,
    submitExpense,
  } = useContextRailExpenseForm({
    defaultPaidBy: members[0]?.id ?? "",
    onCreateExpense,
    onUpdateExpense,
    selectedItemId,
  });

  return (
    <ContextRailDetailSection
      className="expense-module"
      ariaLabel={t.contextRail.expenses.label}
      title={t.contextRail.expenses.title}
    >
      <div className={expenseGridClassName}>
        <span>{t.contextRail.expenses.perPerson}</span>
        <strong>{perPerson}</strong>
        <span>
          {t.contextRail.expenses.totalFor({
            count: Math.max(0, members.length - 1),
          })}
        </span>
        <strong>{groupSpend}</strong>
      </div>
      <div className={moduleListClassName}>
        {expenses.map((expense) => (
          <ContextRailExpenseItem
            canEditExpenses={canEditExpenses}
            expense={expense}
            key={expense.id}
            onDeleteExpense={onDeleteExpense}
            onEditExpense={startEditingExpense}
          />
        ))}
      </div>
      <ContextRailExpenseForm
        canEditExpenses={canEditExpenses}
        editingExpenseId={editingExpenseId}
        expenseAmount={expenseAmount}
        expenseCategory={expenseCategory}
        expensePaidBy={expensePaidBy}
        expenseTitle={expenseTitle}
        labels={{
          actualOnlyHint: t.contextRail.expenses.actualOnlyHint,
          amount: t.contextRail.expenses.formAmount,
          category: t.contextRail.expenses.formCategory,
          create: t.contextRail.expenses.edit,
          paidBy: t.contextRail.expenses.formPaidBy,
          save: t.common.actions.save,
          title: t.contextRail.expenses.formTitle,
        }}
        members={members}
        onAmountChange={onAmountChange}
        onCategoryChange={setExpenseCategory}
        onPaidByChange={setExpensePaidBy}
        onSubmit={submitExpense}
        onTitleChange={setExpenseTitle}
      />
    </ContextRailDetailSection>
  );
}
