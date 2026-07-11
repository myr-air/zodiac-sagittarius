export interface DateWindowRangeSliderProps {
  /** Minimum selectable date (YYYY-MM-DD). */
  minDate: string;
  /** Maximum selectable date (YYYY-MM-DD). */
  maxDate: string;
  /** Start handle date (YYYY-MM-DD). Must be ≤ end. */
  start: string;
  /** End handle date (YYYY-MM-DD). Must be ≥ start. */
  end: string;
  /** Called when either handle moves. Guaranteed start ≤ end. */
  onChange: (start: string, end: string) => void;
  /** Localized aria-label for the start handle. */
  ariaLabelStart?: string;
  /** Localized aria-label for the end handle. */
  ariaLabelEnd?: string;
}
