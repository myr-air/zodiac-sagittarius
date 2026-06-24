import { describe, expect, it } from "vitest";
import {
  overviewTaskAssigneeSelectOptions,
  overviewTaskVisibilitySelectOptions,
} from "../overview-task-dialog-options";

describe("overview task dialog options", () => {
  it("builds visibility options from dialog labels", () => {
    expect(
      overviewTaskVisibilitySelectOptions({
        private: "Private",
        shared: "Shared with trip",
      }),
    ).toEqual([
      { value: "private", label: "Private" },
      { value: "shared", label: "Shared with trip" },
    ]);
  });

  it("keeps the empty assignee option before assignable members", () => {
    expect(
      overviewTaskAssigneeSelectOptions(
        [
          { id: "member-aom", displayName: "Aom" },
          { id: "member-beam", displayName: "Beam" },
        ],
        "No assignee",
      ),
    ).toEqual([
      { value: "", label: "No assignee" },
      { value: "member-aom", label: "Aom" },
      { value: "member-beam", label: "Beam" },
    ]);
  });
});
