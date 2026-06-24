import type { ReactElement } from "react";
import { render, type RenderOptions } from "@testing-library/react";
import { I18nProvider, localeStorageKey } from "./I18nProvider";
import type { Locale } from "./types";

export type RenderWithI18nUi = ReactElement;

interface RenderWithI18nOptions extends RenderOptions {
  locale?: Locale;
}

export function renderWithI18n(ui: RenderWithI18nUi, { locale, ...options }: RenderWithI18nOptions = {}) {
  const storage = window.localStorage;
  const previousLocale = storage?.getItem(localeStorageKey) ?? null;
  storage?.removeItem(localeStorageKey);

  if (locale) {
    storage?.setItem(localeStorageKey, locale);
  }

  const result = render(<I18nProvider initialLocale={locale}>{ui}</I18nProvider>, options);
  const originalUnmount = result.unmount;

  return {
    ...result,
    unmount: () => {
      originalUnmount();
      if (previousLocale !== null) {
        storage?.setItem(localeStorageKey, previousLocale);
      } else {
        storage?.removeItem(localeStorageKey);
      }
    },
  };
}
