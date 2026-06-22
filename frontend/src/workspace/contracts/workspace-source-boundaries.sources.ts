import { readFileSync } from "node:fs";
import { join } from "node:path";
import { workspaceFeatureBoundarySourcePaths } from "./workspace-source-boundaries.feature-paths";
import { workspacePlatformBoundarySourcePaths } from "./workspace-source-boundaries.platform-paths";
import { workspaceStoryBoundarySourcePaths } from "./workspace-source-boundaries.story-paths";
import { workspaceTripBoundarySourcePaths } from "./workspace-source-boundaries.trip-paths";

export const workspaceBoundarySourcePaths = {
  ...workspaceTripBoundarySourcePaths,
  ...workspaceFeatureBoundarySourcePaths,
  ...workspacePlatformBoundarySourcePaths,
  ...workspaceStoryBoundarySourcePaths,
} as const;

export type WorkspaceBoundarySourceName = keyof typeof workspaceBoundarySourcePaths;

export type WorkspaceBoundarySources = {
  [Name in WorkspaceBoundarySourceName]: string;
};

export function readWorkspaceBoundarySources(frontendRoot: string): WorkspaceBoundarySources {
  return Object.fromEntries(
    Object.entries(workspaceBoundarySourcePaths).map(([name, sourcePath]) => [
      name,
      readFileSync(join(frontendRoot, sourcePath), "utf8"),
    ]),
  ) as WorkspaceBoundarySources;
}
