import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { frontendRoot } from "./project-contract.helpers";

describe("Sagittarius frontend architecture contracts", () => {
  it("keeps shared UI primitives split by responsibility", () => {
    const uiIndex = readFileSync(join(frontendRoot, "src/ui/index.ts"), "utf8");
    const primitives = readFileSync(join(frontendRoot, "src/ui/primitives.tsx"), "utf8");
    const primitiveStyles = readFileSync(join(frontendRoot, "src/ui/primitive-styles.ts"), "utf8");
    const workspacePrimitiveStyles = readFileSync(join(frontendRoot, "src/ui/workspace-primitive-styles.ts"), "utf8");
    const workspacePrimitives = readFileSync(join(frontendRoot, "src/ui/workspace-primitives.tsx"), "utf8");

    expect(uiIndex).toContain("./primitives");
    expect(uiIndex).toContain("./workspace-primitives");
    expect(primitives).toContain("export function Button");
    expect(primitives).toContain("export function Badge");
    expect(primitives).toContain("./primitive-styles");
    expect(primitives).not.toContain("const buttonBaseClassName");
    expect(primitiveStyles).toContain("export const buttonBaseClassName");
    expect(primitiveStyles).toContain("export const badgeBaseClassName");
    expect(primitiveStyles).toContain("export type ButtonVariant = keyof typeof buttonVariantClassNames");
    expect(primitiveStyles).toContain("export type BadgeTone = keyof typeof badgeToneClassNames");
    expect(primitiveStyles).toContain("export type ActionBarAlign = keyof typeof actionBarAlignClassNames");
    expect(primitiveStyles).not.toContain('export type ButtonVariant = "');
    expect(primitiveStyles).not.toContain('export type BadgeTone = "');
    expect(primitiveStyles).not.toContain('export type ActionBarAlign = "');
    expect(primitives).not.toContain("export function WorkspaceSurface");
    expect(primitives).not.toContain("fieldControlClassName");
    expect(workspacePrimitives).toContain("export function WorkspaceSurface");
    expect(workspacePrimitives).toContain("export function WorkspacePage");
    expect(workspacePrimitives).toContain("./workspace-primitive-styles");
    expect(workspacePrimitives).toContain("fieldControlClassName");
    expect(workspacePrimitives).not.toContain("const workspacePageBaseClassName");
    expect(workspacePrimitives).not.toContain("const workspaceSurfaceDensityClassNames");
    expect(workspacePrimitiveStyles).toContain("export const workspacePageBaseClassName");
    expect(workspacePrimitiveStyles).toContain("export const workspaceSurfaceDensityClassNames");
    expect(workspacePrimitiveStyles).toContain("export const fieldControlClassName");
    expect(workspacePrimitiveStyles).toContain(
      "export type WorkspacePageKind = keyof typeof workspacePageKindClassNames",
    );
    expect(workspacePrimitiveStyles).toContain(
      "export type WorkspaceSurfaceDensity = keyof typeof workspaceSurfaceDensityClassNames",
    );
    expect(workspacePrimitiveStyles).not.toContain('export type WorkspacePageKind = "');
    expect(workspacePrimitiveStyles).not.toContain('export type WorkspaceSurfaceDensity = "');
  });

  it("keeps AppShell split into component, styles, and support logic", () => {
    const appShell = readFileSync(join(frontendRoot, "src/features/workspace/components/app-shell/AppShell.tsx"), "utf8");
    const appShellMemberCard = readFileSync(join(frontendRoot, "src/features/workspace/components/app-shell/AppShellMemberCard.tsx"), "utf8");
    const appShellStyles = readFileSync(join(frontendRoot, "src/features/workspace/components/app-shell/AppShell.styles.ts"), "utf8");
    const appShellSupport = readFileSync(join(frontendRoot, "src/features/workspace/components/app-shell/app-shell.support.ts"), "utf8");

    expect(appShell).toContain("./AppShell.styles");
    expect(appShell).toContain("./AppShellMemberCard");
    expect(appShell).toContain("./app-shell.support");
    expect(appShell).not.toContain("const appLayoutClassName");
    expect(appShell).not.toContain("identityDialogOpen");
    expect(appShell).not.toContain("function roleLabel");
    expect(appShellMemberCard).toContain("export function AppShellMemberCard");
    expect(appShellMemberCard).toContain("@/src/trip/members");
    expect(appShellMemberCard).toContain("WorkspaceConfirmDialog");
    expect(appShellMemberCard).toContain("roleLabel");
    expect(appShellMemberCard).toContain("identityDialogOpen");
    expect(appShellMemberCard).not.toContain("identityDialogBackdropClassName");
    expect(appShellMemberCard).not.toContain("identityDialogActionsClassName");
    expect(appShellMemberCard).not.toContain("identityDialogPrimaryButtonClassName");
    expect(appShellStyles).toContain("export const appLayoutClassName");
    expect(appShellStyles).toContain("export const sideRailClassName");
    expect(appShellStyles).toContain("export const identityDialogClassName");
    expect(appShellStyles).not.toContain("workspaceCompactDialogActionsClassName");
    expect(appShellStyles).not.toContain("identityDialogBackdropClassName");
    expect(appShellSupport).toContain("export function resolveViewFromPath");
    expect(appShellSupport).not.toContain("export function roleLabel");
  });

  it("keeps inline option picker menu rendering split from trigger state", () => {
    const picker = readFileSync(
      join(frontendRoot, "src/shared/components/inline-option-picker/InlineOptionPicker.tsx"),
      "utf8",
    );
    const pickerMenu = readFileSync(
      join(frontendRoot, "src/shared/components/inline-option-picker/InlineOptionPickerMenu.tsx"),
      "utf8",
    );
    const pickerPosition = readFileSync(
      join(
        frontendRoot,
        "src/shared/components/inline-option-picker/model/inline-option-picker-position.ts",
      ),
      "utf8",
    );
    const pickerStory = readFileSync(
      join(
        frontendRoot,
        "src/shared/components/inline-option-picker/storybook/InlineOptionPicker.stories.tsx",
      ),
      "utf8",
    );

    expect(picker).toContain("./InlineOptionPickerMenu");
    expect(picker).toContain("./model/inline-option-picker-position");
    expect(picker).not.toContain("createPortal");
    expect(picker).not.toContain("floatingOptionMenuClassName");
    expect(picker).not.toContain("window.innerHeight - rect.bottom");
    expect(pickerMenu).toContain("export function InlineOptionPickerMenu");
    expect(pickerMenu).toContain("createPortal");
    expect(pickerMenu).toContain("./model/inline-option-picker-position");
    expect(pickerMenu).not.toContain("function sideMenuFloatingLeft");
    expect(pickerPosition).toContain("export function inlineOptionPickerMenuPosition");
    expect(pickerPosition).toContain("export function inlineOptionPickerSideMenuPosition");
    expect(pickerStory).toContain("InlineOptionPickerProps");
    expect(pickerStory).not.toContain("ComponentProps<typeof InlineOptionPicker>");
  });

  it("keeps public about page styles colocated outside the page component", () => {
    const aboutPage = readFileSync(join(frontendRoot, "src/features/public-site/pages/about/AboutAppPage.tsx"), "utf8");
    const aboutPageStyles = readFileSync(join(frontendRoot, "src/features/public-site/pages/about/AboutAppPage.styles.ts"), "utf8");

    expect(aboutPage).toContain("./AboutAppPage.styles");
    expect(aboutPage).not.toContain("const pageClassName");
    expect(aboutPage).not.toContain("const heroClassName");
    expect(aboutPageStyles).toContain("export const pageClassName");
    expect(aboutPageStyles).toContain("export const heroClassName");
    expect(aboutPageStyles).toContain("export const statusPillReadyClassName");
  });

  it("keeps itinerary timeline styles colocated outside the view component", () => {
    const timelineView = readFileSync(join(frontendRoot, "src/features/itinerary/components/TimelineView.tsx"), "utf8");
    const timelineStyles = readFileSync(join(frontendRoot, "src/features/itinerary/components/TimelineView.styles.ts"), "utf8");

    expect(timelineView).toContain("./TimelineView.styles");
    expect(timelineView).not.toContain("const timelinePanelClassName");
    expect(timelineView).not.toContain("const timelineStopButtonClassName");
    expect(timelineStyles).toContain("export const timelinePanelClassName");
    expect(timelineStyles).toContain("export const timelineStopButtonClassName");
    expect(timelineStyles).toContain("export const pageHeaderActionsClassName");
  });

});
