import { buildWorkspaceCoreAppCommandProps } from "./workspace-core-app-command-props";
import { buildWorkspaceCorePlanningCommandProps } from "./workspace-core-planning-command-props";
import { buildWorkspaceCoreSetupCommandProps } from "./workspace-core-setup-command-props";
import type {
  WorkspaceCommands,
  WorkspaceCoreCommandProps,
  WorkspacePlanningContext,
  WorkspaceSetupContext,
} from "./workspace-core-command-props.types";

export function buildWorkspaceCoreCommandProps({
  commands,
  planning,
  setup,
}: {
  commands: WorkspaceCommands;
  planning: WorkspacePlanningContext;
  setup: WorkspaceSetupContext;
}): WorkspaceCoreCommandProps {
  return {
    ...buildWorkspaceCoreAppCommandProps(commands),
    ...buildWorkspaceCorePlanningCommandProps(planning),
    ...buildWorkspaceCoreSetupCommandProps(setup),
  };
}
