import { buildWorkspacePageViewProps } from "./workspace-page-view-props";
import { buildWorkspacePlanningViewProps } from "./workspace-planning-view-props";
import type {
  BuildWorkspaceViewsPropsInput,
  WorkspaceViewsProps,
} from "./workspace-view-props.types";

export function buildWorkspaceViewsProps(
  input: BuildWorkspaceViewsPropsInput,
): WorkspaceViewsProps {
  return {
    currentView: input.currentView,
    ...buildWorkspacePageViewProps(input),
    ...buildWorkspacePlanningViewProps(input),
  };
}
