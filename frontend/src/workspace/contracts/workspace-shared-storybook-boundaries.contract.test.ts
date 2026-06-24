import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { frontendRoot } from "../../project/contracts/project-contract.helpers";

const extractedSharedComponentStories = [
  {
    path: "src/shared/components/copy-feedback/storybook/CopyFeedback.stories.tsx",
    exports: ["SubtleBadge", "CompactCopied", "PillError", "WorkspacePill"],
  },
  {
    path: "src/shared/components/icon-text/storybook/IconText.stories.tsx",
    exports: ["Default", "TripFacts"],
  },
  {
    path: "src/shared/components/workspace-panel-heading/storybook/WorkspacePanelHeading.stories.tsx",
    exports: ["Compact", "Overview"],
  },
] as const;

function readStory(path: string): string {
  const fullPath = join(frontendRoot, path);
  expect(existsSync(fullPath)).toBe(true);
  return readFileSync(fullPath, "utf8");
}

describe("Sagittarius shared Storybook boundaries", () => {
  it("keeps newly extracted shared components represented in Storybook", () => {
    extractedSharedComponentStories.forEach(({ path, exports }) => {
      const source = readStory(path);

      expect(source).toContain("export default meta");
      exports.forEach((storyExport) => {
        expect(source).toContain(`export const ${storyExport}`);
      });
    });
  });
});
