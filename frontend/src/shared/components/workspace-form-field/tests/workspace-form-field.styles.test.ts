import { describe, expect, it } from "vitest";
import { workspaceFieldClassName } from "../workspace-form-field.styles";

describe("workspaceFieldClassName", () => {
  it("keeps workspace form label and control styling in one shared class", () => {
    expect(workspaceFieldClassName).toContain("[&>span]:text-[11px]");
    expect(workspaceFieldClassName).toContain("[&_input]:min-h-10");
    expect(workspaceFieldClassName).toContain("[&_select]:min-h-10");
    expect(workspaceFieldClassName).toContain("[&_textarea]:min-h-[74px]");
  });
});
