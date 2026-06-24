import {
  appStoryPaths,
  itineraryStoryPaths,
  srcStoryPath,
  workspaceStoryPaths,
} from "../../storybook/contracts/storybook.contract.story-paths";

export const workspaceStoryBoundarySourcePaths = {
  expensesPageStory: srcStoryPath(workspaceStoryPaths.expensesPage),
  sagittariusAppStory: srcStoryPath(appStoryPaths.sagittariusApp),
  appShellStory: srcStoryPath(workspaceStoryPaths.appShell),
  appShellStorySupport: srcStoryPath(workspaceStoryPaths.appShellSupport),
  bookingsDocsPageStory: srcStoryPath(workspaceStoryPaths.bookingsDocsPage),
  contextRailStory: srcStoryPath(itineraryStoryPaths.contextRail),
  stopDialogStory: srcStoryPath(itineraryStoryPaths.stopDialog),
  tripSettingsPageStory:
    srcStoryPath(workspaceStoryPaths.tripSettingsPage),
  photosPageStory: srcStoryPath(workspaceStoryPaths.photosPage),
  membersPageStory: srcStoryPath(workspaceStoryPaths.membersPage),
  membersTemplateStory: srcStoryPath(workspaceStoryPaths.membersTemplate),
  itineraryPageStory: srcStoryPath(itineraryStoryPaths.itineraryPage),
  itineraryPageStoryPlays: srcStoryPath(itineraryStoryPaths.itineraryPagePlays),
  itineraryTemplateStory: srcStoryPath(itineraryStoryPaths.itineraryTemplate),
  itineraryTemplateStoryPlays: srcStoryPath(
    itineraryStoryPaths.itineraryTemplatePlays,
  ),
  overviewPageStory: srcStoryPath(itineraryStoryPaths.overviewPage),
  overviewTemplateStory: srcStoryPath(itineraryStoryPaths.overviewTemplate),
  timelinePageStory: srcStoryPath(itineraryStoryPaths.timelinePage),
  mapPageStory: srcStoryPath(itineraryStoryPaths.mapPage),
  mapTemplateStory: srcStoryPath(itineraryStoryPaths.mapTemplate),
} as const;
