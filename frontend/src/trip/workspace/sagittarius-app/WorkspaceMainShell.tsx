import type { ComponentProps } from "react";
import { AppShell } from "@/src/features/workspace/components/app-shell";
import { TripWorkspaceFrame } from "@/src/trip/workspace/TripWorkspaceFrame";
import { TripWorkspaceRail } from "@/src/trip/workspace/TripWorkspaceRail";
import { TripWorkspaceViews } from "@/src/trip/workspace/TripWorkspaceViews";
import { WorkspaceToast } from "@/src/trip/workspace/WorkspaceToast";
import { WorkspaceDialogs } from "./WorkspaceDialogs";
import { WorkspaceRolePreview } from "./WorkspaceRolePreview";
import { workspaceShellClassName } from "./sagittarius-app.styles";

export interface WorkspaceMainShellProps {
  appShellProps: Omit<ComponentProps<typeof AppShell>, "children">;
  dialogsProps: ComponentProps<typeof WorkspaceDialogs>;
  frameProps: Omit<ComponentProps<typeof TripWorkspaceFrame>, "children" | "rail">;
  railProps: ComponentProps<typeof TripWorkspaceRail>;
  rolePreviewProps: ComponentProps<typeof WorkspaceRolePreview>;
  showRolePreview: boolean;
  showToast: boolean;
  toastProps: ComponentProps<typeof WorkspaceToast>;
  viewsProps: ComponentProps<typeof TripWorkspaceViews>;
}

export function WorkspaceMainShell({
  appShellProps,
  dialogsProps,
  frameProps,
  railProps,
  rolePreviewProps,
  showRolePreview,
  showToast,
  toastProps,
  viewsProps,
}: WorkspaceMainShellProps) {
  return (
    <AppShell {...appShellProps}>
      <main className={workspaceShellClassName}>
        {showToast ? <WorkspaceToast {...toastProps} /> : null}
        {showRolePreview ? <WorkspaceRolePreview {...rolePreviewProps} /> : null}
        <TripWorkspaceFrame
          {...frameProps}
          rail={<TripWorkspaceRail {...railProps} />}
        >
          <TripWorkspaceViews {...viewsProps} />
        </TripWorkspaceFrame>
        <WorkspaceDialogs {...dialogsProps} />
      </main>
    </AppShell>
  );
}
