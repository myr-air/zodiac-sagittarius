import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { HttpResponse, http } from "msw";
import { expect } from "storybook/test";
import { AboutAppPage } from "./AboutAppPage";

const webVersion = {
  apiHost: "api.joii.test",
  apiVersionUrl: "https://api.joii.test/api/v1/version",
  buildSha: "bd5a3ced",
  buildTime: "2026-06-11T09:42:00.000Z",
  environment: "storybook",
  runtimeMode: "api",
  schemaVersion: "frontend-static",
  service: "sagittarius-web",
  version: "0.1.0",
} as const;

const apiVersion = {
  buildSha: "7b87bde4",
  buildTime: "2026-06-11T08:18:00.000Z",
  environment: "staging",
  schemaVersion: "0019_photo_album_links",
  service: "sagittarius-api",
  version: "0.1.0",
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
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("heading", { name: "About Joii" })).toBeVisible();
    await expect(await canvas.findByText("API connected")).toBeVisible();
    await expect(await canvas.findByText("sagittarius-api v0.1.0")).toBeVisible();
  },
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
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("heading", { name: "About Joii" })).toBeVisible();
    await expect(await canvas.findByText("API version unavailable")).toBeVisible();
  },
};

export const Mobile: Story = {
  args: Ready.args,
  parameters: { viewport: { defaultViewport: "mobile320" } },
};
