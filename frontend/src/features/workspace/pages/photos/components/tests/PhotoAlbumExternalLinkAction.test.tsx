import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PhotoAlbumExternalLinkAction } from "../PhotoAlbumExternalLinkAction";

describe("PhotoAlbumExternalLinkAction", () => {
  it("renders safe album links with external-link affordance", () => {
    render(
      <PhotoAlbumExternalLinkAction
        blockedLabel="Open blocked"
        blockedMode="button"
        buttonClassName="w-auto"
        href="https://photos.example.test/album"
        openLabel="Open album"
        variant="ghost"
      />,
    );

    const link = screen.getByRole("link", { name: "Open album" });
    expect(link).toHaveAttribute("href", "https://photos.example.test/album");
    expect(link).toHaveClass("w-auto");
    expect(link.querySelector(".icon")).toBeInTheDocument();
  });

  it("renders blocked card actions as disabled buttons", () => {
    render(
      <PhotoAlbumExternalLinkAction
        blockedLabel="Open blocked"
        blockedMode="button"
        href={null}
        openLabel="Open album"
      />,
    );

    expect(screen.getByRole("button", { name: "Open blocked" })).toBeDisabled();
  });

  it("renders blocked inspector actions as a warning notice", () => {
    render(
      <PhotoAlbumExternalLinkAction
        blockedLabel="Unsafe link blocked"
        blockedMode="notice"
        href={null}
        openLabel="Open album"
      />,
    );

    expect(screen.getByText("Unsafe link blocked").tagName).toBe("STRONG");
    expect(screen.queryByRole("button", { name: "Unsafe link blocked" })).not.toBeInTheDocument();
  });
});
