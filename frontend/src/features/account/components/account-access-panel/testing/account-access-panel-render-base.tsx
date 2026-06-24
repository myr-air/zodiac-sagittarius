import { type ReactElement } from "react";
import { I18nProvider } from "@/src/i18n/I18nProvider";
import { renderWithI18n } from "@/src/i18n/test-utils";

export function render(ui: ReactElement) {
  const result = renderWithI18n(ui, { locale: "en" });
  const originalRerender = result.rerender;

  return {
    ...result,
    rerender: (nextUi: ReactElement) => originalRerender(<I18nProvider>{nextUi}</I18nProvider>),
  };
}
