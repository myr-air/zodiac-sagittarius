import { describe, expect, it } from "vitest";
import {
  workspaceCompactFieldGroupClassName,
  workspaceFieldClassName,
} from "../workspace-form-field.styles";

describe("workspaceFieldClassName", () => {
  it("keeps workspace form label and control styling in one shared class", () => {
    expect(workspaceFieldClassName).toContain("[&>span]:text-[11px]");
    expect(workspaceFieldClassName).toContain("[&_input]:min-h-10");
    expect(workspaceFieldClassName).toContain("[&_select]:min-h-10");
    expect(workspaceFieldClassName).toContain("[&_textarea]:min-h-[74px]");
  });

  it("keeps compact descendant field styling in one shared class", () => {
    expect(workspaceCompactFieldGroupClassName).toContain("[&_label]:grid");
    expect(workspaceCompactFieldGroupClassName).toContain("[&_input]:min-h-[34px]");
    expect(workspaceCompactFieldGroupClassName).toContain("[&_select]:min-h-[34px]");
    expect(workspaceCompactFieldGroupClassName).toContain("[&_input:disabled]:bg-(--color-surface-muted)");
  });
});
