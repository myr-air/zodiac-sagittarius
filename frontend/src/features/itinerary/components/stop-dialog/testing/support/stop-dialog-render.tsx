import { renderWithI18n, type RenderWithI18nUi } from "@/src/i18n/test-utils";

type RenderUi = RenderWithI18nUi;

export const renderStopDialog = (ui: RenderUi) => renderWithI18n(ui, { locale: "th" });
export const renderStopDialogEn = (ui: RenderUi) => renderWithI18n(ui, { locale: "en" });
