import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";
import {
  createMutableMemoryStorage,
  installLocalStorageStub,
} from "@/src/testing/browser-storage";
import { I18nProvider, useI18n } from "../I18nProvider";
import { LanguageSwitch } from "../LanguageSwitch";

const localStorage = createMutableMemoryStorage();
installLocalStorageStub(localStorage);

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
    expect(screen.getByRole("button", { name: /language and currency/i })).toHaveClass("language-switch-trigger");
    expect(screen.getByRole("button", { name: /language and currency/i })).toHaveTextContent("EN / HKD");
  });

  it("switches to Thai immediately and persists the choice", async () => {
    const user = userEvent.setup();
    localStorage.clear();

    const { unmount } = render(
      <I18nProvider>
        <Probe />
      </I18nProvider>,
    );

    await user.click(screen.getByRole("button", { name: /language and currency/i }));
    await user.click(screen.getByRole("menuitemradio", { name: "ภาษาไทย" }));

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

    await screen.findByText("ภาพรวม");
    expect(screen.getByTestId("locale")).toHaveTextContent("th");
  });

  it("selects and persists the display currency from the language menu", async () => {
    const user = userEvent.setup();
    localStorage.clear();

    const { unmount } = render(
      <I18nProvider>
        <Probe />
      </I18nProvider>,
    );

    await user.click(screen.getByRole("button", { name: /language and currency/i }));
    await user.click(screen.getByRole("menuitemradio", { name: "USD" }));

    expect(screen.getByRole("button", { name: /language and currency/i })).toHaveTextContent("EN / USD");
    expect(localStorage.getItem("sagittarius-currency")).toBe("USD");

    unmount();

    render(
      <I18nProvider>
        <Probe />
      </I18nProvider>,
    );

    await waitFor(() => expect(screen.getByRole("button", { name: /language and currency/i })).toHaveTextContent("EN / USD"));
  });

  it("shows visible labels and active states for every language and currency option", async () => {
    const user = userEvent.setup();
    localStorage.clear();

    render(
      <I18nProvider>
        <Probe />
      </I18nProvider>,
    );

    await user.click(screen.getByRole("button", { name: /language and currency/i }));

    expect(screen.getByRole("menuitemradio", { name: "English" })).toHaveTextContent("English");
    expect(screen.getByRole("menuitemradio", { name: "ภาษาไทย" })).toHaveTextContent("ภาษาไทย");
    expect(screen.getByRole("menuitemradio", { name: "HKD" })).toHaveTextContent("Hong Kong Dollar");
    expect(screen.getByRole("menuitemradio", { name: "USD" })).toHaveTextContent("US Dollar");
    expect(screen.getByRole("menuitemradio", { name: "English" })).toHaveAttribute("aria-checked", "true");
    expect(screen.getByRole("menuitemradio", { name: "HKD" })).toHaveAttribute("aria-checked", "true");
    expect(screen.getByRole("menu", { name: /language and currency/i })).toHaveClass("max-w-[calc(100vw-24px)]");
  });

  it("renders English markup before loading a stored Thai locale after mount", async () => {
    localStorage.setItem("sagittarius-locale", "th");

    const html = renderToString(
      <I18nProvider>
        <Probe />
      </I18nProvider>,
    );

    expect(html).toContain("en");
    expect(html).toContain("Overview");
    expect(html).not.toContain("ภาพรวม");

    render(
      <I18nProvider>
        <Probe />
      </I18nProvider>,
    );

    await screen.findByText("ภาพรวม");
    expect(screen.getByTestId("locale")).toHaveTextContent("th");
    expect(document.documentElement).toHaveAttribute("lang", "th");
  });

  it("falls back to English for an unknown stored locale", async () => {
    localStorage.setItem("sagittarius-locale", "fr");

    render(
      <I18nProvider>
        <Probe />
      </I18nProvider>,
    );

    expect(screen.getByTestId("locale")).toHaveTextContent("en");
    expect(screen.getByText("Overview")).toBeInTheDocument();
    await waitFor(() => expect(screen.getByTestId("locale")).toHaveTextContent("en"));
  });

  it("keeps the selected locale in memory when persistence fails", async () => {
    const user = userEvent.setup();
    localStorage.clear();
    localStorage.setWriteFailure(true);

    try {
      render(
        <I18nProvider>
          <Probe />
        </I18nProvider>,
      );

      await user.click(screen.getByRole("button", { name: /language and currency/i }));
      await user.click(screen.getByRole("menuitemradio", { name: "ภาษาไทย" }));

      expect(screen.getByTestId("locale")).toHaveTextContent("th");
      expect(screen.getByText("ภาพรวม")).toBeInTheDocument();
      expect(document.documentElement).toHaveAttribute("lang", "th");
      expect(localStorage.getItem("sagittarius-locale")).toBeNull();
    } finally {
      localStorage.setWriteFailure(false);
    }
  });
});
