/**
 * JoinCredentialsPanel — post-create one-shot share step (draft v2).
 * DOM: bunfig.toml preloads test/happy-dom-setup.ts for RTL under bun test.
 */
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom/vitest";
import { JoinCredentialsPanel } from "./JoinCredentialsPanel";

/** Independent literals from design/drafts/join-credentials-draft-v2.html */
const JOIN_ID = "2607-OSAK-0002";
const JOIN_PASSWORD = "6cS3gEFQbFviYAAWmw0uths4";
const WARNING_ONCE = "Password is shown once";
const WARNING_AGAIN = /won.?t appear again/i;
const CONTINUE_LABEL = "Continue to trip";
const SKIP_LABEL = "Skip for now";
const COPY_LABEL = "Copy";
const BRAND = "Joii";
/** Tailwind min-h-14 = 3.5rem = 56px (draft field / copy / primary CTA height). */
const FIELD_HEIGHT_CLASS = /min-h-14/;
const PHI_SPLIT_CLASS =
  /min-\[960px\]:grid-cols-\[minmax\(340px,1fr\)_minmax\(480px,1\.618fr\)\]/;
const RAIL_MAX_CLASS = /max-w-\[377px\]/;

afterEach(() => {
  cleanup();
});

function renderPanel(onContinue = vi.fn()) {
  return {
    onContinue,
    ...render(
      <JoinCredentialsPanel
        joinId={JOIN_ID}
        joinPassword={JOIN_PASSWORD}
        onContinue={onContinue}
      />,
    ),
  };
}

describe("JoinCredentialsPanel", () => {
  it("renders joinId and joinPassword with per-field Copy controls and a one-shot password warning", async () => {
    const user = userEvent.setup();
    // user-event.setup() installs its own clipboard; mock after setup.
    const writeText = vi.fn(async () => undefined);
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      writable: true,
      value: { writeText },
    });
    renderPanel();

    expect(screen.getByText(JOIN_ID)).toBeInTheDocument();
    expect(screen.getByText(JOIN_PASSWORD)).toBeInTheDocument();

    const copyButtons = screen.getAllByRole("button", { name: COPY_LABEL });
    expect(copyButtons).toHaveLength(2);

    await user.click(copyButtons[0]!);
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(JOIN_ID);

    await user.click(copyButtons[1]!);
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(JOIN_PASSWORD);

    const warning = screen.getByRole("note");
    expect(warning).toHaveTextContent(WARNING_ONCE);
    expect(warning).toHaveTextContent(WARNING_AGAIN);
  });

  it("Continue and Skip both invoke onContinue without requiring copy", async () => {
    const user = userEvent.setup();
    const { onContinue } = renderPanel();

    expect(onContinue).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: CONTINUE_LABEL }));
    expect(onContinue).toHaveBeenCalledTimes(1);

    await user.click(screen.getByRole("button", { name: SKIP_LABEL }));
    expect(onContinue).toHaveBeenCalledTimes(2);
  });

  it("uses Postcard Atlas AccountEntryShell with φ split and 56px credential fields", () => {
    const { container } = renderPanel();

    const shell = container.querySelector(".auth-shell");
    expect(shell).toBeTruthy();
    expect(shell).toHaveAttribute("data-shell", "AccountEntryShell");
    expect(shell?.className ?? "").toMatch(PHI_SPLIT_CLASS);

    expect(screen.getByText(BRAND)).toBeInTheDocument();

    const rail = container.querySelector("[class*='max-w-[377px]']");
    expect(rail).toBeTruthy();
    expect(rail?.className ?? "").toMatch(RAIL_MAX_CLASS);

    const progress = screen.getByLabelText(/create progress/i);
    expect(within(progress).getByText("Create")).toBeInTheDocument();
    expect(within(progress).getByText("Invite")).toBeInTheDocument();

    expect(screen.getByText(JOIN_ID).className).toMatch(FIELD_HEIGHT_CLASS);
    expect(screen.getByText(JOIN_PASSWORD).className).toMatch(
      FIELD_HEIGHT_CLASS,
    );

    // Draft v2 invite-handoff gallery captions (not login/register gallery).
    expect(
      screen.getByRole("heading", { name: /Invite the group once/i }),
    ).toBeInTheDocument();

    for (const btn of screen.getAllByRole("button", { name: COPY_LABEL })) {
      expect(btn.className).toMatch(FIELD_HEIGHT_CLASS);
    }

    expect(
      screen.getByRole("button", { name: CONTINUE_LABEL }).className,
    ).toMatch(FIELD_HEIGHT_CLASS);

    expect(
      container.querySelector('[data-auth-media="desktop"]'),
    ).toBeTruthy();
  });
});
