import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { HttpResponse, http } from "msw";
import {
  argsStory,
  viewportStory,
} from "@/src/shared/storybook/story-builders";
import { AboutAppPage } from "./AboutAppPage";
import {
  apiUnavailablePlay,
  mobilePlay,
  readyPlay,
  tabletPlay,
  thaiPlay,
} from "./AboutAppPage.stories.plays";

const webVersion = {
  apiHost: "api.joii.test",
  apiVersionUrl: "https://api.joii.test/api/v1/version",
  buildSha: "bd5a3ced",
  buildTime: "2026-06-11T09:42:00.000Z",
  environment: "storybook",
  runtimeMode: "api",
  schemaVersion: "frontend-static",
  service: "sagittarius-web",
  version: "0.1.5",
} as const;

const apiVersion = {
  buildSha: "7b87bde4",
  buildTime: "2026-06-11T08:18:00.000Z",
  environment: "staging",
  schemaVersion: "0019_photo_album_links",
  service: "sagittarius-api",
  version: "0.1.5",
} as const;

const meta = {
  title: "Pages/About",
  component: AboutAppPage,
  parameters: {
    layout: "fullscreen",
    msw: {
      handlers: [
        http.get("https://api.joii.test/api/v1/version", () => HttpResponse.json(apiVersion)),
      ],
    },
  },
  tags: ["ai-generated"],
} satisfies Meta<typeof AboutAppPage>;

export default meta;

type Story = StoryObj<typeof meta>;
const aboutStory = argsStory<Story>;
const viewportStoryForAbout = viewportStory<Story>;

export const Ready: Story = {
  args: {
    webVersion,
  },
  play: readyPlay,
};

export const ApiUnavailable: Story = {
  args: {
    webVersion: {
      ...webVersion,
      apiHost: "local",
      apiVersionUrl: "data:text/plain,offline",
      runtimeMode: "local",
    },
  },
  play: apiUnavailablePlay,
};

export const Thai: Story = aboutStory(Ready.args ?? {}, {}, thaiPlay, {
  locale: "th",
});

export const Mobile: Story = viewportStoryForAbout(
  Ready.args ?? {},
  "mobile320",
  mobilePlay,
);

export const Tablet: Story = viewportStoryForAbout(
  Ready.args ?? {},
  "tablet768",
  tabletPlay,
);

export const Desktop1024: Story = viewportStoryForAbout(
  Ready.args ?? {},
  "desktop1024",
  tabletPlay,
);

export const Desktop1440: Story = viewportStoryForAbout(
  Ready.args ?? {},
  "desktop1440",
  tabletPlay,
);
