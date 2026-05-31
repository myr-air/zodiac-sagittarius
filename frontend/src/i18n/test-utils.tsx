import type { ReactElement } from "react";
import { render, type RenderOptions } from "@testing-library/react";
import { I18nProvider, localeStorageKey } from "./I18nProvider";
import type { Locale } from "./types";

interface RenderWithI18nOptions extends RenderOptions {
  locale?: Locale;
}

export function renderWithI18n(ui: ReactElement, { locale, ...options }: RenderWithI18nOptions = {}) {
  const previousLocale = window.localStorage.getItem(localeStorageKey);
  window.localStorage.removeItem(localeStorageKey);

  if (locale) {
    window.localStorage.setItem(localeStorageKey, locale);
  }

  const result = render(<I18nProvider>{ui}</I18nProvider>, options);
  const originalUnmount = result.unmount;

  return {
    ...result,
    unmount: () => {
      originalUnmount();
      if (previousLocale !== null) {
        window.localStorage.setItem(localeStorageKey, previousLocale);
      } else {
        window.localStorage.removeItem(localeStorageKey);
      }
    },
  };
}
