import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ExternalLinkAction } from "../ExternalLinkAction";

describe("ExternalLinkAction", () => {
  it("renders icon-only external links", () => {
    render(
      <ExternalLinkAction
        className="icon-action"
        href="https://example.test/doc"
        openLabel="Open document"
        variant="icon"
      />,
    );

    const action = screen.getByRole("link", { name: "Open document" });
    expect(action).toHaveAttribute("href", "https://example.test/doc");
    expect(action).toHaveClass("icon-action");
    expect(action.querySelector(".icon")).toBeInTheDocument();
  });

  it("renders inline external links with configurable icon placement", () => {
    render(
      <ExternalLinkAction
        className="inline-action"
        href="https://example.test/booking"
        iconPosition="start"
        openLabel="Open booking"
        variant="inline"
      />,
    );

    const action = screen.getByRole("link", { name: "Open booking" });
    expect(action).toHaveClass("inline-action");
    expect(action).toHaveTextContent("Open booking");
  });

  it("renders button-style external links and blocked states", () => {
    const { rerender } = render(
      <ExternalLinkAction
        buttonVariant="ghost"
        className="button-action"
        href="https://photos.example.test/album"
        openLabel="Open album"
      />,
    );

    expect(screen.getByRole("link", { name: "Open album" })).toHaveClass("button-action");

    rerender(
      <ExternalLinkAction
        blockedLabel="Open blocked"
        blockedMode="button"
        className="button-action"
        href={null}
        openLabel="Open album"
      />,
    );

    expect(screen.getByRole("button", { name: "Open blocked" })).toBeDisabled();

    rerender(
      <ExternalLinkAction
        blockedLabel="Unsafe link blocked"
        blockedMode="notice"
        href={null}
        openLabel="Open album"
      />,
    );

    expect(screen.getByText("Unsafe link blocked").tagName).toBe("STRONG");
  });
});
