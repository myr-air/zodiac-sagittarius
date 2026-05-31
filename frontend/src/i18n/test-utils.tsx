import type { ReactElement } from "react";
import { render, type RenderOptions } from "@testing-library/react";
import { I18nProvider } from "./I18nProvider";
import type { Locale } from "./types";

interface RenderWithI18nOptions extends RenderOptions {
  locale?: Locale;
}

export function renderWithI18n(ui: ReactElement, { locale, ...options }: RenderWithI18nOptions = {}) {
  if (locale) {
    window.localStorage.setItem("sagittarius-locale", locale);
  }

  return render(<I18nProvider>{ui}</I18nProvider>, options);
}
