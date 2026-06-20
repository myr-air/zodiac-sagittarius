import { WorkspaceAccessBoundary, type WorkspaceAccessBoundaryProps } from "./access-gate";
import { WorkspaceMainShell, type WorkspaceMainShellProps } from "./WorkspaceMainShell";

interface WorkspaceAppFrameProps {
  accessProps: Omit<WorkspaceAccessBoundaryProps, "children">;
  shellProps: WorkspaceMainShellProps;
}

export function WorkspaceAppFrame({ accessProps, shellProps }: WorkspaceAppFrameProps) {
  return (
    <WorkspaceAccessBoundary {...accessProps}>
      <WorkspaceMainShell {...shellProps} />
    </WorkspaceAccessBoundary>
  );
}
