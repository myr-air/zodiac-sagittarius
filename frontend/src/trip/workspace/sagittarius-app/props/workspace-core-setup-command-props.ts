import type {
  WorkspaceCoreSetupCommandProps,
  WorkspaceSetupContext,
} from "./workspace-core-command-props.types";

export function buildWorkspaceCoreSetupCommandProps(
  setup: WorkspaceSetupContext,
): WorkspaceCoreSetupCommandProps {
  return {
    dismissWorkspaceToast: setup.dismissWorkspaceToast,
    navigateWorkspaceView: setup.navigateWorkspaceView,
    onAccountSessionChange: setup.changeAccountSession,
    onChangeDayPath: setup.changeDayPath,
    onClearDayPath: setup.clearDayPath,
    onCreatePhotoAlbum: setup.createPhotoAlbum,
    onDeletePhotoAlbum: setup.deletePhotoAlbum,
    onOpenExpenses: setup.openExpensesWorkspace,
    onSaveDailyBriefingOverrides: setup.saveDailyBriefingOverrides,
    onToggleContextRail: setup.toggleContextRail,
    onToggleShowAllPaths: setup.toggleShowAllPaths,
    onUpdatePhotoAlbum: setup.updatePhotoAlbum,
    saveDailyBriefingOverrides: setup.saveDailyBriefingOverrides,
    setContextRailVisibility: setup.setContextRailVisibility,
    setCurrentMemberId: setup.setCurrentMemberId,
    setDialogDeleteItem: setup.setDialogDeleteItem,
    setDialogState: setup.setDialogState,
    setStopPlaceResolution: setup.setStopPlaceResolution,
    toggleContextRailCollapsed: setup.toggleSidebarCollapsed,
  };
}
