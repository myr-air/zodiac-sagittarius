import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { HttpResponse, http } from "msw";
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

export const Thai: Story = {
  args: Ready.args,
  parameters: { locale: "th" },
  play: thaiPlay,
};

export const Mobile: Story = {
  args: Ready.args,
  parameters: { viewport: { defaultViewport: "mobile320" } },
  play: mobilePlay,
};

export const Tablet: Story = {
  args: Ready.args,
  parameters: { viewport: { defaultViewport: "tablet768" } },
  play: tabletPlay,
};

export const Desktop1024: Story = {
  args: Ready.args,
  parameters: { viewport: { defaultViewport: "desktop1024" } },
  play: tabletPlay,
};

export const Desktop1440: Story = {
  args: Ready.args,
  parameters: { viewport: { defaultViewport: "desktop1440" } },
  play: tabletPlay,
};
