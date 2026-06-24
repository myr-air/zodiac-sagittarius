import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { frontendRoot } from "../../project/contracts/project-contract.helpers";

const workspacePageCompositionFiles = [
  "src/features/workspace/pages/bookings-docs/BookingsDocsPage.tsx",
  "src/features/workspace/pages/expenses/TripExpensesPage.tsx",
  "src/features/workspace/pages/members/TripMembersPage.tsx",
  "src/features/workspace/pages/photos/TripPhotosPage.tsx",
  "src/features/workspace/pages/trip-settings/TripSettingsPage.tsx",
] as const;

function sourceLineCount(path: string): number {
  const source = readFileSync(join(frontendRoot, path), "utf8");
  return source.split(/\r?\n/).length;
}

describe("Sagittarius workspace page size boundaries", () => {
  it("keeps workspace page composition files below the 400-line review band", () => {
    const oversizedPages = workspacePageCompositionFiles
      .map((path) => ({ path, lines: sourceLineCount(path) }))
      .filter(({ lines }) => lines > 400);

    expect(oversizedPages).toEqual([]);
  });
});
