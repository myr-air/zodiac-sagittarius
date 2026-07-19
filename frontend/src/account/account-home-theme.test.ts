import { describe, expect, it } from "vitest";
import { accountHomeTheme } from "./account-home-theme";

/** Independent draft-v3 color literals from account-home-draft-v3.html :root. */
const DRAFT_V3_PAGE = "#f5f6f8";
const DRAFT_V3_NAVY = "#1e2433";
const DRAFT_V3_ORANGE = "#ff7a1a";
const DRAFT_V3_TEAL = "#0f766e";

/** Draft v3 stacks compose to one column at max-width 1020px. */
const DRAFT_V3_COMPOSE_STACK_MAX_PX = 1020;

/** Mobile viewport used for no-horizontal-scroll assertion. */
const MOBILE_VIEWPORT_PX = 375;

describe("accountHomeTheme", () => {
  it("exposes draft-v3 tokens: page, navy, orange accent, Joii teal", () => {
    expect(accountHomeTheme.colors.page).toBe(DRAFT_V3_PAGE);
    expect(accountHomeTheme.colors.navy).toBe(DRAFT_V3_NAVY);
    expect(accountHomeTheme.colors.orange).toBe(DRAFT_V3_ORANGE);
    expect(accountHomeTheme.colors.teal).toBe(DRAFT_V3_TEAL);
  });

  it("includes orange Details chips / date badges and compose stack ≤1020px", () => {
    expect(accountHomeTheme.accents.detailsChip).toBe("orange");
    expect(accountHomeTheme.accents.dateBadge).toBe("orange");
    expect(accountHomeTheme.layout.composeStackMaxWidthPx).toBe(
      DRAFT_V3_COMPOSE_STACK_MAX_PX,
    );
    expect(accountHomeTheme.layout.composeStackMaxWidthPx).toBeLessThanOrEqual(
      DRAFT_V3_COMPOSE_STACK_MAX_PX,
    );
  });

  it("declares mobile 375px overflow-x hidden and stacked compose", () => {
    expect(accountHomeTheme.mobile.viewportWidthPx).toBe(MOBILE_VIEWPORT_PX);
    expect(accountHomeTheme.mobile.overflowX).toBe("hidden");
    expect(accountHomeTheme.mobile.composeLayout).toBe("stacked");
  });
});
