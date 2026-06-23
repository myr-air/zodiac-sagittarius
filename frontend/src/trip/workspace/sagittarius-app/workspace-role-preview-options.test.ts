import { describe, expect, it } from "vitest";

import { buildWorkspaceRolePreviewOptions } from "./workspace-role-preview-options";

describe("buildWorkspaceRolePreviewOptions", () => {
  it("formats member labels with their workspace role", () => {
    expect(
      buildWorkspaceRolePreviewOptions([
        {
          id: "member-aom",
          displayName: "Aom",
          role: "owner",
          presence: "online",
          color: "#0f766e",
        },
        {
          id: "member-beam",
          displayName: "Beam",
          role: "traveler",
          presence: "away",
          color: "#2563eb",
        },
      ]),
    ).toEqual([
      { value: "member-aom", label: "Aom (owner)" },
      { value: "member-beam", label: "Beam (traveler)" },
    ]);
  });
});
