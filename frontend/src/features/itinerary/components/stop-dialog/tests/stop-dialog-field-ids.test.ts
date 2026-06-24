import { describe, expect, it } from "vitest";

import { stopDialogFieldIds } from "../stop-dialog-field-ids";

describe("stop dialog field ids", () => {
  it("keeps stable ids for primary and advanced fields", () => {
    expect(stopDialogFieldIds.activity).toBe("stop-activity");
    expect(stopDialogFieldIds.destination).toBe("stop-destination");
    expect(stopDialogFieldIds.itemKind).toBe("stop-item-kind");
    expect(stopDialogFieldIds.isPlanBlock).toBe("stop-is-plan-block");
  });
});
