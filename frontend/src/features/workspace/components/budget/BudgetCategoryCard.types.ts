import type { BudgetCategory } from "@/src/trip/types";

export interface BudgetCategoryCardProps {
  /** The budget category data. */
  category: BudgetCategory;
  /** Called when the estimated amount is edited inline. */
  onEdit: (id: string, updates: { estimated: number }) => void;
  /** Lucide icon name for the category. */
  iconName?: string;
}
