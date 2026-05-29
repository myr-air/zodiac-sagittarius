import type { Preview } from "@storybook/nextjs-vite";
import "maplibre-gl/dist/maplibre-gl.css";
import "../app/globals.css";
import { initialize, mswLoader } from "msw-storybook-addon";
import { mswHandlers } from "./msw-handlers";

initialize({ onUnhandledRequest: "bypass" });

const preview: Preview = {
  loaders: [mswLoader],
  parameters: {
    actions: { argTypesRegex: "^on.*" },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    backgrounds: {
      options: {
        studio: { name: "Friendly Trip Studio", value: "#f8fafc" },
        white: { name: "White", value: "#ffffff" },
      },
    },
    a11y: {
      test: "error",
    },
    msw: {
      handlers: mswHandlers,
    },
  },
  async beforeEach() {
    localStorage.removeItem("sagittarius:trip-draft");
    localStorage.removeItem("sagittarius:trip-participant-session");
  },
};

export default preview;
