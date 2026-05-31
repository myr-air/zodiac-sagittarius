import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { I18nProvider, useI18n } from "./I18nProvider";
import { LanguageSwitch } from "./LanguageSwitch";

const localStorage = installLocalStorageStub();

function Probe() {
  const { locale, t } = useI18n();
  return (
    <div>
      <span data-testid="locale">{locale}</span>
      <span>{t.common.language.english}</span>
      <span>{t.appShell.nav.overview}</span>
      <LanguageSwitch />
    </div>
  );
}

describe("I18nProvider", () => {
  it("renders English by default", () => {
    localStorage.clear();

    render(
      <I18nProvider>
        <Probe />
      </I18nProvider>,
    );

    expect(screen.getByTestId("locale")).toHaveTextContent("en");
    expect(screen.getByText("English")).toBeInTheDocument();
    expect(screen.getByText("Overview")).toBeInTheDocument();
    expect(document.documentElement).toHaveAttribute("lang", "en");
  });

  it("switches to Thai immediately and persists the choice", async () => {
    const user = userEvent.setup();
    localStorage.clear();

    const { unmount } = render(
      <I18nProvider>
        <Probe />
      </I18nProvider>,
    );

    await user.click(screen.getByRole("button", { name: "ภาษาไทย" }));

    expect(screen.getByTestId("locale")).toHaveTextContent("th");
    expect(screen.getByText("ภาพรวม")).toBeInTheDocument();
    expect(localStorage.getItem("sagittarius-locale")).toBe("th");
    expect(document.documentElement).toHaveAttribute("lang", "th");

    unmount();

    render(
      <I18nProvider>
        <Probe />
      </I18nProvider>,
    );

    expect(screen.getByTestId("locale")).toHaveTextContent("th");
    expect(screen.getByText("ภาพรวม")).toBeInTheDocument();
  });

  it("falls back to English for an unknown stored locale", () => {
    localStorage.setItem("sagittarius-locale", "fr");

    render(
      <I18nProvider>
        <Probe />
      </I18nProvider>,
    );

    expect(screen.getByTestId("locale")).toHaveTextContent("en");
    expect(screen.getByText("Overview")).toBeInTheDocument();
  });
});

function installLocalStorageStub() {
  const values = new Map<string, string>();
  const storage = {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
    removeItem: (key: string) => values.delete(key),
    clear: () => values.clear(),
  };

  Object.defineProperty(window, "localStorage", {
    configurable: true,
    value: storage,
  });

  return storage;
}
