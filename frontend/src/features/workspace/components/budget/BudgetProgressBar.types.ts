export interface BudgetProgressBarProps {
  /** Amount spent. */
  spent: number;
  /** Maximum budget amount. */
  max: number;
  /** Optional label override (defaults to "฿{spent} / ฿{max}"). */
  label?: string;
  /** Height in Tailwind utility (default: "h-3" = 12px). */
  heightClass?: string;
}
