import { describe, expect, it } from "vitest";

import {
  tripWorkspaceImportModeOptions,
  tripWorkspaceImportRecordModeOptions,
  tripWorkspaceImportScopeOptions,
} from "../trip-workspace-import-dialog-options";

describe("trip workspace import dialog options", () => {
  it("keeps import target enum values and labels centralized", () => {
    expect(tripWorkspaceImportScopeOptions).toEqual([
      { value: "trip", label: "Whole trip" },
      { value: "day", label: "This day only" },
    ]);
    expect(tripWorkspaceImportModeOptions).toEqual([
      { value: "replace-target", label: "Replace target path" },
      { value: "keep-alternatives", label: "Keep both as alternatives" },
    ]);
    expect(tripWorkspaceImportRecordModeOptions).toEqual([
      { value: "clone-linked", label: "Clone linked records" },
      { value: "activities-only", label: "Activities only" },
    ]);
  });
});
