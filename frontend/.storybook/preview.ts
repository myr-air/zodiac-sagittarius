import type { Preview } from "@storybook/nextjs-vite";
import { createElement } from "react";
import "maplibre-gl/dist/maplibre-gl.css";
import "../app/globals.css";
import { initialize, mswLoader } from "msw-storybook-addon";
import { mswHandlers } from "./msw-handlers";
import { I18nProvider, localeStorageKey } from "../src/i18n/I18nProvider";
import { defaultLocale, isLocale, type Locale } from "../src/i18n/types";

initialize({ onUnhandledRequest: "bypass" });

const preview: Preview = {
  globalTypes: {
    locale: {
      description: "Interface language",
      defaultValue: defaultLocale,
      toolbar: {
        icon: "globe",
        items: [
          { value: "en", title: "English" },
          { value: "th", title: "ภาษาไทย" },
        ],
      },
    },
  },
  decorators: [
    (Story, context) => {
      const locale = storyLocale(context.parameters.locale ?? context.globals.locale);
      localStorage.setItem(localeStorageKey, locale);
      document.documentElement.lang = locale;

      return createElement(I18nProvider, { initialLocale: locale }, createElement(Story));
    },
  ],
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
    viewport: {
      options: {
        mobile320: {
          name: "Mobile 320",
          styles: { width: "320px", height: "720px" },
          type: "mobile",
        },
        tablet768: {
          name: "Tablet 768",
          styles: { width: "768px", height: "900px" },
          type: "tablet",
        },
        desktop1024: {
          name: "Desktop 1024",
          styles: { width: "1024px", height: "900px" },
          type: "desktop",
        },
        desktop1440: {
          name: "Desktop 1440",
          styles: { width: "1440px", height: "1000px" },
          type: "desktop",
        },
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
    localStorage.removeItem(localeStorageKey);
  },
};

export default preview;

function storyLocale(value: unknown): Locale {
  return isLocale(value) ? value : defaultLocale;
}
