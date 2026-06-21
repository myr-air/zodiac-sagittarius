import { renderWithI18n } from "@/src/i18n/test-utils";

type RenderUi = Parameters<typeof renderWithI18n>[0];

export const renderStopDialog = (ui: RenderUi) => renderWithI18n(ui, { locale: "th" });
export const renderStopDialogEn = (ui: RenderUi) => renderWithI18n(ui, { locale: "en" });
