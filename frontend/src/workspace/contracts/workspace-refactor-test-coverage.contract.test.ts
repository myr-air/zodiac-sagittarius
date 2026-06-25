import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { frontendRoot } from "../../project/contracts/project-contract.helpers";

const pureHelperTestPaths = [
  "src/shared/components/copy-feedback/tests/copy-feedback-labels.test.ts",
  "src/shared/components/copy-feedback/tests/use-copy-feedback-state.test.ts",
  "src/shared/components/workspace-panel-heading/tests/WorkspacePanelHeading.styles.test.ts",
  "src/shared/components/workspace-summary-stat/tests/WorkspaceSummaryStat.styles.test.ts",
  "src/shared/components/workspace-badge/tests/workspace-badge.styles.test.ts",
  "src/features/workspace/pages/expenses/model/tests/expense-page-options.test.ts",
  "src/features/workspace/pages/members/model/tests/member-page-options.test.ts",
  "src/features/workspace/pages/photos/model/tests/photo-page-options.test.ts",
  "src/trip/tests/booking-docs/booking-doc-display.test.ts",
  "src/trip/tests/trip-plans/trip-plan-display.test.ts",
] as const;

const userVisibleFeatureTestExpectations = [
  {
    path: "src/features/workspace/pages/bookings-docs/tests/BookingsDocsPage.overview.test.tsx",
    assertions: [
      'getByRole("region", { name: "Bookings & Docs" })',
      'getByRole("button", { name: /Select Bangkok to Hong Kong flight/i })',
      'getByRole("heading", { name: "Bangkok to Hong Kong flight" })',
    ],
  },
  {
    path: "src/features/workspace/pages/expenses/tests/TripExpensesPage.overview.test.tsx",
    assertions: [
      'getByRole("region", { name: /เงินทริป/i })',
      'getByRole("region", { name: /สรุปเงิน/i })',
      'getByRole("button", { name: /เพิ่มรายการ/i })',
    ],
  },
  {
    path: "src/features/workspace/pages/members/tests/TripMembersPage.filters.test.tsx",
    assertions: [
      "getByLabelText(/ค้นหาสมาชิก/i)",
      'getByRole("button", { name: /ล้างตัวกรอง/i })',
      "getByRole(\"status\")",
    ],
  },
  {
    path: "src/features/workspace/pages/photos/tests/TripPhotosPage.test.tsx",
    assertions: [
      'getByRole("region", { name: "Photos & Albums" })',
      'getByRole("button", { name: "Google Photos, 1 albums" })',
      'getByRole("link", { name: /Open album/i })',
    ],
  },
] as const;

function readFrontendSource(path: string): string {
  const fullPath = join(frontendRoot, path);
  expect(existsSync(fullPath), `${path} should exist`).toBe(true);
  return readFileSync(fullPath, "utf8");
}

describe("Sagittarius refactor test coverage contracts", () => {
  it("keeps newly extracted shared/domain helpers covered by focused pure tests", () => {
    pureHelperTestPaths.forEach((path) => {
      const source = readFrontendSource(path);

      expect(source).toContain("describe(");
      expect(source).toContain("expect(");
    });
  });

  it("keeps workspace feature coverage anchored to visible UI behavior", () => {
    userVisibleFeatureTestExpectations.forEach(({ path, assertions }) => {
      const source = readFrontendSource(path);

      assertions.forEach((assertion) => expect(source).toContain(assertion));
      expect(source).not.toContain("ComponentProps<typeof");
      expect(source).not.toContain("toMatchSnapshot");
    });
  });
});
