import type { Preview } from "@storybook/nextjs-vite";
import "../app/globals.css";

const preview: Preview = {
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
      test: "todo",
    },
  },
};

export default preview;
