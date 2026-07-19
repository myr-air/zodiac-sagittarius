/**
 * Account home visual/layout theme contract (draft v3).
 */

export type AccountHomeTheme = {
  colors: {
    page: string;
    navy: string;
    orange: string;
    teal: string;
  };
  accents: {
    detailsChip: string;
    dateBadge: string;
  };
  layout: {
    /** Compose grid stacks to a single column at or below this width (px). */
    composeStackMaxWidthPx: number;
  };
  mobile: {
    viewportWidthPx: number;
    overflowX: string;
    composeLayout: string;
  };
};

/** Draft-v3 theme contract for Account Home. */
export const accountHomeTheme: AccountHomeTheme = {
  colors: {
    page: "#f5f6f8",
    navy: "#1e2433",
    orange: "#ff7a1a",
    teal: "#0f766e",
  },
  accents: {
    detailsChip: "orange",
    dateBadge: "orange",
  },
  layout: {
    composeStackMaxWidthPx: 1020,
  },
  mobile: {
    viewportWidthPx: 375,
    overflowX: "hidden",
    composeLayout: "stacked",
  },
};
