import { AppShell, type AppShellProps } from "@/src/features/workspace/components/app-shell";
import { TripWorkspaceFrame, type TripWorkspaceFrameProps } from "@/src/trip/workspace/TripWorkspaceFrame";
import { TripWorkspaceRail, type TripWorkspaceRailProps } from "@/src/trip/workspace/TripWorkspaceRail";
import { TripWorkspaceViews, type TripWorkspaceViewsProps } from "@/src/trip/workspace/TripWorkspaceViews";
import { WorkspaceToast, type WorkspaceToastProps } from "@/src/trip/workspace/WorkspaceToast";
import { WorkspaceDialogs, type WorkspaceDialogsProps } from "./WorkspaceDialogs";
import { WorkspaceRolePreview, type WorkspaceRolePreviewProps } from "./WorkspaceRolePreview";
import { workspaceShellClassName } from "./sagittarius-app.styles";

export interface WorkspaceMainShellProps {
  appShellProps: Omit<AppShellProps, "children">;
  dialogsProps: WorkspaceDialogsProps;
  frameProps: Omit<TripWorkspaceFrameProps, "children" | "rail">;
  railProps: TripWorkspaceRailProps;
  rolePreviewProps: WorkspaceRolePreviewProps;
  showRolePreview: boolean;
  showToast: boolean;
  toastProps: WorkspaceToastProps;
  viewsProps: TripWorkspaceViewsProps;
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
